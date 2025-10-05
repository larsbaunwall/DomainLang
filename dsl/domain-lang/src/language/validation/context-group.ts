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

/**
 * Validates that a context group doesn't span multiple domains.
 * 
 * DDD principle: Bounded contexts within a group should typically belong to the same domain.
 * Grouping contexts from different domains may indicate unclear boundaries or poor modeling.
 * 
 * This is a warning, not an error, as there may be valid architectural reasons for
 * cross-domain grouping (e.g., visualization of system-wide patterns).
 * 
 * @param group - The context group to validate
 * @param accept - The validation acceptor for reporting issues
 */
function validateContextGroupDomainCohesion(
    group: ContextGroup,
    accept: ValidationAcceptor
): void {
    if (!group.contexts || group.contexts.length === 0) {
        return; // Skip if no contexts
    }

    // Collect all unique domains referenced by the bounded contexts
    const domains = new Set<string>();
    
    for (const contextRef of group.contexts) {
        for (const item of contextRef.items) {
            const bc = item.ref;
            if (bc?.domain?.ref?.name) {
                domains.add(bc.domain.ref.name);
            }
        }
    }

    // Warn if contexts belong to multiple different domains
    if (domains.size > 1) {
        const domainList = Array.from(domains).sort().join(', ');
        accept('warning', ValidationMessages.CONTEXT_GROUP_CROSS_DOMAIN(group.name, domainList), {
            node: group,
            property: 'contexts'
        });
    }
}

export const contextGroupChecks = [
    validateContextGroupHasContexts,
    validateContextGroupRole,
    validateContextGroupDomainCohesion
];
