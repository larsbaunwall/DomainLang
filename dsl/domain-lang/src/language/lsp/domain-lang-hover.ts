import { AstNode, CommentProvider, DocumentationProvider, MaybePromise } from "langium";
import { Hover } from "vscode-languageserver";
import * as ast from '../generated/ast.js';
import { AstNodeHoverProvider, LangiumServices } from "langium/lsp";
import { keywordExplanations } from './domain-lang-keywords.js';

export class DomainLangHoverProvider extends AstNodeHoverProvider {

    protected readonly documentationProvider: DocumentationProvider;
    protected readonly commentProvider: CommentProvider;

    constructor(services: LangiumServices) {
        super(services);
        this.documentationProvider = services.documentation.DocumentationProvider;
        this.commentProvider = services.documentation.CommentProvider;
        
    }

    private getRefName(ref: unknown): string {
        if (ref && typeof ref === 'object' && 'name' in ref && typeof (ref as any).name === 'string') {
            return (ref as any).name;
        }
        return '';
    }

    // Helper to create a markdown link to a referenced entity
    private refLink(ref: unknown, label?: string): string {
        const name = this.getRefName(ref);
        if (!name) return '';
        // For now, use anchor links (could be extended for LSP go-to-definition in the future)
        return `[${label ?? name}](#${encodeURIComponent(name)})`;
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
            let classifierRef: unknown = undefined;
            for (const doc of n.documentation) {
                if ('description' in doc && doc.description) description = doc.description;
                if ('vision' in doc && doc.vision) vision = doc.vision;
                if ('classifier' in doc && doc.classifier) { classifier = this.getRefName(doc.classifier.ref); classifierRef = doc.classifier.ref; }
            }
            return {
                contents: {
                    kind: 'markdown',
                    value:
commentBlock + 
`<sub>📁 <b>Domain</b></sub>

&nbsp;

### ${n.name}

${classifier ? `<sub>Classifier: ${this.refLink(classifierRef, classifier)}</sub>

&nbsp;

` : ''}${description ? `<sub><i>${description}</i></sub>

&nbsp;

` : ''}${vision ? `---

<sub>Vision</sub>

<sub>💭 <i>${vision}</i></sub>

&nbsp;

` : ''}${n.parentDomain?.ref ? `---

<sub>Parent Domain</sub>

<sub>${this.refLink(n.parentDomain.ref)}</sub>

&nbsp;

` : ''}`
                }
            };
        }

