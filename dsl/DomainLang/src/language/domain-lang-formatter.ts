import type { AstNode } from "langium";
import { AbstractFormatter, Formatting } from "langium";
import * as ast from './generated/ast';

export class DomainLangFormatter extends AbstractFormatter {

    protected format(node: AstNode): void {
        if(ast.isPackageDeclaration(node)) {
            const f = this.getNodeFormatter(node);
            const open = f.keyword('{');
            const close = f.keyword('}');
            f.interior(open, close).prepend(Formatting.indent());
            close.prepend(Formatting.newLine());
        }
    }
}