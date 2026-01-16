import type { 
    AstNode, 
    CommentProvider, 
    DocumentationProvider, 
    MaybePromise,
    Reference,
    LangiumDocument
} from "langium";
import { CstUtils, isReference, isAstNodeWithComment, isJSDoc, parseJSDoc } from "langium";
import type { Hover, HoverParams } from "vscode-languageserver";
import * as ast from '../../generated/ast.js';
import type { LangiumServices } from "langium/lsp";
import { AstNodeHoverProvider } from "langium/lsp";
import { keywordExplanations } from './domain-lang-keywords.js';
import { QualifiedNameProvider } from '../domain-lang-naming.js';
import type { DomainLangServices } from '../../domain-lang-module.js';

/**
 * Provides hover information for DomainLang elements in the editor.
 *
 * - Handles all major AST node types (Domain, BoundedContext, Namespace, etc.)
 * - Uses Markdown for rich hover content
 * - Designed for maintainability and extensibility
 * - Defensive error handling for incomplete or invalid nodes
 *
 * @remarks
 * Extend this class to add new hover behaviors for custom node types.
 */
export class DomainLangHoverProvider extends AstNodeHoverProvider {
    /** Provides documentation for AST nodes. */
    protected readonly documentationProvider: DocumentationProvider;
    /** Provides comment blocks for AST nodes. */
    protected readonly commentProvider: CommentProvider;
    /** Provides qualified names for references. */
    protected readonly qualifiedNameProvider: QualifiedNameProvider;

    /**
     * @param services Langium language services
     */
    constructor(services: LangiumServices) {
        super(services);
        this.documentationProvider = services.documentation.DocumentationProvider;
        this.commentProvider = services.documentation.CommentProvider;
        // Type-safe access with proper DomainLangServices
        const domainServices = services as DomainLangServices;
        this.qualifiedNameProvider = domainServices.references.QualifiedNameProvider;
    }

    /**
     * Returns hover content for a given document position.
     * Handles keywords, references, and AST nodes.
     */
    override async getHoverContent(document: LangiumDocument, params: HoverParams): Promise<Hover | undefined> {
        try {
            const rootNode = document.parseResult?.value?.$cstNode;
            if (rootNode) {
                const offset = document.textDocument.offsetAt(params.position);
                const cstNode = CstUtils.findDeclarationNodeAtOffset(rootNode, offset, this.grammarConfig.nameRegexp);
                if (cstNode && cstNode.offset + cstNode.length > offset) {
                    const targetNodes = this.references.findDeclarations(cstNode);
                    const targetNode = targetNodes?.[0];  // Get first declaration
                    if (targetNode) {
                        const content = await this.getAstNodeHoverContent(targetNode);
                        if (content) {
                            return {
                                contents: {
                                    kind: 'markdown',
                                    value: content
                                }
                            };
                        }
                    }
                    if (cstNode.astNode && ast.isThisRef(cstNode.astNode)) {
                        const content = await this.getAstNodeHoverContent(cstNode.astNode);
                        if (content) {
                            return {
                                contents: {
                                    kind: 'markdown',
                                    value: content
                                }
                            };
                        }
                    }
                    // Add support for documentation on keywords (PR #1842)
                    if (cstNode.grammarSource?.$type === 'Keyword') {
                        const keywordHover = this.getKeywordHoverContent(cstNode.grammarSource);
                        if (keywordHover) {
                            return keywordHover;
                        }
                        
                        // Fallback: Custom DDD pattern dictionary for rich explanations
                        const explanation = keywordExplanations[cstNode.text.toLowerCase()];
                        if (explanation) {
                            return {
                                contents: {
                                    kind: 'markdown',
                                    value: `💡 ` + explanation
                                }
                            };
                        }
                    }
                }
            }
        } catch (error) {
            // Log error for diagnostics, but do not throw
            console.error('Error in getHoverContent:', error);
        }
        return undefined;
    }

