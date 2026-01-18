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
 * Validates conflicts between inline and block classification assignment.
 * Warns when both inline ('as') and block ('classification:') are used.
 * Inline values take precedence per PRS-008.
 *
 * FR-9.2: Inline/Block Conflict Validation
 */
function validateBoundedContextClassificationConflict(
    bc: BoundedContext,
    accept: ValidationAcceptor
): void {
    if (bc.classification.length > 1) {
        const inlineClassificationName = bc.classification[0].ref?.name;
        const blockClassificationName = bc.classification[1].ref?.name;

        // Warn if defined multiple times
        accept('warning', ValidationMessages.BOUNDED_CONTEXT_CLASSIFICATION_CONFLICT(bc.name, inlineClassificationName, blockClassificationName), {
            node: bc,
            property: 'classification',
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
    validateBoundedContextClassificationConflict,
    validateBoundedContextTeamConflict
];