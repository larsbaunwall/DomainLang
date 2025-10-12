import type { ValidationAcceptor } from 'langium';
import type { BoundedContext, BoundedContextDocumentationBlock } from '../generated/ast.js';
import { isDescriptionBlock } from '../generated/ast.js';
import { ValidationMessages } from './constants.js';

/**
 * Validates that a bounded context has a description.
 * 
 * @param bc - The bounded context to validate
 * @param accept - The validation acceptor for reporting issues
 */
function validateBoundedContextHasDescription(
    bc: BoundedContext, 
    accept: ValidationAcceptor
): void {
    const hasDescription = bc.documentation?.some(
        (block: BoundedContextDocumentationBlock) => isDescriptionBlock(block) && block.description
    );
    if (!hasDescription) {
        accept('warning', ValidationMessages.BOUNDED_CONTEXT_NO_DESCRIPTION(bc.name), { 
            node: bc, 
            property: 'documentation' 
        });
    }
}

export const boundedContextChecks = [validateBoundedContextHasDescription]; 