    /**
     * Returns hover content for a given AST node.
     * Handles all major DomainLang node types.
     *
     * @param node The AST node to provide hover for
     */
    protected getAstNodeHoverContent(node: AstNode): MaybePromise<string | undefined> {
        try {
            const content = this.documentationProvider.getDocumentation(node);
            const commentBlock = content ? `*${content}*\n\n` : '';
            
            // --- Domain ---
            if (ast.isDomain(node)) {
                const n = node as ast.Domain;
                let description = '';
                let vision = '';
                let classification = '';
                let classificationRef: Reference<ast.Classification> | undefined = undefined;
                for (const doc of n.documentation) {
                    if (ast.isDescriptionBlock(doc)) description = doc.description;
                    if (ast.isVisionBlock(doc)) vision = doc.vision;
                    if (ast.isDomainClassificationBlock(doc)) {
                        classification = this.getRefName(doc.classification);
                        classificationRef = doc.classification;
                    }
                }

                // Build signature line
                const signatureParts = ['Domain', n.name];
                if (n.parent?.ref?.name) signatureParts.push('in', n.parent.ref.name);
                const signature = `\`\`\`domain-lang\n${signatureParts.join(' ')}\n\`\`\``;

                const fields: string[] = [signature];
                if (description) fields.push(description);
                if (vision || classification || n.parent) fields.push('---');
                if (vision) fields.push(`**Vision:** ${vision}`);
                if (classification) fields.push(`**Classification:** ${this.refLink(classificationRef, classification)}`);
                if (n.parent) fields.push(`**Parent:** ${this.refLink(n.parent)}`);

                return (commentBlock ? `${commentBlock}\n\n---\n\n` : '') + 
                       `📁 **\`(domain)\` ${n.name}**\n\n` + 
                       fields.join('\n\n');
            }

            // --- ThisRef ---
            if(ast.isThisRef(node)) {

                let parent = node.$container;
                while (parent) {
                    if (
                        ast.isDomain(parent) ||
                        ast.isBoundedContext(parent) ||
                        ast.isNamespaceDeclaration(parent) ||
                        ast.isContextMap(parent) ||
                        ast.isDomainMap(parent) ||
                        ast.isModel(parent)
                    ) {
                        return this.getAstNodeHoverContent(parent);
                    }
                    parent = parent.$container;
                }

                return `\`*this*\` refers to the current context`;
            }


            // --- BoundedContext ---
            if (ast.isBoundedContext(node)) {
                const n = node as ast.BoundedContext;
                // Find the relevant documentation blocks
                const descriptionBlock = n.documentation.find(ast.isDescriptionBlock);
                const teamBlock = n.documentation.find(ast.isTeamBlock);
                const classifiersBlock = n.documentation.find(ast.isBoundedContextClassificationBlock);
                const relationshipsBlock = n.documentation.find(ast.isRelationshipsBlock);
                const terminologyBlock = n.documentation.find(ast.isTerminologyBlock);
                const decisionsBlock = n.documentation.find(ast.isDecisionsBlock);

                // Extract values from blocks
                const description = descriptionBlock ? descriptionBlock.description : undefined;
                const team = teamBlock?.team;
                const ownerLabel = team ? team.ref?.name : '';
                const ownerRef = teamBlock?.team ? teamBlock.team.ref : undefined;
                const businessModel = classifiersBlock?.businessModel;
                const businessModelRef = classifiersBlock?.businessModel ? classifiersBlock.businessModel.ref : undefined;
                const lifecycle = classifiersBlock?.lifecycle;
                const lifecycleRef = classifiersBlock?.lifecycle ? classifiersBlock.lifecycle.ref : undefined;
                const role = classifiersBlock?.role;
                const roleRef = classifiersBlock?.role ? classifiersBlock.role.ref : undefined;
                const roleName = role ? roleRef?.name : n.role?.ref?.name;
                const teamName = team ? ownerLabel : n.team?.ref?.name;
                const relationships = relationshipsBlock?.relationships ?? [];
                const terminology = terminologyBlock?.terms ?? [];
                const decisions = decisionsBlock?.decisions ?? [];

                // Build signature line (TypeScript-style)
                const signatureParts = ['boundedcontext', n.name];
                if (n.domain?.ref?.name) signatureParts.push('for', n.domain.ref.name);
                if (roleName) signatureParts.push('as', roleName);
                if (teamName) signatureParts.push('by', teamName);
                const signature = `\`\`\`domain-lang\n${signatureParts.join(' ')}\n\`\`\``;

                const fields: string[] = [signature];
                if (description) fields.push(description);
                if (role || team || businessModel || lifecycle) fields.push('---');
                if (role) fields.push(`🔖 **Role:** ${this.refLink(roleRef)}`);
                if (team) fields.push(`👥 **Team:** ${this.refLink(ownerRef, String(ownerLabel))}`);
                if (businessModel) fields.push(`💼 **Business Model:** ${this.refLink(businessModelRef)}`);
                if (lifecycle) fields.push(`🔄 **Lifecycle:** ${this.refLink(lifecycleRef)}`);
                if (relationships.length) fields.push(`**Relationships:**\n${relationships.map(r => `- ${this.refLink(r.left?.link)} ${r.arrow} ${this.refLink(r.right?.link)}${r.type ? ' `' + r.type + '`' : ''}`).join('\n')}`);
                if (terminology.length) fields.push(`**Terminology:**\n${terminology.map(t => `- \`${t.name}\`: ${t.meaning}`).join('\n')}`);
                if (decisions.length) fields.push(`**Decisions:**\n${decisions.map(d => `- \`${d.name}\`: ${d.value}`).join('\n')}`);

                return (commentBlock ? `${commentBlock}\n\n---\n\n` : '') + 
                       `📕 **\`(boundedcontext)\` ${n.name}**\n\n` + 
                       fields.join('\n\n');
            }

            // --- NamespaceDeclaration ---
            if (ast.isNamespaceDeclaration && ast.isNamespaceDeclaration(node)) {
                const n = node as ast.NamespaceDeclaration;
                const fields: string[] = [
                    `Contains ${n.children.length} elements.`
                ];
                return (commentBlock ? `${commentBlock}\n\n---\n\n` : '') + 
                       `🧭 **\`(namespace)\` ${n.name}**\n\n` + 
                       fields.join('\n\n');
            }

            // --- ContextMap ---
            if (ast.isContextMap && ast.isContextMap(node)) {
                const n = node as ast.ContextMap;
                const fields: string[] = [];
                if (n.boundedContexts.length) {
                    fields.push('---');
                    fields.push(`**📕 Bounded Contexts**\n${n.boundedContexts.flatMap(bc => bc.items.map(item => `- ${this.refLink(item.ref)}`)).join('\n')}`);
                }
                if (n.relationships.length) {
                    fields.push('---');
                    fields.push(`**🔗 Relationships**\n${n.relationships.map(r => `- ${this.refLink(r.left?.link)} ${r.arrow} ${this.refLink(r.right?.link)}${r.type ? ' \`' + r.type + '\`' : ''}`).join('\n')}`);
                }
                return (commentBlock ? `${commentBlock}\n\n---\n\n` : '') + 
                       `🗺️ **\`(contextmap)\` ${n.name}**\n\n` + 
                       fields.join('\n\n');
            }
            // --- DomainMap ---
            if (ast.isDomainMap && ast.isDomainMap(node)) {
                const n = node as ast.DomainMap;
                const fields: string[] = [];
                if (n.domains.length) {
                    fields.push('---');
                    fields.push(`**📁 Domains**\n${n.domains.flatMap(d => d.items.map(item => `- ${this.refLink(item.ref)}`)).join('\n')}`);
                }
                return (commentBlock ? `${commentBlock}\n\n---\n\n` : '') + 
                       `🗺️ **\`(domainmap)\` ${n.name}**\n\n` + 
                       fields.join('\n\n');
            }
            
            // --- Decision ---
            if (ast.isDecision && ast.isDecision(node)) {
                const n = node as ast.Decision;
                const fields: string[] = [];
                if (n.value) {
                    fields.push('---');
                    fields.push(`*Definition:* ${n.value}`);
                }
                return (commentBlock ? `${commentBlock}\n\n---\n\n` : '') + 
                       `⚖️ **\`(decision)\` ${n.name}**\n\n` + 
                       fields.join('\n\n');
            }
            // --- Policy ---
            if (ast.isPolicy && ast.isPolicy(node)) {
                const n = node as ast.Policy;
                const fields: string[] = [];
                if (n.value) {
                    fields.push('---');
                    fields.push(`*Definition:* ${n.value}`);
                }
                return (commentBlock ? `${commentBlock}\n\n---\n\n` : '') + 
                       `📜 **\`(policy)\` ${n.name}**\n\n` + 
                       fields.join('\n\n');
            }
            // --- BusinessRule ---
            if (ast.isBusinessRule && ast.isBusinessRule(node)) {
                const n = node as ast.BusinessRule;
                const fields: string[] = [];
                if (n.value) {
                    fields.push('---');
                    fields.push(`*Definition:* ${n.value}`);
                }
                return (commentBlock ? `${commentBlock}\n\n---\n\n` : '') + 
                       `⚖️ **\`(rule)\` ${n.name}**\n\n` + 
                       fields.join('\n\n');
            }
            // --- DomainTerm ---
            if (ast.isDomainTerm && ast.isDomainTerm(node)) {
                const n = node as ast.DomainTerm;
                const fields: string[] = [];
                if (n.meaning) {
                    fields.push('---');
                    fields.push(`*${n.meaning}*`);
                }
                return (commentBlock ? `${commentBlock}\n\n---\n\n` : '') + 
                       `🗝️ **\`(term)\` ${n.name}**\n\n` + 
                       fields.join('\n\n');
            }

            // --- Team ---
            if (ast.isTeam && ast.isTeam(node)) {
                const n = node as ast.Team;
                return (commentBlock ? `${commentBlock}\n\n---\n\n` : '') + 
                       `👥 **\`(team)\` ${n.name}**`;
            }

            // --- Classification ---
            if (ast.isClassification && ast.isClassification(node)) {
                const n = node as ast.Classification;
                return (commentBlock ? `${commentBlock}\n\n---\n\n` : '') + 
                       `🏷️ **\`(classification)\` ${n.name}**`;
            }

            // --- Metadata ---
            if (ast.isMetadata && ast.isMetadata(node)) {
                const n = node as ast.Metadata;
                return (commentBlock ? `${commentBlock}\n\n---\n\n` : '') + 
                       `🔖 **\`(metadata)\` ${n.name}**`;
            }

            // --- Relationship ---
            if (ast.isRelationship && ast.isRelationship(node)) {
                const n = node as ast.Relationship;
                const leftPatterns = n.leftPatterns.join(', ');
                const rightPatterns = n.rightPatterns.join(', ');
                const fields: string[] = [];
                fields.push(`${this.refLink(n.left.link)} ${n.arrow} ${this.refLink(n.right.link)}`);
                if (n.type) fields.push(`**Type:** \`${n.type}\``);
                if (leftPatterns) fields.push(`**Left patterns:** ${leftPatterns}`);
                if (rightPatterns) fields.push(`**Right patterns:** ${rightPatterns}`);
                return (commentBlock ? `${commentBlock}\n\n---\n\n` : '') + 
                       `🔗 **\`(relationship)\`**\n\n` + 
                       fields.join('\n\n');
            }

            // --- ImportStatement ---
            if (ast.isImportStatement && ast.isImportStatement(node)) {
                const n = node as ast.ImportStatement;
                const fields: string[] = [];
                fields.push(`**URI:** \`${n.uri}\``);
                if (n.symbols.length) fields.push(`**Imports:** ${n.symbols.map(s => `\`${s}\``).join(', ')}`);
                if (n.alias) fields.push(`**Alias:** \`${n.alias}\``);
                if (n.integrity) fields.push(`**Integrity:** \`${n.integrity}\``);
                return (commentBlock ? `${commentBlock}\n\n---\n\n` : '') + 
                       `📦 **\`(import)\`**\n\n` + 
                       fields.join('\n\n');
            }

            // --- Fallback ---
            const title = ast.isType(node) ? `${node.name}` : node.$type.toLowerCase();
            return (commentBlock ? `${commentBlock}\n\n---\n\n` : '') + 
                   `ℹ️ **\`(${node.$type.toLowerCase()})\`${ast.isType(node) ? ' ' + title : ''}**`;
        } catch (error) {
            // Defensive: fallback to minimal hover info
            console.error('Error in getAstNodeHoverContent:', error);
            return 'Unable to display complete information.';
        }
    }

    /**
     * Returns the name of a referenced type, or an empty string if not resolvable.
     * 
     * @param ref - Reference to a type or the type itself
     * @returns The name of the type or empty string
     */
    private getRefName(ref: ast.Type | Reference<ast.Type> | undefined): string {
        const node = isReference(ref) ? ref.ref : ref;
        if (node && ast.isType(node)) {
            return node.name;
        }
        return '';
    }

    /**
     * Creates a markdown link to a referenced entity.
     * 
     * @param ref - Reference to a type or the type itself
     * @param label - Optional custom label (defaults to qualified name)
     * @returns Markdown link string or empty string if unresolvable
     */
    private refLink(
        ref: Reference<ast.Type> | ast.Type | undefined,
        label?: string
    ): string {
        // If a label is provided, use it directly
        if (label) {
            return `[${label}](#${encodeURIComponent(label)})`;
        }

        // Resolve the actual node
        const node = isReference(ref) ? ref.ref : ref;

        // If node is a Type, get its qualified name
        if (node && ast.isType(node)) {
            let linkLabel = node.name;
            try {
                linkLabel = this.qualifiedNameProvider.getQualifiedName(node.$container, node.name);
            } catch {
                // fallback to name
            }
            return `[${linkLabel}](#${encodeURIComponent(linkLabel)})`;
        }
        return '';
    }
    
    /**
     * Formats hover content as markdown with consistent structure.
    /**
     * Provides hover content for keywords based on grammar JSDoc comments.
     * Implementation follows Langium PR #1842 pattern.
     * 
     * @param node The grammar AST node (Keyword) to get documentation for
     * @returns Hover content with markdown documentation, or undefined if no documentation found
     */
    protected override getKeywordHoverContent(node: AstNode): MaybePromise<Hover | undefined> {
        // First: Check if the grammar node has a $comment property (from JSDoc)
        let comment = isAstNodeWithComment(node) ? node.$comment : undefined;
        
        // Fallback: Look for multiline comments in the CST
        if (!comment) {
            comment = CstUtils.findCommentNode(node.$cstNode, ['ML_COMMENT'])?.text;
        }
        
        // Parse and convert JSDoc to markdown if found
        if (comment && isJSDoc(comment)) {
            const content = parseJSDoc(comment).toMarkdown();
            if (content) {
                return {
                    contents: {
                        kind: 'markdown',
                        value: content
                    }
                };
            }
        }
        
        return undefined;
    }
}

