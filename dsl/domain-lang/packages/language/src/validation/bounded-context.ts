import type { ValidationAcceptor } from 'langium';
import type { BoundedContext } from '../generated/ast.js';
import { ValidationMessages, buildCodeDescription } from './constants.js';

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
    if (!bc.description) {
        accept('warning', ValidationMessages.BOUNDED_CONTEXT_NO_DESCRIPTION(bc.name), { 
            node: bc,
            keyword: 'BoundedContext',
            codeDescription: buildCodeDescription('language.md', 'bounded-contexts')
        });
    }
}

/**
 * Validates that a bounded context belongs to a domain.
 * A BoundedContext must have a 'for Domain' clause.
 * 
 * @param bc - The bounded context to validate
 * @param accept - The validation acceptor for reporting issues
 */
function validateBoundedContextHasDomain(
    bc: BoundedContext,
    accept: ValidationAcceptor
): void {
    if (!bc.domain) {
        accept('warning', ValidationMessages.BOUNDED_CONTEXT_NO_DOMAIN(bc.name), {
            node: bc,
            keyword: 'for',
            codeDescription: buildCodeDescription('language.md', 'bounded-contexts')
        });
    }
}

/**
 * Validates conflicts between inline and block role assignment.
 * Warns when both inline ('as') and block ('role:') are used.
 * Inline values take precedence per PRS-008.
 *
 * FR-2.3: Inline/Block Conflict Validation
 */
function validateBoundedContextRoleConflict(
    bc: BoundedContext,
    accept: ValidationAcceptor
): void {
    if (bc.role.length > 1) {
        const inlineRoleName = bc.role[0].ref?.name;
        const blockRoleName = bc.role[1].ref?.name;

        // Warn if defined multiple times
        accept('warning', ValidationMessages.BOUNDED_CONTEXT_ROLE_CONFLICT(bc.name, inlineRoleName, blockRoleName), {
            node: bc,
            property: 'role',
            index: 1,
            codeDescription: buildCodeDescription('language.md', 'bounded-contexts')
        });
    }
}

/**
 * Validates conflicts between inline and block team assignment.
 * Warns when both inline ('by') and block ('team:') are used.
 * Inline values take precedence per PRS-008.
 *
 * FR-2.3: Inline/Block Conflict Validation
 */
function validateBoundedContextTeamConflict(
    bc: BoundedContext,
    accept: ValidationAcceptor
): void {
    if (bc.team.length > 1) {
        const inlineTeamName = bc.team[0].ref?.name;
        const blockTeamName = bc.team[1].ref?.name;

        // Warn if defined multiple times
        accept('warning', ValidationMessages.BOUNDED_CONTEXT_TEAM_CONFLICT(bc.name, inlineTeamName, blockTeamName), {
            node: bc,
            property: 'team',
            index: 1,
            codeDescription: buildCodeDescription('language.md', 'bounded-contexts')
        });
    }
}

export const boundedContextChecks = [
    validateBoundedContextHasDescription,
    validateBoundedContextHasDomain,
    validateBoundedContextRoleConflict,
    validateBoundedContextTeamConflict
]; 