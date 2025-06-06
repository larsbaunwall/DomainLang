import type { AstNode } from 'langium';
import { Container, isContainer } from '../../generated/ast.js';
import { QualifiedNameProvider } from '../domain-lang-naming.js';

export function* extractNames(element: Container): Generator<{fqn: string, node: AstNode}> {
    const fqnProvider = new QualifiedNameProvider();
    for (const child of element.children) {
        yield {fqn: fqnProvider.getQualifiedName(child.$container, child.name), node: child};
        if (isContainer(child)) {
            yield* extractNames(child);
        }
    }
} 