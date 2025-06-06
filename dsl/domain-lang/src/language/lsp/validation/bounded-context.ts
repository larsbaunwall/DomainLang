import type { ValidationAcceptor } from 'langium';
import type { BoundedContext } from '../../generated/ast.js';

function checkBC(bc: BoundedContext, accept: ValidationAcceptor): void {
    const hasDescription = bc.documentation?.some(
        (block: any) => 'description' in block && block.description
    );
    if (!hasDescription)
        accept('warning', `Bounded Context '${bc.name}' has no description`, { node: bc, property: 'documentation' });
}

export const boundedContextChecks = [checkBC]; 