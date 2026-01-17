import type {
    AstNode,
    CommentProvider,
    DocumentationProvider,
    LangiumDocument,
    MaybePromise,
    Reference
} from 'langium';
import { CstUtils, isAstNodeWithComment, isJSDoc, isReference, parseJSDoc } from 'langium';
import type { LangiumServices } from 'langium/lsp';
import { AstNodeHoverProvider } from 'langium/lsp';
import type { Hover, HoverParams } from 'vscode-languageserver';
import * as ast from '../../generated/ast.js';
import type { DomainLangServices } from '../../domain-lang-module.js';
import { QualifiedNameProvider } from '../domain-lang-naming.js';
import { keywordExplanations } from './domain-lang-keywords.js';
import { effectiveRole, effectiveTeam } from '../../sdk/resolution.js';

/**
 * Provides hover information for DomainLang elements.
 */
export class DomainLangHoverProvider extends AstNodeHoverProvider {
    protected readonly documentationProvider: DocumentationProvider;
    protected readonly commentProvider: CommentProvider;
    protected readonly qualifiedNameProvider: QualifiedNameProvider;

    constructor(services: LangiumServices) {
        super(services);
        this.documentationProvider = services.documentation.DocumentationProvider;
        this.commentProvider = services.documentation.CommentProvider;
        const domainServices = services as DomainLangServices;
        this.qualifiedNameProvider = domainServices.references.QualifiedNameProvider;
    }

    override async getHoverContent(document: LangiumDocument, params: HoverParams): Promise<Hover | undefined> {
        try {
            const rootNode = document.parseResult?.value?.$cstNode;
            if (!rootNode) {
                return undefined;
            }

            const offset = document.textDocument.offsetAt(params.position);
            const cstNode = CstUtils.findDeclarationNodeAtOffset(rootNode, offset, this.grammarConfig.nameRegexp);
            if (!cstNode || cstNode.offset + cstNode.length <= offset) {
                return undefined;
            }

            const targetNodes = this.references.findDeclarations(cstNode);
            const targetNode = targetNodes?.[0];
            if (targetNode) {
                const content = await this.getAstNodeHoverContent(targetNode);
                if (content) {
                    return { contents: { kind: 'markdown', value: content } };
                }
            }

            if (cstNode.astNode && ast.isThisRef(cstNode.astNode)) {
                const content = await this.getAstNodeHoverContent(cstNode.astNode);
                if (content) {
                    return { contents: { kind: 'markdown', value: content } };
                }
            }

            if (cstNode.grammarSource?.$type === 'Keyword') {
                const keywordHover = this.getKeywordHoverContent(cstNode.grammarSource);
                if (keywordHover) {
                    return keywordHover;
                }

                const explanation = keywordExplanations[cstNode.text.toLowerCase()];
                if (explanation) {
                    return { contents: { kind: 'markdown', value: `💡 ${explanation}` } };
                }
            }
        } catch (error) {
            console.error('Error in getHoverContent:', error);
        }

        return undefined;
    }

