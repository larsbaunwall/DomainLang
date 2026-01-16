import type { ValidationAcceptor } from 'langium';
import type { Relationship, BoundedContextRef } from '../generated/ast.js';
import { isThisRef } from '../generated/ast.js';
import { ValidationMessages, buildCodeDescription } from './constants.js';

/**
 * Gets a display name for a BoundedContextRef (handles 'this' and regular refs).
 */
function getContextName(ref: BoundedContextRef): string {
    if (isThisRef(ref)) {
        return 'this';
    }
    return ref.link?.$refText ?? 'unknown';
}

/**
 * Validates that SharedKernel patterns use bidirectional relationships.
 * SharedKernel implies mutual dependency and shared code ownership.
 * 
 * @param relationship - The relationship to validate
 * @param accept - The validation acceptor for reporting issues
 */
function validateSharedKernelBidirectional(
    relationship: Relationship,
    accept: ValidationAcceptor
): void {
    // Check if SharedKernel pattern exists on either side
    const hasSharedKernelLeft = relationship.leftPatterns?.some(
        pattern => pattern === 'SK' || pattern === 'SharedKernel'
    );
    const hasSharedKernelRight = relationship.rightPatterns?.some(
        pattern => pattern === 'SK' || pattern === 'SharedKernel'
    );
    
    if ((hasSharedKernelLeft || hasSharedKernelRight) && relationship.arrow !== '<->') {
        const leftName = getContextName(relationship.left);
        const rightName = getContextName(relationship.right);
        
        accept('warning', 
            ValidationMessages.SHARED_KERNEL_MUST_BE_BIDIRECTIONAL(leftName, rightName, relationship.arrow),
            { node: relationship, property: 'arrow', codeDescription: buildCodeDescription('language.md', 'integration-patterns') }
        );
    }
}

/**
 * Validates that Anti-Corruption Layer (ACL) is on the consuming side.
 * ACL protects downstream context from upstream changes.
 * 
 * @param relationship - The relationship to validate
 * @param accept - The validation acceptor for reporting issues
 */
function validateACLPlacement(
    relationship: Relationship,
    accept: ValidationAcceptor
): void {
    const hasACLLeft = relationship.leftPatterns?.some(
        pattern => pattern === 'ACL' || pattern === 'AntiCorruptionLayer'
    );
    const hasACLRight = relationship.rightPatterns?.some(
        pattern => pattern === 'ACL' || pattern === 'AntiCorruptionLayer'
    );
    
    // ACL on left side with -> arrow means upstream has ACL (incorrect)
    if (hasACLLeft && relationship.arrow === '->') {
        const leftName = getContextName(relationship.left);
        accept('warning',
            ValidationMessages.ACL_ON_WRONG_SIDE(leftName, 'left'),
            { node: relationship, property: 'leftPatterns', codeDescription: buildCodeDescription('language.md', 'integration-patterns') }
        );
    }
    
    // ACL on right side with <- arrow means upstream has ACL (incorrect)
    if (hasACLRight && relationship.arrow === '<-') {
        const rightName = getContextName(relationship.right);
        accept('warning',
            ValidationMessages.ACL_ON_WRONG_SIDE(rightName, 'right'),
            { node: relationship, property: 'rightPatterns', codeDescription: buildCodeDescription('language.md', 'integration-patterns') }
        );
    }
}

/**
 * Validates that Conformist pattern is on the consuming side.
 * Conformist means accepting upstream model without translation.
 * 
 * @param relationship - The relationship to validate
 * @param accept - The validation acceptor for reporting issues
 */
function validateConformistPlacement(
    relationship: Relationship,
    accept: ValidationAcceptor
): void {
    const hasCFLeft = relationship.leftPatterns?.some(
        pattern => pattern === 'CF' || pattern === 'Conformist'
    );
    const hasCFRight = relationship.rightPatterns?.some(
        pattern => pattern === 'CF' || pattern === 'Conformist'
    );
    
    // CF on left side with -> arrow means upstream is conformist (incorrect)
    if (hasCFLeft && relationship.arrow === '->') {
        const leftName = getContextName(relationship.left);
        accept('warning',
            ValidationMessages.CONFORMIST_ON_WRONG_SIDE(leftName, 'left'),
            { node: relationship, property: 'leftPatterns', codeDescription: buildCodeDescription('language.md', 'integration-patterns') }
        );
    }
    
    // CF on right side with <- arrow means upstream is conformist (incorrect)
    if (hasCFRight && relationship.arrow === '<-') {
        const rightName = getContextName(relationship.right);
        accept('warning',
            ValidationMessages.CONFORMIST_ON_WRONG_SIDE(rightName, 'right'),
            { node: relationship, property: 'rightPatterns', codeDescription: buildCodeDescription('language.md', 'integration-patterns') }
        );
    }
}

/**
 * Validates that relationships don't have too many integration patterns.
 * More than 3 patterns on one side suggests syntax confusion.
 * 
 * @param relationship - The relationship to validate
 * @param accept - The validation acceptor for reporting issues
 */
function validatePatternCount(
    relationship: Relationship,
    accept: ValidationAcceptor
): void {
    const leftCount = relationship.leftPatterns?.length ?? 0;
    const rightCount = relationship.rightPatterns?.length ?? 0;
    
    if (leftCount > 3) {
        accept('info',
            ValidationMessages.TOO_MANY_PATTERNS(leftCount, 'left'),
            { node: relationship, property: 'leftPatterns', codeDescription: buildCodeDescription('language.md', 'integration-patterns') }
        );
    }
    
    if (rightCount > 3) {
        accept('info',
            ValidationMessages.TOO_MANY_PATTERNS(rightCount, 'right'),
            { node: relationship, property: 'rightPatterns', codeDescription: buildCodeDescription('language.md', 'integration-patterns') }
        );
    }
}

export const relationshipChecks = [
    validateSharedKernelBidirectional,
    validateACLPlacement,
    validateConformistPlacement,
    validatePatternCount
];
