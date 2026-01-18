/**
 * Property resolution logic for SDK-augmented properties.
 * 
 * This module provides resolution functions ONLY for properties that require
 * precedence logic or transformation. Direct properties (description, vision,
 * businessModel, evolution, archetype) should be accessed directly on the AST node.
 * 
 * **Functions provided:**
 * - `effectiveClassification` - Array precedence: inline `as` → body `classification:`
 * - `effectiveTeam` - Array precedence: inline `by` → body `team:`
 * - `metadataAsMap` - Array to Map conversion
 * 
 * **Direct access (no resolution needed):**
 * - `bc.description` - Direct string property
 * - `bc.businessModel?.ref` - Direct reference
 * - `bc.evolution?.ref` - Direct reference
 * - `bc.archetype?.ref` - Direct reference
 * - `domain.description` - Direct string property
 * - `domain.vision` - Direct string property
 * - `domain.type?.ref` - Direct reference
 */

import type {
    BoundedContext,
    Classification,
    Team,
} from '../generated/ast.js';

/**
 * Returns the effective classification for a BoundedContext.
 * 
 * Precedence:
 * 1. Header inline (`as` keyword) - highest priority
 * 2. Block property (`classification:`)
 * 
 * @param bc - BoundedContext AST node
 * @returns Classification reference or undefined
 */
export function effectiveClassification(bc: BoundedContext): Classification | undefined {
    // Return the first resolved classification (inline takes precedence due to grammar order)
    return bc.classification?.[0]?.ref;
}

/**
 * Returns the effective team for a BoundedContext.
 * 
 * Precedence:
 * 1. Header inline (`by` keyword) - highest priority
 * 2. Block property (`team:`)
 * 
 * @param bc - BoundedContext AST node
 * @returns Team reference or undefined
 */
export function effectiveTeam(bc: BoundedContext): Team | undefined {
    // Return the first resolved team (inline takes precedence due to grammar order)
    return bc.team?.[0]?.ref;
}

/**
 * Returns metadata for a BoundedContext as a Map.
 * Converts the metadata array to a key-value map.
 * 
 * @param bc - BoundedContext AST node
 * @returns ReadonlyMap of metadata entries
 */
export function metadataAsMap(bc: BoundedContext): ReadonlyMap<string, string> {
    const map = new Map<string, string>();
    
    for (const entry of bc.metadata ?? []) {
        const key = entry.key?.ref?.name;
        const value = entry.value;
        if (key && value) {
            map.set(key, value);
        }
    }
    
    return map;
}
