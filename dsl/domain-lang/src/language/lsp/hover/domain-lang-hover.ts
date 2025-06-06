import { AstNode, CommentProvider, DocumentationProvider, MaybePromise } from "langium";
import { Hover, MarkupKind } from "vscode-languageserver";
import * as ast from '../../generated/ast.js';
import { AstNodeHoverProvider, LangiumServices } from "langium/lsp";
import { keywordExplanations } from './domain-lang-keywords.js';
import { QualifiedNameProvider } from './domain-lang-naming.js';
import type { Reference } from 'langium';

export class DomainLangHoverProvider extends AstNodeHoverProvider {

    protected readonly documentationProvider: DocumentationProvider;
    protected readonly commentProvider: CommentProvider;
    protected readonly qualifiedNameProvider: QualifiedNameProvider;

    constructor(services: LangiumServices) {
        super(services);
        this.documentationProvider = services.documentation.DocumentationProvider;
        this.commentProvider = services.documentation.CommentProvider;
        this.qualifiedNameProvider = (services as any).references.QualifiedNameProvider;
    }

    private getRefName(ref: ast.Type | Reference<ast.Type> | undefined): string {
        if (ref && typeof ref === 'object') {
            if ('ref' in ref && ref.ref && 'name' in ref.ref) {
                return ref.ref.name;
            } else if ('name' in ref) {
                return (ref as ast.Type).name;
            }
        }
        return '';
    }

