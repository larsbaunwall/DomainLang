/**
 * Integration Patterns - Type-safe constants for DDD integration patterns.
 * 
 * Use these constants instead of magic strings when checking relationship patterns.
 * 
 * @example
 * ```typescript
 * import { Pattern } from '../sdk/patterns.js';
 * 
 * // Instead of: hasPattern('SK') or hasPattern('SharedKernel')
 * // Use:
 * if (relationship.hasPattern(Pattern.SharedKernel)) {
 *     // ...
 * }
 * ```
 */

/**
 * Integration pattern abbreviations as used in the grammar.
 * These are the canonical abbreviations recognized by DomainLang.
 */
export const Pattern = {
    // Upstream patterns (provider side)
    /** Open Host Service - exposes a clean API for consumers */
    OHS: 'OHS',
    /** Published Language - shared data format/protocol */
    PL: 'PL',
    
    // Downstream patterns (consumer side)
    /** Conformist - accepts upstream model without translation */
    CF: 'CF',
    /** Anti-Corruption Layer - translates upstream model */
    ACL: 'ACL',
    
    // Mutual patterns (both sides)
    /** Shared Kernel - shared code/model ownership */
    SK: 'SK',
    /** Partnership - coordinated development */
    P: 'P',
    
    // Relationship types
    /** Customer/Supplier - negotiated contract */
    CustomerSupplier: 'Customer/Supplier',
    /** Separate Ways - no integration */
    SeparateWays: 'Separate Ways',
    /** Big Ball of Mud - legacy or unstructured */
    BigBallOfMud: 'Big Ball of Mud',
} as const;

/**
 * Full names for integration patterns.
 * Used when patterns are spelled out in documentation blocks.
 */
export const PatternFullName = {
    OHS: 'OpenHostService',
    PL: 'PublishedLanguage',
    CF: 'Conformist',
    ACL: 'AntiCorruptionLayer',
    SK: 'SharedKernel',
    P: 'Partnership',
} as const;

/**
 * Mapping from abbreviations to full names and vice versa.
 */
export const PatternAliases: Record<string, readonly string[]> = {
    // Abbreviation -> [abbreviation, fullName]
    OHS: ['OHS', 'OpenHostService'],
    PL: ['PL', 'PublishedLanguage'],
    CF: ['CF', 'Conformist'],
    ACL: ['ACL', 'AntiCorruptionLayer'],
    SK: ['SK', 'SharedKernel'],
    P: ['P', 'Partnership'],
    
    // Full names map to same
    OpenHostService: ['OHS', 'OpenHostService'],
    PublishedLanguage: ['PL', 'PublishedLanguage'],
    Conformist: ['CF', 'Conformist'],
    AntiCorruptionLayer: ['ACL', 'AntiCorruptionLayer'],
    SharedKernel: ['SK', 'SharedKernel'],
    Partnership: ['P', 'Partnership'],
};

/**
 * Type representing any valid integration pattern (abbreviation or full name).
 */
export type IntegrationPattern = 
    | typeof Pattern[keyof typeof Pattern]
    | typeof PatternFullName[keyof typeof PatternFullName];

/**
 * Checks if a pattern string matches any of the expected aliases.
 * Handles both abbreviations and full names case-insensitively.
 * 
 * @param actual - Pattern string from the AST
 * @param expected - Pattern to match (abbreviation or full name)
 * @returns true if patterns match
 */
export function matchesPattern(actual: string, expected: string): boolean {
    const normalizedActual = actual.trim();
    const aliases = PatternAliases[expected];
    
    if (aliases) {
        return aliases.some(alias => 
            alias.toLowerCase() === normalizedActual.toLowerCase()
        );
    }
    
    // Fallback: direct comparison
    return normalizedActual.toLowerCase() === expected.toLowerCase();
}

/**
 * Patterns that are typically on the upstream (provider) side.
 */
export const UpstreamPatterns: readonly string[] = ['OHS', 'OpenHostService', 'PL', 'PublishedLanguage'];

/**
 * Patterns that are typically on the downstream (consumer) side.
 */
export const DownstreamPatterns: readonly string[] = ['CF', 'Conformist', 'ACL', 'AntiCorruptionLayer'];

/**
 * Patterns that require mutual/bidirectional relationships.
 */
export const MutualPatterns: readonly string[] = ['SK', 'SharedKernel', 'P', 'Partnership'];

/**
 * Checks if a pattern is typically an upstream pattern.
 */
export function isUpstreamPattern(pattern: string): boolean {
    return UpstreamPatterns.some(p => matchesPattern(pattern, p));
}

/**
 * Checks if a pattern is typically a downstream pattern.
 */
export function isDownstreamPattern(pattern: string): boolean {
    return DownstreamPatterns.some(p => matchesPattern(pattern, p));
}

/**
 * Checks if a pattern requires bidirectional relationships.
 */
export function isMutualPattern(pattern: string): boolean {
    return MutualPatterns.some(p => matchesPattern(pattern, p));
}
