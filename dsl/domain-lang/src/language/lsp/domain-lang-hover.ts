import { AstNode, CommentProvider, DocumentationProvider, MaybePromise } from "langium";
import { Hover } from "vscode-languageserver";
import * as ast from '../generated/ast.js';
import { AstNodeHoverProvider, LangiumServices } from "langium/lsp";

export class DomainLangHoverProvider extends AstNodeHoverProvider {

    protected readonly documentationProvider: DocumentationProvider;
    protected readonly commentProvider: CommentProvider;

    constructor(services: LangiumServices) {
        super(services);
        this.documentationProvider = services.documentation.DocumentationProvider;
        this.commentProvider = services.documentation.CommentProvider;
        
    }

    protected getAstNodeHoverContent(node: AstNode): MaybePromise<Hover | undefined> {
        const content1 = this.documentationProvider.getDocumentation(node);
        const comment1 = this.commentProvider.getComment(node);
        comment1 + ' ' + content1;

        if (ast.isBoundedContext(node)) {
            const n = node as ast.BoundedContext;
                return {
                    contents: {
                        kind: 'markdown',
                        value: `**📕 Bounded Context**\n_${this.commentProvider.getComment(node)}_\n\n${n.description}\n\n---\n\n**Part of**\n\n📁 ${n.domain?.ref?.name} domain\n\n  💭 *${n.domain?.ref?.vision}*\n\n`
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
        const comment = this.commentProvider.getComment(node);
        if (content) {
            return {
                contents: {
                    kind: 'markdown',
                    value: `${content}\n\n---\n\n${comment}`
                }
            };
        }
        return undefined;
    }
}