    // Helper to create a markdown link to a referenced entity
    private refLink(
        ref: Reference<ast.Type> | ast.Type | undefined,
        label?: string
    ): string {
        if (label) {
            return `[${label}](#${encodeURIComponent(label)})`;
        }
        let node: ast.Type | undefined = undefined;
        if (ref && typeof ref === 'object' && 'ref' in ref && ref.ref) {
            node = ref.ref;
        } else if (ref && typeof ref === 'object' && 'name' in ref) {
            node = ref as ast.Type;
        }
        if (node && 'name' in node && '$container' in node) {
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


    protected getAstNodeHoverContent(node: AstNode): MaybePromise<Hover | undefined> {
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
                if (doc.$type === 'DescriptionBlock' && 'description' in doc) description = doc.description;
                if (doc.$type === 'VisionBlock' && 'vision' in doc) vision = doc.vision;
                if (doc.$type === 'ClassifierBlock' && 'classifier' in doc && doc.classifier) {
                    classifier = this.getRefName(doc.classifier);
                    classifierRef = doc.classifier;
                }
            }
            return {
                contents: {
                    kind: MarkupKind.Markdown,
                    value: this.hoverTemplate(
                        '📁',
                        ` **\`(domain)\` ${n.name}**${n.parentDomain ? ` _(part of ${this.refLink(n.parentDomain)} domain)_` : ''}`,
                        [
                            description ? `*${description}*\n\n&nbsp;` : undefined,
                            classifier ? `🔖 Classifier: ${this.refLink(classifierRef, classifier)}` : undefined,
                            vision ? `💭 Vision: ${vision}` : undefined
                        ],
                        commentBlock
                    )
                }
            };
        }
        // --- BoundedContext ---
        if (ast.isBoundedContext(node)) {
            const n = node as ast.BoundedContext;
            // Find the relevant documentation blocks
            const descriptionBlock = n.documentation.find(d => d.$type === 'DescriptionBlock') as ast.BoundedContextDocumentationBlock | undefined;
            const teamBlock = n.documentation.find(d => d.$type === 'TeamBlock') as ast.TeamBlock | undefined;
            const classifiersBlock = n.documentation.find(d => d.$type === 'ClassifiersBlock') as ast.ClassifiersBlock | undefined;
            const relationshipsBlock = n.documentation.find(d => d.$type === 'RelationshipsBlock') as ast.RelationshipsBlock | undefined;
            const terminologyBlock = n.documentation.find(d => d.$type === 'TerminologyBlock') as ast.TerminologyBlock | undefined;
            const decisionsBlock = n.documentation.find(d => d.$type === 'DecisionsBlock') as ast.DecisionsBlock | undefined;

            // Extract values from blocks
            const description = (descriptionBlock && 'description' in descriptionBlock) ? descriptionBlock.description : undefined;
            const team = teamBlock?.team;
            const teamLabel = (team && 'name' in team) ? team.name : '';
            const teamRef = teamBlock?.team ? teamBlock.team.ref : undefined;
            const businessModel = classifiersBlock?.businessModel;
            const businessModelLabel = (businessModel && 'name' in businessModel) ? businessModel.name : '';
            const businessModelRef = classifiersBlock?.businessModel ? classifiersBlock.businessModel.ref : undefined;
            const evolution = classifiersBlock?.evolution;
            const evolutionLabel = (evolution && 'name' in evolution) ? evolution.name : '';
            const evolutionRef = classifiersBlock?.evolution ? classifiersBlock.evolution.ref : undefined;
            const roleClassifier = classifiersBlock?.roleClassifier;
            const roleClassifierLabel = (roleClassifier && 'name' in roleClassifier) ? roleClassifier.name : '';
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
                            roleClassifier ? `🔖 Role: ${this.refLink(roleClassifierRef, String(roleClassifierLabel))}` : undefined,
                            team ? `👥 Team: ${this.refLink(teamRef, String(teamLabel))}` : undefined,
                            businessModel ? `💼 Business Model: ${this.refLink(businessModelRef, String(businessModelLabel))}` : undefined,
                            evolution ? `🔄 Evolution: ${this.refLink(evolutionRef, String(evolutionLabel))}` : undefined,
                            relationships.length ? `---\n\n&nbsp;\n\n#### 🔗 Relationships\n${relationships.map(r => `- ${this.refLink(r.left?.link)} ${r.arrow} ${this.refLink(r.right?.link)}${r.type ? '(' + r.type + ')' : ''}`).join('\n')}` : undefined,
                            terminology.length ? `---\n\n&nbsp;\n\n#### 🗝️ Terminology\n${terminology.map(t => `- **${t.name}**: _${t.meaning}_`).join('\n')}` : undefined,
                            decisions.length ? `---\n\n&nbsp;\n\n#### ⚖️ Decisions\n${decisions.map(d => `- **${d.name}**: _${d.value}_`).join('\n')}` : undefined
                        ],
                        commentBlock
                    )
                }
            };
        }
        // --- Model ---
        if (ast.isModel && ast.isModel(node)) {
            const n = node as ast.Model;
            return {
                contents: {
                    kind: 'markdown',
                    value: this.hoverTemplate(
                        '🗂️',
                        ` **\`(model)\`**`,
                        [
                            `Contains ${n.children.length} elements.`
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
        // --- ObjectMap ---
        if (ast.isObjectMap && ast.isObjectMap(node)) {
            const n = node as ast.ObjectMap;
            return {
                contents: {
                    kind: 'markdown',
                    value: this.hoverTemplate(
                        '🗺️',
                        ` **\`(objectmap)\` ${(n as { name?: string }).name ?? ''}**`,
                        [
                            `Type: ${n.$type}`
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
        // --- Relationship ---
        if (ast.isRelationship && ast.isRelationship(node)) {
            const n = node as ast.Relationship;
            const leftName = n.left?.link?.ref ? this.getRefName(n.left.link.ref) : '';
            const rightName = n.right?.link?.ref ? this.getRefName(n.right.link.ref) : '';
            const relLabel = leftName && rightName ? `${leftName} ${n.arrow} ${rightName}` : '(relationship)';
            return {
                contents: {
                    kind: 'markdown',
                    value: this.hoverTemplate(
                        '🔗',
                        ` **\`(relationship)\` ${relLabel}**`,
                        [
                            n.leftRoles && n.leftRoles.length ? `**Left Roles:** ${n.leftRoles.map(r => `\u001b[36m${r}\u001b[0m`).join(', ')}` : undefined,
                            `${this.refLink(n.left?.link)} ${n.arrow} ${this.refLink(n.right?.link)}${n.type ? '(' + n.type + ')' : ''}`,
                            n.rightRoles && n.rightRoles.length ? `**Right Roles:** ${n.rightRoles.map(r => `\u001b[36m${r}\u001b[0m`).join(', ')}` : undefined
                        ],
                        commentBlock
                    )
                }
            };
        }
        // --- RoleEnum ---
        if (typeof node === 'string' && ['PL','OHS','CF','ACL','P','SK','BBoM'].includes(node)) {
            return {
                contents: {
                    kind: 'markdown',
                    value: this.hoverTemplate(
                        '🔖',
                        node,
                        [
                            `<code>${node}</code>`
                        ]
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
                        n.name,
                        [
                            `### ${n.name}`,
                            n.value ? `*${n.value}` : undefined
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
                        n.name,
                        [
                            `### ${n.name}`,
                            n.value ? `*${n.value}` : undefined
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
                        '📏',
                        n.name,
                        [
                            `### ${n.name}`,
                            n.value ? `*${n.value}` : undefined
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
                            n.meaning ? `*${n.meaning}*` : undefined
                        ],
                        commentBlock
                    )
                }
            };
        }
        // --- QualifiedName ---
        if (typeof node === 'string') {
            const nodeStr = node as string;
            if (nodeStr.match(/^([_a-zA-Z][\w_-]*)(\.[_a-zA-Z][\w_-]*)*$/)) {
                return {
                    contents: {
                        kind: 'markdown',
                        value: this.hoverTemplate(
                            '🔗',
                            nodeStr,
                            [
                                `<code>${nodeStr}</code>`
                            ]
                        )
                    }
                };
            }
        }
        // --- BoundedContextDocumentationBlock ---
        if (ast.isBoundedContextDocumentationBlock && ast.isBoundedContextDocumentationBlock(node)) {
            const n = node as ast.BoundedContextDocumentationBlock;
            let fields = [];
            if (n.$type === 'DescriptionBlock' && n.description) fields.push(`Description: _${n.description}_`);
            if (n.$type === 'TeamBlock' && n.team) fields.push(`Team: ${this.getRefName(n.team.ref)}`);
            if (n.$type === 'ClassifiersBlock' && n.businessModel) fields.push(`Business Model: ${this.getRefName(n.businessModel.ref)}`);
            if (n.$type === 'ClassifiersBlock' && n.evolution) fields.push(`Evolution: ${this.getRefName(n.evolution.ref)}`);
            if (n.$type === 'ClassifiersBlock' && n.roleClassifier) fields.push(`Role: ${this.getRefName(n.roleClassifier.ref)}`);
            if (n.$type === 'RelationshipsBlock' && n.relationships && n.relationships.length) fields.push(`Relationships: ${n.relationships.length}`);
            if (n.$type === 'TerminologyBlock' && n.domainTerminology && n.domainTerminology.length) fields.push(`Terminology: ${n.domainTerminology.length}`);
            if (n.$type === 'DecisionsBlock' && n.decisions && n.decisions.length) fields.push(`Decisions: ${n.decisions.length}`);
            return {
                contents: {
                    kind: 'markdown',
                    value: this.hoverTemplate(
                        '📄',
                        '',
                        fields,
                        commentBlock
                    )
                }
            };
        }
        // --- DomainDocumentationBlock ---
        if (ast.isDomainDocumentationBlock && ast.isDomainDocumentationBlock(node)) {
            const n = node as ast.DomainDocumentationBlock;
            let fields = [];
            if (n.$type === 'DescriptionBlock' && n.description) fields.push(`Description: _${n.description}_`);
            if (n.$type === 'VisionBlock' && n.vision) fields.push(`Vision: _${n.vision}_`);
            if (n.$type === 'ClassifierBlock' && n.classifier) fields.push(`Classifier: ${this.getRefName(n.classifier.ref)}`);
            return {
                contents: {
                    kind: 'markdown',
                    value: this.hoverTemplate(
                        '📄',
                        '',
                        fields,
                        commentBlock
                    )
                }
            };
        }
        // --- BoundedContextRef ---
        if (ast.isBoundedContextRef && ast.isBoundedContextRef(node)) {
            const n = node as ast.BoundedContextRef;
            return {
                contents: {
                    kind: 'markdown',
                    value: this.hoverTemplate(
                        '🔗',
                        '',
                        [
                            n.link ? `References: ${this.getRefName(n.link)}` : undefined
                        ],
                        commentBlock
                    )
                }
            };
        }
        // --- ThisRef ---
        if (ast.isThisRef && ast.isThisRef(node)) {
            return {
                contents: {
                    kind: 'markdown',
                    value: this.hoverTemplate(
                        '🔗',
                        '',
                        [
                            'Refers to the current Bounded Context.'
                        ],
                        commentBlock
                    )
                }
            };
        }

        // --- StructureElement ---
        if (ast.isStructureElement && ast.isStructureElement(node)) {
            return {
                contents: {
                    kind: 'markdown',
                    value: this.hoverTemplate(
                        '📦',
                        '',
                        [
                            `### ${node.$type}`
                        ],
                        commentBlock
                    )
                }
            };
        }
        // --- Type (union) ---
        if (ast.isType && ast.isType(node)) {
            return {
                contents: {
                    kind: 'markdown',
                    value: this.hoverTemplate(
                        '🔤',
                        '',
                        [
                            `### ${node.$type}`
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
                    '',
                    [
                        `<code>${'type' in node ? (node as { $type?: string }).$type ?? typeof node : typeof node}</code>`
                    ],
                    commentBlock
                )
            }
        };
    }

    protected override getKeywordHoverContent(node: AstNode): MaybePromise<Hover | undefined> {
        const keyword = (node as any)?.keyword ?? (node as any)?.value ?? node;
        if (typeof keyword === 'string') {
            const explanation = keywordExplanations[keyword.toLowerCase()];
            if (explanation) {
                return {
                    contents: {
                        kind: 'markdown',
                        value: `💡 `+ explanation
                    }
                };
            }
            // fallback for unknown keywords
            return {
                contents: {
                    kind: 'markdown',
                    value: `💡 **${keyword}**`
                }
            };
        }
        return undefined;
    }
}