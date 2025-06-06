import type { ValidationAcceptor } from 'langium';
import type { BoundedContext } from '../../generated/ast.js';

// Utility: returns the first block with the given property name defined and non-empty, or undefined
function getNamedBlock<T extends object>(blocks: T[] | undefined, prop: string): T | undefined {
    if (!blocks) return undefined;
    return blocks.find(block => {
        const rec = block as Record<string, unknown>;
        return Object.prototype.hasOwnProperty.call(rec, prop) &&
            rec[prop] !== undefined &&
            rec[prop] !== null &&
            rec[prop] !== '';
    });
}

function checkBC(bc: BoundedContext, accept: ValidationAcceptor): void {
    const hasDescription = bc.documentation?.some(
        (block: any) => 'description' in block && block.description
    );
    if (!hasDescription)
        accept('warning', `Bounded Context '${bc.name}' has no description`, { node: bc, property: 'documentation' });
}

export const boundedContextChecks = [checkBC]; 