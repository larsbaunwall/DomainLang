import type { ValidationAcceptor } from 'langium';
import type { BoundedContext, BoundedContextDocumentationBlock } from '../generated/ast.js';
import { isDescriptionBlock, isRoleBlock, isTeamBlock, isBoundedContextClassificationBlock } from '../generated/ast.js';
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

/**
 * Validates conflicts between inline and block properties in a bounded context.
 * Inline assignments ('as', 'by') should not be duplicated in documentation blocks.
 * When both forms are used, inline values take precedence.
 *
 * FR-2.3: Inline/Block Conflict Validation
 */
function validateBoundedContextInlineBlockConflicts(
    bc: BoundedContext,
    accept: ValidationAcceptor
): void {
    // Role conflict: inline 'as' vs block 'role' or classifications.role
    const inlineRoleName = bc.role?.ref?.name;
    let blockRoleName: string | undefined;
    if (bc.documentation) {
        for (const block of bc.documentation) {
            if (isRoleBlock(block) && block.role?.ref?.name) {
                blockRoleName = block.role.ref.name;
                break;
            }
            if (isBoundedContextClassificationBlock(block) && block.role?.ref?.name) {
                blockRoleName = block.role.ref.name;
                break;
            }
        }
    }
    if (inlineRoleName && blockRoleName) {
        accept('warning', ValidationMessages.BOUNDED_CONTEXT_ROLE_CONFLICT(bc.name, inlineRoleName, blockRoleName), {
            node: bc,
            property: 'documentation'
        });
    }

    // Team conflict: inline 'by' vs block 'team'
    const inlineTeamName = bc.team?.ref?.name;
    let blockTeamName: string | undefined;
    if (bc.documentation) {
        for (const block of bc.documentation) {
            if (isTeamBlock(block) && block.team?.ref?.name) {
                blockTeamName = block.team.ref.name;
                break;
            }
        }
    }
    if (inlineTeamName && blockTeamName) {
        accept('warning', ValidationMessages.BOUNDED_CONTEXT_TEAM_CONFLICT(bc.name, inlineTeamName, blockTeamName), {
            node: bc,
            property: 'documentation'
        });
    }
}

export const boundedContextChecks = [
    validateBoundedContextHasDescription,
    validateBoundedContextInlineBlockConflicts
]; 