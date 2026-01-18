/**
 * Validation message constants for DomainLang.
 * 
 * Centralizes all validation messages to ensure consistency
 * and facilitate internationalization in the future.
 * 
 * Messages follow VS Code conventions:
 * - Clear problem statement
 * - Brief DDD context explaining why it matters
 * - Inline example showing the fix
 * - Clickable documentation link via CodeDescription
 */

import type { CodeDescription } from 'vscode-languageserver-types';

// ============================================================================
// Documentation Link Utilities
// ============================================================================

const REPO_BASE = 'https://github.com/larsbaunwall/DomainLang/blob/main';
const DOCS_BASE = `${REPO_BASE}/dsl/domain-lang/docs`;

/**
 * Builds a documentation URL for error messages.
 * @param docPath - Relative path from docs/ folder
 * @param anchor - Optional section anchor (without #)
 */
const buildDocLink = (docPath: string, anchor?: string): string => 
    `${DOCS_BASE}/${docPath}${anchor ? `#${anchor}` : ''}`;

/**
 * Creates a CodeDescription for clickable documentation links in VS Code.
 * @param docPath - Relative path from docs/ folder
 * @param anchor - Optional section anchor (without #)
 */
export const buildCodeDescription = (docPath: string, anchor?: string): CodeDescription => ({
    href: buildDocLink(docPath, anchor)
});

// ============================================================================
// Enhanced Validation Messages
// ============================================================================

export const ValidationMessages = {
    /**
     * Warning message when a domain lacks a vision statement.
     * @param name - The name of the domain
     */
    DOMAIN_NO_VISION: (name: string) => 
        `Domain '${name}' is missing a vision statement.`,
    
    /**
     * Warning message when a bounded context lacks a description.
     * @param name - The name of the bounded context
     */
    BOUNDED_CONTEXT_NO_DESCRIPTION: (name: string) => 
        `Bounded Context '${name}' is missing a description.`,
    
    /**
     * Warning message when a bounded context lacks a domain reference.
     * @param name - The name of the bounded context
     */
    BOUNDED_CONTEXT_NO_DOMAIN: (name: string) =>
        `Bounded Context '${name}' must belong to a domain. Use 'for DomainName'.`,
    
    /**
     * Warning when classification is specified both inline and in a block.
     * Inline value takes precedence.
     * @param bcName - The name of the bounded context
     * @param inlineClassification - The inline classification name (from 'as')
     * @param blockClassification - The block classification name (from 'classification:')
     */
    BOUNDED_CONTEXT_CLASSIFICATION_CONFLICT: (bcName: string, inlineClassification?: string, blockClassification?: string) =>
        `Classification specified both inline${inlineClassification ? ` ('as ${inlineClassification}')` : ''} and in block${blockClassification ? ` ('classification: ${blockClassification}')` : ''}. Inline value takes precedence.`,
    
    /**
     * Warning when team is specified both inline and in a block.
     * Inline value takes precedence.
     * @param bcName - The name of the bounded context
     * @param inlineTeam - The inline team name (from 'by')
     * @param blockTeam - The block team name (from 'team:')
     */
    BOUNDED_CONTEXT_TEAM_CONFLICT: (bcName: string, inlineTeam?: string, blockTeam?: string) =>
        `Team specified both inline${inlineTeam ? ` ('by ${inlineTeam}')` : ''} and in block${blockTeam ? ` ('team: ${blockTeam}')` : ''}. Inline value takes precedence.`,
    
    /**
     * Error message when an element is defined multiple times.
     * @param fqn - The fully qualified name of the duplicate element
     */
    DUPLICATE_ELEMENT: (fqn: string) => 
        `Duplicate element: '${fqn}' is already defined.`,

    // ========================================================================
    // Integration Pattern & Relationship Validation
    // ========================================================================

    /**
     * Warning when SharedKernel pattern uses incorrect arrow direction.
     * SharedKernel requires bidirectional relationship.
     */
    SHARED_KERNEL_MUST_BE_BIDIRECTIONAL: (leftContext: string, rightContext: string, arrow: string) =>
        `SharedKernel between '${leftContext}' and '${rightContext}' requires bidirectional arrow '<->', not '${arrow}'.`,

    /**
     * Warning when Anti-Corruption Layer is on the wrong side of relationship.
     * ACL should protect the consuming context (downstream).
     */
    ACL_ON_WRONG_SIDE: (context: string, side: 'left' | 'right') =>
        `Anti-Corruption Layer (ACL) on '${context}' should be on downstream (consuming) side, not ${side} side.`,

    /**
     * Warning when Conformist pattern is on the wrong side.
     * Conformist accepts upstream model without translation.
     */
    CONFORMIST_ON_WRONG_SIDE: (context: string, side: 'left' | 'right') =>
        `Conformist (CF) on '${context}' should be on downstream (consuming) side, not ${side} side.`,

    /**
     * Info message when relationship has too many integration patterns.
     * Suggests possible syntax confusion.
     */
    TOO_MANY_PATTERNS: (count: number, side: 'left' | 'right') =>
        `Too many integration patterns (${count}) on ${side} side. Typically use 1-2 patterns per side.`
} as const;
