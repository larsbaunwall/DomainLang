import type { AstNode } from 'langium';
import { Model, isModel } from '../generated/ast.js';
import { QualifiedNameProvider } from '../lsp/domain-lang-naming.js';

export function* extractNames(element: Model): Generator<{fqn: string, node: AstNode}> {
    const fqnProvider = new QualifiedNameProvider();
    for (const child of element.children) {
        yield {fqn: fqnProvider.getQualifiedName(child.$container, child.name), node: child};
        if (isModel(child)) {
            yield* extractNames(child);
        }
    }
} 