        // --- BoundedContext ---
        if (ast.isBoundedContext(node)) {
            const n = node as ast.BoundedContext;
            let description = '';
            let team = '';
            let businessModel = '';
            let evolution = '';
            let roleClassifier = '';
            let relationships: ast.Relationship[] = [];
            let terminology: ast.DomainTerm[] = [];
            let decisions: (ast.Decision | ast.Policy | ast.BusinessRule)[] = [];
            let teamRef: unknown = undefined;
            let businessModelRef: unknown = undefined;
            let evolutionRef: unknown = undefined;
            let roleClassifierRef: unknown = undefined;
            for (const doc of n.documentation) {
                if ('description' in doc && doc.description) description = doc.description;
                if ('team' in doc && doc.team) { team = this.getRefName(doc.team.ref); teamRef = doc.team.ref; }
                if ('businessModel' in doc && doc.businessModel) { businessModel = this.getRefName(doc.businessModel.ref); businessModelRef = doc.businessModel.ref; }
                if ('evolution' in doc && doc.evolution) { evolution = this.getRefName(doc.evolution.ref); evolutionRef = doc.evolution.ref; }
                if ('roleClassifier' in doc && doc.roleClassifier) { roleClassifier = this.getRefName(doc.roleClassifier.ref); roleClassifierRef = doc.roleClassifier.ref; }
                if ('relationships' in doc && doc.relationships) relationships = doc.relationships as ast.Relationship[];
                if ('domainTerminology' in doc && doc.domainTerminology) terminology = doc.domainTerminology as ast.DomainTerm[];
                if ('decisions' in doc && doc.decisions) decisions = doc.decisions as (ast.Decision | ast.Policy | ast.BusinessRule)[];
            }
            return {
                contents: {
                    kind: 'markdown',
                    value: commentBlock + `<sub>📕 <b>Bounded Context</b></sub>

&nbsp;

### ${n.name}

${description ? `<sub><i>${description}</i></sub>

&nbsp;

` : ''}---

&nbsp;

${n.domain?.ref ? `<sub>Implements Domain: ${this.refLink(n.domain.ref)}</sub>
` : ''}${team ? `<sub>👥 Team: ${this.refLink(teamRef, team)}</sub>
` : ''}${roleClassifier ? `<sub>🔖 Role: ${this.refLink(roleClassifierRef, roleClassifier)}</sub>
` : ''}${businessModel ? `<sub>💼 Business Model: ${this.refLink(businessModelRef, businessModel)}</sub>
` : ''}${evolution ? `<sub>🔄 Evolution: ${this.refLink(evolutionRef, evolution)}</sub>
` : ''}
&nbsp;

${relationships.length ? `---

<sub>Relationships</sub>

${relationships.map(r => `- ${this.refLink(r.left?.link)} ${r.arrow} ${this.refLink(r.right?.link)}${r.type ? ' <i>(' + r.type + ')</i>' : ''}`).join('\n')}

&nbsp;

` : ''}${terminology.length ? `---

<sub>Terminology</sub>

${terminology.map(t => `- **${t.name}**: _${t.meaning}_`).join('\n')}

&nbsp;

` : ''}${decisions.length ? `---

<sub>Decisions</sub>

${decisions.map(d => `- **${d.name}**: _${d.value}_`).join('\n')}

&nbsp;

` : ''}`
                }
            };
        }

