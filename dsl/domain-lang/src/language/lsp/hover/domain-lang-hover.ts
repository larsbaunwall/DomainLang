import {CstUtils, AstNode, CommentProvider, DocumentationProvider, isReference, MaybePromise } from "langium";
import { Hover, HoverParams, MarkupKind } from "vscode-languageserver";
import * as ast from '../../generated/ast.js';
import { AstNodeHoverProvider, LangiumServices } from "langium/lsp";
import { LangiumDocument } from "langium";
import { keywordExplanations } from './domain-lang-keywords.js';
import { QualifiedNameProvider } from '../domain-lang-naming.js';
import type { Reference } from 'langium';

/**
 * Provides hover information for DomainLang elements in the editor.
 *
 * - Handles all major AST node types (Domain, BoundedContext, Group, etc.)
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
        // Defensive: fallback to undefined if not present
        this.qualifiedNameProvider = (services as any).references?.QualifiedNameProvider ?? new QualifiedNameProvider();
    }

    /**
     * Returns hover content for a given document position.
     * Handles keywords, references, and AST nodes.
     */
    override getHoverContent(document: LangiumDocument, params: HoverParams): MaybePromise<Hover | undefined> {
        try {
            const rootNode = document.parseResult?.value?.$cstNode;
            if (rootNode) {
                const offset = document.textDocument.offsetAt(params.position);
                const cstNode = CstUtils.findDeclarationNodeAtOffset(rootNode, offset, this.grammarConfig.nameRegexp);
                if (cstNode && cstNode.offset + cstNode.length > offset) {
                    const targetNode = this.references.findDeclaration(cstNode);
                    if (targetNode) {
                        return this.getAstNodeHoverContent(targetNode);
                    }
                    if (cstNode.astNode && ast.isThisRef(cstNode.astNode)) {
                        return this.getAstNodeHoverContent(cstNode.astNode);
                    }
                    if (cstNode.grammarSource?.$type === 'Keyword') {
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
    protected getAstNodeHoverContent(node: AstNode): MaybePromise<Hover | undefined> {
        try {
            const content = this.documentationProvider.getDocumentation(node);
            const commentBlock = content ? `*${content}*\n\n` : '';
            
            // --- Domain ---
            if (ast.isDomain(node)) {
                const n = node as ast.Domain;
                let description = '';
                let vision = '';
                let classifier = '';
                let classifierRef: Reference<ast.Classification> | undefined = undefined;
                for (const doc of n.documentation) {
                    if (ast.isDescriptionBlock(doc)) description = doc.description;
                    if (ast.isVisionBlock(doc)) vision = doc.vision;
                    if (ast.isClassifierBlock(doc)) {
                        classifier = this.getRefName(doc.classifier);
                        classifierRef = doc.classifier;
                    }
                }
                return {
                    contents: {
                        kind: MarkupKind.Markdown,
                        value: this.hoverTemplate(
                            '📁',
                            ` **\`(domain)\` ${n.name}**`,
                            [
                                `${n.parentDomain ? `*Part of ${this.refLink(n.parentDomain)} domain*` : ''}`,
                                description ? `---\n\n&nbsp;\n\n*${description}*\n\n&nbsp;` : undefined,
                                classifier ? `�� Classifier: ${this.refLink(classifierRef, classifier)}` : undefined,
                                vision ? `�� Vision: ${vision}` : undefined
                            ],
                            commentBlock
                        )
                    }
                };
            }

            // --- ThisRef ---
            if(ast.isThisRef(node)) {

                let parent = node.$container;
                while (parent) {
                    if (
                        ast.isDomain(parent) ||
                        ast.isBoundedContext(parent) ||
                        ast.isGroupDeclaration(parent) ||
                        ast.isContextMap(parent) ||
                        ast.isDomainMap(parent) ||
                        ast.isModel(parent)
                    ) {
                        return this.getAstNodeHoverContent(parent);
                    }
                    parent = parent.$container;
                }

                return {
                    contents: {
                        kind: 'markdown',
                        value: `\`*this*\` refers to the current context`
                    }
                };
            }


            // --- BoundedContext ---
            if (ast.isBoundedContext(node)) {
                const n = node as ast.BoundedContext;
                // Find the relevant documentation blocks
                const descriptionBlock = n.documentation.find(ast.isDescriptionBlock);
                const teamBlock = n.documentation.find(ast.isTeamBlock);
                const classifiersBlock = n.documentation.find(ast.isClassifiersBlock);
                const relationshipsBlock = n.documentation.find(ast.isRelationshipsBlock);
                const terminologyBlock = n.documentation.find(ast.isTerminologyBlock);
                const decisionsBlock = n.documentation.find(ast.isDecisionsBlock);

                // Extract values from blocks
                const description = descriptionBlock ? descriptionBlock.description : undefined;
                const team = teamBlock?.team;
                const teamLabel = team ? team.ref?.name : '';
                const teamRef = teamBlock?.team ? teamBlock.team.ref : undefined;
                const businessModel = classifiersBlock?.businessModel;
                const businessModelLabel = businessModel ? businessModel.ref?.name : '';
                const businessModelRef = classifiersBlock?.businessModel ? classifiersBlock.businessModel.ref : undefined;
                const evolution = classifiersBlock?.evolution;
                const evolutionLabel = evolution ? evolution.ref?.name : '';
                const evolutionRef = classifiersBlock?.evolution ? classifiersBlock.evolution.ref : undefined;
                const roleClassifier = classifiersBlock?.roleClassifier;
                const roleClassifierLabel = roleClassifier ? roleClassifier.ref?.name : '';
                const roleClassifierRef = classifiersBlock?.roleClassifier ? classifiersBlock.roleClassifier.ref : undefined;
                const relationships = relationshipsBlock?.relationships ?? [];
                const terminology = terminologyBlock?.domainTerminology ?? [];
                const decisions = decisionsBlock?.decisions ?? [];

                return {
                    contents: {
                        kind: MarkupKind.Markdown,
                        value: this.hoverTemplate(
                            '📕',
                            ` **\`(boundedcontext)\` ${n.name}**`,
                            [
                                `${n.domain?.ref ? `*Part of ${this.refLink(n.domain.ref)} domain*` : ''}`,
                                description ? `---\n\n&nbsp;\n\n*${description}*\n\n&nbsp;` : undefined,
                                roleClassifier ? `🔖 Role: ${this.refLink(roleClassifierRef)}` : undefined,
                                team ? `👥 Team: ${this.refLink(teamRef, String(teamLabel))}` : undefined,
                                businessModel ? `💼 Business Model: ${this.refLink(businessModelRef)}` : undefined,
                                evolution ? `🔄 Evolution: ${this.refLink(evolutionRef)}` : undefined,
                                relationships.length ? `---\n\n&nbsp;\n\n#### 🔗 Relationships\n${relationships.map(r => `- ${this.refLink(r.left?.link)} ${r.arrow} ${this.refLink(r.right?.link)}${r.type ? '(' + r.type + ')' : ''}`).join('\n')}` : undefined,
                                terminology.length ? `---\n\n&nbsp;\n\n#### 🗝️ Terminology\n${terminology.map(t => `- **${t.name}**: _${t.meaning}_`).join('\n')}` : undefined,
                                decisions.length ? `---\n\n&nbsp;\n\n#### ⚖️ Decisions\n${decisions.map(d => `- **${d.name}**: _${d.value}_`).join('\n')}` : undefined
                            ],
                            commentBlock
                        )
                    }
                };
            }

            // --- GroupDeclaration ---
            if (ast.isGroupDeclaration && ast.isGroupDeclaration(node)) {
                const n = node as ast.GroupDeclaration;
                return {
                    contents: {
                        kind: 'markdown',
                        value: this.hoverTemplate(
                            '📦',
                            ` **\`(group)\` ${n.name}**`,
                            [
                                `Contains ${n.children.length} elements.`
                            ],
                            commentBlock
                        )
                    }
                };
            }

            // --- ContextMap ---
            if (ast.isContextMap && ast.isContextMap(node)) {
                const n = node as ast.ContextMap;
                return {
                    contents: {
                        kind: 'markdown',
                        value: this.hoverTemplate(
                            '🗺️',
                            ` **\`(contextmap)\` ${n.name}**`,
                            [
                                n.boundedContexts.length ? `---\n\n&nbsp;\n\n#### 📕 Bounded Contexts\n${n.boundedContexts.map(bc => `- ${this.refLink(bc.ref)}`).join('\n')}` : undefined,
                                n.relationships.length ? `---\n\n&nbsp;\n\n#### 🔗 Relationships\n${n.relationships.map(r => `- ${this.refLink(r.left?.link)} ${r.arrow} ${this.refLink(r.right?.link)}${r.type ? '(' + r.type + ')' : ''}`).join('\n')}` : undefined
                            ],
                            commentBlock
                        )
                    }
                };
            }
            // --- DomainMap ---
            if (ast.isDomainMap && ast.isDomainMap(node)) {
                const n = node as ast.DomainMap;
                return {
                    contents: {
                        kind: 'markdown',
                        value: this.hoverTemplate(
                            '🗺️',
                            ` **\`(domainmap)\` ${n.name}**`,
                            [
                                n.domains.length ? `---\n\n&nbsp;\n\n#### 📁 Domains\n${n.domains.map(d => `- ${this.refLink(d.ref)}`).join('\n')}` : undefined
                            ],
                            commentBlock
                        )
                    }
                };
            }
            
            // --- Decision ---
            if (ast.isDecision && ast.isDecision(node)) {
                const n = node as ast.Decision;
                return {
                    contents: {
                        kind: 'markdown',
                        value: this.hoverTemplate(
                            '⚖️',
                            ` **\`(decision)\` ${n.name}**`,
                            [
                                n.value ? `---\n\n&nbsp;\n\n*Definition:* ${n.value}` : undefined
                            ],
                            commentBlock
                        )
                    }
                };
            }
            // --- Policy ---
            if (ast.isPolicy && ast.isPolicy(node)) {
                const n = node as ast.Policy;
                return {
                    contents: {
                        kind: 'markdown',
                        value: this.hoverTemplate(
                            '📜',
                            ` **\`(policy)\` ${n.name}**`,
                            [
                                n.value ? `---\n\n&nbsp;\n\n*Definition:* ${n.value}` : undefined
                            ],
                            commentBlock
                        )
                    }
                };
            }
            // --- BusinessRule ---
            if (ast.isBusinessRule && ast.isBusinessRule(node)) {
                const n = node as ast.BusinessRule;
                return {
                    contents: {
                        kind: 'markdown',
                        value: this.hoverTemplate(
                            '⚖️',
                            ` **\`(rule)\` ${n.name}**`,
                            [
                                n.value ? `---\n\n&nbsp;\n\n*Definition:* ${n.value}` : undefined
                            ],
                            commentBlock
                        )
                    }
                };
            }
            // --- DomainTerm ---
            if (ast.isDomainTerm && ast.isDomainTerm(node)) {
                const n = node as ast.DomainTerm;
                return {
                    contents: {
                        kind: 'markdown',
                        value: this.hoverTemplate(
                            '🗝️',
                            ` **\`(term)\` ${n.name}**`,
                            [
                                n.meaning ? `---\n\n&nbsp;\n\n*${n.meaning}*` : undefined
                            ],
                            commentBlock
                        )
                    }
                };
            }

            // --- Fallback ---
            return {
                contents: {
                    kind: 'markdown',
                    value: this.hoverTemplate(
                        'ℹ️',
                        ast.isType(node) ? ` **\`(${node.$type.toLowerCase()})\` ${node.name}**` : ` **\`(${node.$type.toLowerCase()})\`**`,
                        [
                        ],
                        commentBlock
                    )
                }
            };
        } catch (error) {
            // Defensive: fallback to minimal hover info
            console.error('Error in getAstNodeHoverContent:', error);
            return {
                contents: {
                    kind: 'markdown',
                    value: 'Unable to display complete information.'
                }
            };
        }
    }

    /**
     * Returns the name of a referenced type, or an empty string if not resolvable.
     */
    private getRefName(ref: ast.Type | Reference<ast.Type> | undefined): string {
        const node = isReference(ref) ? ref.ref : ref;
        if (node && ast.isType(node)) {
            return node.name;
        }
        return '';
    }

    /**
     * Returns a markdown link to a referenced entity, or an empty string if not resolvable.
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
     * Formats the hover content as markdown.
     *
     * @param icon Emoji or icon for the node type
     * @param title Title for the hover block
     * @param fields List of markdown fields to include
     * @param commentBlock Optional comment/documentation block
     */
    private hoverTemplate(
        icon: string,
        title: string,
        fields: Array<string | undefined>,
        commentBlock?: string
    ): string {
        return (
            (commentBlock ? `${commentBlock}\n\n---\n\n&nbsp;\n\n` : '') +
            `### ${icon} ${title}\n\n` +
            fields.filter(Boolean).join('\n\n')
        );
    }
}