    protected getAstNodeHoverContent(node: AstNode): MaybePromise<string | undefined> {
        try {
            const content = this.documentationProvider.getDocumentation(node);
            const commentBlock = content ? `*${content}*\n\n` : '';

            if (ast.isDomain(node)) {
                const description = node.description ?? '';
                const vision = node.vision ?? '';
                const classificationRef = node.classification;
                const classification = this.getRefName(classificationRef);

                const signatureParts = ['Domain', node.name];
                if (node.parent?.ref?.name) signatureParts.push('in', node.parent.ref.name);
                const signature = `\`\`\`domain-lang\n${signatureParts.join(' ')}\n\`\`\``;

                const fields: string[] = [signature];
                if (description) fields.push(description);
                if (vision || classification || node.parent) fields.push('---');
                if (vision) fields.push(`**Vision:** ${vision}`);
                if (classification) fields.push(`**Classification:** ${this.refLink(classificationRef, classification)}`);
                if (node.parent) fields.push(`**Parent:** ${this.refLink(node.parent)}`);

                return (commentBlock ? `${commentBlock}\n\n---\n\n` : '') +
                    `📁 **\`(domain)\` ${node.name}**\n\n` +
                    fields.join('\n\n');
            }

            if (ast.isThisRef(node)) {
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

                return '*this* refers to the current context';
            }

            if (ast.isBoundedContext(node)) {
                const description = node.description;
                const role = effectiveRole(node);
                const team = effectiveTeam(node);
                const businessModel = node.businessModel?.ref;
                const lifecycle = node.lifecycle?.ref;
                const relationships = node.relationships ?? [];
                const terminology = node.terminology ?? [];
                const decisions = node.decisions ?? [];
                const roleName = role?.name;
                const teamName = team?.name;

                const signatureParts = ['boundedcontext', node.name];
                if (node.domain?.ref?.name) signatureParts.push('for', node.domain.ref.name);
                if (roleName) signatureParts.push('as', roleName);
                if (teamName) signatureParts.push('by', teamName);
                const signature = `\`\`\`domain-lang\n${signatureParts.join(' ')}\n\`\`\``;

                const fields: string[] = [signature];
                if (description) fields.push(description);
                if (role || team || businessModel || lifecycle) fields.push('---');
                if (role) fields.push(`🔖 **Role:** ${this.refLink(role)}`);
                if (team) fields.push(`👥 **Team:** ${this.refLink(team)}`);
                if (businessModel) fields.push(`💼 **Business Model:** ${this.refLink(businessModel)}`);
                if (lifecycle) fields.push(`🔄 **Lifecycle:** ${this.refLink(lifecycle)}`);
                if (relationships.length) {
                    const relationshipLines = relationships.map(rel => `- ${this.refLink(rel.left?.link)} ${rel.arrow} ${this.refLink(rel.right?.link)}${rel.type ? ` \`${rel.type}\`` : ''}`);
                    fields.push(`**Relationships:**\n${relationshipLines.join('\n')}`);
                }
                if (terminology.length) {
                    const termLines = terminology.map(t => `- \`${t.name}\`: ${t.meaning ?? ''}`);
                    fields.push(`**Terminology:**\n${termLines.join('\n')}`);
                }
                if (decisions.length) {
                    const decisionLines = decisions.map(d => `- \`${d.name}\`: ${d.value ?? ''}`);
                    fields.push(`**Decisions:**\n${decisionLines.join('\n')}`);
                }

                return (commentBlock ? `${commentBlock}\n\n---\n\n` : '') +
                    `📕 **\`(boundedcontext)\` ${node.name}**\n\n` +
                    fields.join('\n\n');
            }

            if (ast.isNamespaceDeclaration && ast.isNamespaceDeclaration(node)) {
                const fields: string[] = [`Contains ${node.children.length} elements.`];
                return (commentBlock ? `${commentBlock}\n\n---\n\n` : '') +
                    `🧭 **\`(namespace)\` ${node.name}**\n\n` +
                    fields.join('\n\n');
            }

            if (ast.isContextMap && ast.isContextMap(node)) {
                const fields: string[] = [];
                if (node.boundedContexts.length) {
                    fields.push('---');
                    fields.push(`**📕 Bounded Contexts**\n${node.boundedContexts.flatMap(bc => bc.items.map(item => `- ${this.refLink(item.ref)}`)).join('\n')}`);
                }
                if (node.relationships.length) {
                    fields.push('---');
                    fields.push(`**🔗 Relationships**\n${node.relationships.map(r => `- ${this.refLink(r.left?.link)} ${r.arrow} ${this.refLink(r.right?.link)}${r.type ? ` \`${r.type}\`` : ''}`).join('\n')}`);
                }
                return (commentBlock ? `${commentBlock}\n\n---\n\n` : '') +
                    `🗺️ **\`(contextmap)\` ${node.name}**\n\n` +
                    fields.join('\n\n');
            }

            if (ast.isDomainMap && ast.isDomainMap(node)) {
                const fields: string[] = [];
                if (node.domains.length) {
                    fields.push('---');
                    fields.push(`**📁 Domains**\n${node.domains.flatMap(d => d.items.map(item => `- ${this.refLink(item.ref)}`)).join('\n')}`);
                }
                return (commentBlock ? `${commentBlock}\n\n---\n\n` : '') +
                    `🗺️ **\`(domainmap)\` ${node.name}**\n\n` +
                    fields.join('\n\n');
            }

            if (ast.isDecision && ast.isDecision(node)) {
                const fields: string[] = [];
                if (node.value) {
                    fields.push('---');
                    fields.push(`*Definition:* ${node.value}`);
                }
                return (commentBlock ? `${commentBlock}\n\n---\n\n` : '') +
                    `⚖️ **\`(decision)\` ${node.name}**\n\n` +
                    fields.join('\n\n');
            }

            if (ast.isPolicy && ast.isPolicy(node)) {
                const fields: string[] = [];
                if (node.value) {
                    fields.push('---');
                    fields.push(`*Definition:* ${node.value}`);
                }
                return (commentBlock ? `${commentBlock}\n\n---\n\n` : '') +
                    `📜 **\`(policy)\` ${node.name}**\n\n` +
                    fields.join('\n\n');
            }

            if (ast.isBusinessRule && ast.isBusinessRule(node)) {
                const fields: string[] = [];
                if (node.value) {
                    fields.push('---');
                    fields.push(`*Definition:* ${node.value}`);
                }
                return (commentBlock ? `${commentBlock}\n\n---\n\n` : '') +
                    `⚖️ **\`(rule)\` ${node.name}**\n\n` +
                    fields.join('\n\n');
            }

            if (ast.isDomainTerm && ast.isDomainTerm(node)) {
                const fields: string[] = [];
                if (node.meaning) {
                    fields.push('---');
                    fields.push(`*${node.meaning}*`);
                }
                return (commentBlock ? `${commentBlock}\n\n---\n\n` : '') +
                    `🗝️ **\`(term)\` ${node.name}**\n\n` +
                    fields.join('\n\n');
            }

            if (ast.isTeam && ast.isTeam(node)) {
                return (commentBlock ? `${commentBlock}\n\n---\n\n` : '') +
                    `👥 **\`(team)\` ${node.name}**`;
            }

            if (ast.isClassification && ast.isClassification(node)) {
                return (commentBlock ? `${commentBlock}\n\n---\n\n` : '') +
                    `🏷️ **\`(classification)\` ${node.name}**`;
            }

            if (ast.isMetadata && ast.isMetadata(node)) {
                return (commentBlock ? `${commentBlock}\n\n---\n\n` : '') +
                    `🔖 **\`(metadata)\` ${node.name}**`;
            }

            if (ast.isRelationship && ast.isRelationship(node)) {
                const leftPatterns = node.leftPatterns.join(', ');
                const rightPatterns = node.rightPatterns.join(', ');
                const fields: string[] = [];
                fields.push(`${this.refLink(node.left.link)} ${node.arrow} ${this.refLink(node.right.link)}`);
                if (node.type) fields.push(`**Type:** \`${node.type}\``);
                if (leftPatterns) fields.push(`**Left patterns:** ${leftPatterns}`);
                if (rightPatterns) fields.push(`**Right patterns:** ${rightPatterns}`);
                return (commentBlock ? `${commentBlock}\n\n---\n\n` : '') +
                    `🔗 **\`(relationship)\`**\n\n` +
                    fields.join('\n\n');
            }

            if (ast.isImportStatement && ast.isImportStatement(node)) {
                const fields: string[] = [];
                fields.push(`**URI:** \`${node.uri}\``);
                if (node.symbols.length) fields.push(`**Imports:** ${node.symbols.map(s => `\`${s}\``).join(', ')}`);
                if (node.alias) fields.push(`**Alias:** \`${node.alias}\``);
                if (node.integrity) fields.push(`**Integrity:** \`${node.integrity}\``);
                return (commentBlock ? `${commentBlock}\n\n---\n\n` : '') +
                    `📦 **\`(import)\`**\n\n` +
                    fields.join('\n\n');
            }

            const title = ast.isType(node) ? node.name : node.$type.toLowerCase();
            return (commentBlock ? `${commentBlock}\n\n---\n\n` : '') +
                `ℹ️ **\`(${node.$type.toLowerCase()})\`${ast.isType(node) ? ` ${title}` : ''}**`;
        } catch (error) {
            console.error('Error in getAstNodeHoverContent:', error);
            return 'Unable to display complete information.';
        }
    }

    private getRefName(ref: ast.Type | Reference<ast.Type> | undefined): string {
        const node = isReference(ref) ? ref.ref : ref;
        if (node && ast.isType(node)) {
            return node.name;
        }
        return '';
    }

    private refLink(ref: Reference<ast.Type> | ast.Type | undefined, label?: string): string {
        if (label) {
            return `[${label}](#${encodeURIComponent(label)})`;
        }

        const node = isReference(ref) ? ref.ref : ref;

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

    protected override getKeywordHoverContent(node: AstNode): MaybePromise<Hover | undefined> {
        let comment = isAstNodeWithComment(node) ? node.$comment : undefined;

        if (!comment) {
            comment = CstUtils.findCommentNode(node.$cstNode, ['ML_COMMENT'])?.text;
        }

        if (comment && isJSDoc(comment)) {
            const markdown = parseJSDoc(comment).toMarkdown();
            if (markdown) {
                return { contents: { kind: 'markdown', value: markdown } };
            }
        }

        return undefined;
    }
}