        // --- Model ---
        if (ast.isModel && ast.isModel(node)) {
            const n = node as ast.Model;
            return {
                contents: {
                    kind: 'markdown',
                    value: commentBlock + `<sub>🗂️ <b>Model</b></sub>

&nbsp;

### Model

Contains ${n.children.length} elements.`
                }
            };
        }
        // --- StructureElement ---
        if (ast.isStructureElement && ast.isStructureElement(node)) {
            return {
                contents: {
                    kind: 'markdown',
                    value: commentBlock + `<sub>📦 <b>Structure Element</b></sub>

&nbsp;

### ${(node as any).$type}`
                }
            };
        }
        // --- Type (union) ---
        if (ast.isType && ast.isType(node)) {
            return {
                contents: {
                    kind: 'markdown',
                    value: commentBlock + `<sub>🔤 <b>Type</b></sub>

&nbsp;

### ${(node as any).$type}`
                }
            };
        }
        // --- PackageDeclaration ---
        if (ast.isPackageDeclaration && ast.isPackageDeclaration(node)) {
            const n = node as ast.PackageDeclaration;
            return {
                contents: {
                    kind: 'markdown',
                    value: commentBlock + `<sub>📦 <b>Package</b></sub>

&nbsp;

### ${n.name}

Contains ${n.children.length} elements.`
                }
            };
        }
        // --- ObjectMap ---
        if (ast.isObjectMap && ast.isObjectMap(node)) {
            return {
                contents: {
                    kind: 'markdown',
                    value: commentBlock + `<sub>🗺️ <b>Object Map</b></sub>

&nbsp;

### ${(node as any).$type}`
                }
            };
        }
        // --- ContextMap ---
        if (ast.isContextMap && ast.isContextMap(node)) {
            const n = node as ast.ContextMap;
            return {
                contents: {
                    kind: 'markdown',
                    value: commentBlock + `<sub>🗺️ <b>Context Map</b></sub>

&nbsp;

### ${n.name}

---

<sub>Bounded Contexts</sub>

${n.boundedContexts.map(bc => `- ${this.refLink(bc.ref)}`).join('\n')}

&nbsp;

${n.relationships.length ? `---

<sub>Relationships</sub>

${n.relationships.map(r => `- ${this.refLink(r.left?.link)} ${r.arrow} ${this.refLink(r.right?.link)}${r.type ? ' <i>(' + r.type + ')</i>' : ''}`).join('\n')}

&nbsp;

` : ''}`
                }
            };
        }
        // --- DomainMap ---
        if (ast.isDomainMap && ast.isDomainMap(node)) {
            const n = node as ast.DomainMap;
            return {
                contents: {
                    kind: 'markdown',
                    value: commentBlock + `<sub>🗺️ <b>Domain Map</b></sub>

&nbsp;

### ${n.name}

---

<sub>Domains</sub>

${n.domains.map(d => `- ${this.refLink(d.ref)}`).join('\n')}

&nbsp;

`
                }
            };
        }
        // --- Relationship ---
        if (ast.isRelationship && ast.isRelationship(node)) {
            const n = node as ast.Relationship;
            return {
                contents: {
                    kind: 'markdown',
                    value: commentBlock + `<sub>🔗 <b>Relationship</b></sub>

&nbsp;

${n.leftRoles && n.leftRoles.length ? `<sub>Left Roles:</sub> ${n.leftRoles.map(r => `[36m${r}[0m`).join(', ')}
` : ''}${this.refLink(n.left?.link)} ${n.arrow} ${this.refLink(n.right?.link)}${n.type ? ' <i>(' + n.type + ')</i>' : ''}${n.rightRoles && n.rightRoles.length ? `
<sub>Right Roles:</sub> ${n.rightRoles.map(r => `[36m${r}[0m`).join(', ')}` : ''}`
                }
            };
        }
        // --- RoleEnum ---
        if (typeof node === 'string' && ['PL','OHS','CF','ACL','P','SK','BBoM'].includes(node)) {
            return {
                contents: {
                    kind: 'markdown',
                    value: `<sub>🔖 <b>Role Enum</b></sub>

&nbsp;

<code>${node}</code>`
                }
            };
        }
        // --- RelationshipType ---
        if (typeof node === 'string' && ['Partnership','SharedKernel','CustomerSupplier','UpstreamDownstream','SeparateWays'].includes(node)) {
            return {
                contents: {
                    kind: 'markdown',
                    value: `<sub>🔗 <b>Relationship Type</b></sub>

&nbsp;

<code>${node}</code>`
                }
            };
        }
        // --- AbstractDecision ---
        if (ast.isAbstractDecision && ast.isAbstractDecision(node)) {
            return {
                contents: {
                    kind: 'markdown',
                    value: commentBlock + `<sub>⚖️ <b>Abstract Decision</b></sub>

&nbsp;

### ${(node as any).$type}`
                }
            };
        }
        // --- Decision ---
        if (ast.isDecision && ast.isDecision(node)) {
            const n = node as ast.Decision;
            return {
                contents: {
                    kind: 'markdown',
                    value: commentBlock + `<sub>⚖️ <b>Decision</b></sub>

&nbsp;

### ${n.name}
${n.value ? `<sub><i>${n.value}</i></sub>` : ''}`
                }
            };
        }
        // --- Policy ---
        if (ast.isPolicy && ast.isPolicy(node)) {
            const n = node as ast.Policy;
            return {
                contents: {
                    kind: 'markdown',
                    value: commentBlock + `<sub>📜 <b>Policy</b></sub>

&nbsp;

### ${n.name}
${n.value ? `<sub><i>${n.value}</i></sub>` : ''}`
                }
            };
        }
        // --- BusinessRule ---
        if (ast.isBusinessRule && ast.isBusinessRule(node)) {
            const n = node as ast.BusinessRule;
            return {
                contents: {
                    kind: 'markdown',
                    value: commentBlock + `<sub>📏 <b>Business Rule</b></sub>

&nbsp;

### ${n.name}
${n.value ? `<sub><i>${n.value}</i></sub>` : ''}`
                }
            };
        }
        // --- DomainTerm ---
        if (ast.isDomainTerm && ast.isDomainTerm(node)) {
            const n = node as ast.DomainTerm;
            return {
                contents: {
                    kind: 'markdown',
                    value: commentBlock + `<sub>🗝️ <b>Domain Term</b></sub>

&nbsp;

### ${n.name}
${n.meaning ? `<sub><i>${n.meaning}</i></sub>` : ''}`
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
                        value: `<sub>🔗 <b>Qualified Name</b></sub>

&nbsp;

<code>${nodeStr}</code>`
                    }
                };
            }
        }
        // --- BoundedContextDocumentationBlock ---
        if (ast.isBoundedContextDocumentationBlock && ast.isBoundedContextDocumentationBlock(node)) {
            const n = node as ast.BoundedContextDocumentationBlock;
            let fields = [];
            if (n.description) fields.push(`Description: _${n.description}_`);
            if (n.team) fields.push(`Team: ${this.getRefName(n.team.ref)}`);
            if (n.businessModel) fields.push(`Business Model: ${this.getRefName(n.businessModel.ref)}`);
            if (n.evolution) fields.push(`Evolution: ${this.getRefName(n.evolution.ref)}`);
            if (n.roleClassifier) fields.push(`Role: ${this.getRefName(n.roleClassifier.ref)}`);
            if (n.relationships && n.relationships.length) fields.push(`Relationships: ${n.relationships.length}`);
            if (n.domainTerminology && n.domainTerminology.length) fields.push(`Terminology: ${n.domainTerminology.length}`);
            if (n.decisions && n.decisions.length) fields.push(`Decisions: ${n.decisions.length}`);
            return {
                contents: {
                    kind: 'markdown',
                    value: commentBlock + `<sub>📄 <b>Bounded Context Doc Block</b></sub>

&nbsp;

${fields.join('<br>')}`
                }
            };
        }
        // --- DomainDocumentationBlock ---
        if (ast.isDomainDocumentationBlock && ast.isDomainDocumentationBlock(node)) {
            const n = node as ast.DomainDocumentationBlock;
            let fields = [];
            if (n.description) fields.push(`Description: _${n.description}_`);
            if (n.vision) fields.push(`Vision: _${n.vision}_`);
            if (n.classifier) fields.push(`Classifier: ${this.getRefName(n.classifier.ref)}`);
            return {
                contents: {
                    kind: 'markdown',
                    value: commentBlock + `<sub>📄 <b>Domain Doc Block</b></sub>

&nbsp;

${fields.join('<br>')}`
                }
            };
        }
        // --- BoundedContextRef ---
        if (ast.isBoundedContextRef && ast.isBoundedContextRef(node)) {
            const n = node as ast.BoundedContextRef;
            return {
                contents: {
                    kind: 'markdown',
                    value: commentBlock + `<sub>🔗 <b>Bounded Context Reference</b></sub>

&nbsp;

${n.link ? `References: ${this.getRefName(n.link)}` : ''}`
                }
            };
        }
        // --- ThisRef ---
        if (ast.isThisRef && ast.isThisRef(node)) {
            return {
                contents: {
                    kind: 'markdown',
                    value: commentBlock + `<sub>🔗 <b>This Reference</b></sub>

&nbsp;

Refers to the current Bounded Context.`
                }
            };
        }
        // --- Fallback ---
        return {
            contents: {
                kind: 'markdown',
                value: commentBlock + `<sub>ℹ️ <b>Unknown Construct</b></sub>

&nbsp;

<code>${(node as any).$type ?? typeof node}</code>`
            }
        };
    }

    protected override getKeywordHoverContent(node: AstNode): MaybePromise<Hover | undefined> {
        const keyword = (node as any)?.keyword ?? (node as any)?.value ?? node;
        if (typeof keyword === 'string') {
            const explanation = keywordExplanations[keyword];
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
                    value: `**${keyword}**`
                }
            };
        }
        return undefined;
    }
}