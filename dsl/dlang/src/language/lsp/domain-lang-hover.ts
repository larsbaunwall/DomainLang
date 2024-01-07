import { AstNode, AstNodeHoverProvider, DocumentationProvider, LangiumServices, MaybePromise } from "langium";
import { Hover } from "vscode-languageserver";
import * as ast from '../generated/ast.js';

export class DomainLangHoverProvider extends AstNodeHoverProvider {

    protected readonly documentationProvider: DocumentationProvider;

    constructor(services: LangiumServices) {
        super(services);
        this.documentationProvider = services.documentation.DocumentationProvider;
    }

    protected getAstNodeHoverContent(node: AstNode): MaybePromise<Hover | undefined> {
        if (ast.isBoundedContext(node)) {
            const n = node as ast.BoundedContext;
                return {
                    contents: {
                        kind: 'markdown',
                        value: `**📕 Bounded Context**\n\n${n.description}\n\n---\n\n**Part of**\n\n📁 ${n.domain?.ref?.name} domain\n\n  💭 *${n.domain?.ref?.vision}*\n\n`
                    }
                };
        }

        if (ast.isDomain(node)) {
            const n = node as ast.Domain;
                return {
                    contents: {
                        kind: 'markdown',
                        value: `**📁 Domain**\n\n${n.name}\n\n  💭 *${n.vision}*`
                    }
                };
        }

        const content = this.documentationProvider.getDocumentation(node);
        if (content) {
            return {
                contents: {
                    kind: 'markdown',
                    value: content
                }
            };
        }
        return undefined;
    }
}