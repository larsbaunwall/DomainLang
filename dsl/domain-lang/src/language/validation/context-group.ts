import type { ValidationAcceptor } from 'langium';
import type { ContextGroup } from '../generated/ast.js';
import { ValidationMessages } from './constants.js';

/**
 * Validates that a context group contains at least one context.
 * 
 * @param group - The context group to validate
 * @param accept - The validation acceptor for reporting issues
 */
function validateContextGroupHasContexts(
    group: ContextGroup, 
    accept: ValidationAcceptor
): void {
    if (!group.contexts || group.contexts.length === 0) {
        accept('warning', ValidationMessages.CONTEXT_GROUP_NO_CONTEXTS(group.name), { 
            node: group, 
            property: 'contexts' 
        });
    }
}

/**
 * Validates that a context group with a role has a valid role classifier.
 * 
 * @param group - The context group to validate
 * @param accept - The validation acceptor for reporting issues
 */
function validateContextGroupRole(
    group: ContextGroup, 
    accept: ValidationAcceptor
): void {
    if (group.roleClassifier && !group.roleClassifier.ref) {
        accept('error', ValidationMessages.CONTEXT_GROUP_INVALID_ROLE(group.name), { 
            node: group, 
            property: 'roleClassifier' 
        });
    }
}

export const contextGroupChecks = [
    validateContextGroupHasContexts,
    validateContextGroupRole
];
