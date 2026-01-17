/**
 * Property resolution logic for SDK-augmented properties.
 * 
 * This module provides resolution functions ONLY for properties that require
 * precedence logic or transformation. Direct properties (description, vision,
 * businessModel, lifecycle) should be accessed directly on the AST node.
 * 
 * **Functions provided:**
 * - `effectiveRole` - Array precedence: inline `as` → body `role:`
 * - `effectiveTeam` - Array precedence: inline `by` → body `team:`
 * - `metadataAsMap` - Array to Map conversion
 * 
 * **Direct access (no resolution needed):**
 * - `bc.description` - Direct string property
 * - `bc.businessModel?.ref` - Direct reference
 * - `bc.lifecycle?.ref` - Direct reference
 * - `domain.description` - Direct string property
 * - `domain.vision` - Direct string property
 * - `domain.classification?.ref` - Direct reference
 */

import type {
    BoundedContext,
    Classification,
    Team,
} from '../generated/ast.js';

/**
 * Returns the effective role for a BoundedContext.
 * 
 * Precedence:
 * 1. Header inline (`as` keyword) - highest priority
 * 2. Block property (`role:`)
 * 
 * @param bc - BoundedContext AST node
 * @returns Classification reference or undefined
 */
export function effectiveRole(bc: BoundedContext): Classification | undefined {
    // Return the first resolved role (inline takes precedence due to grammar order)
    return bc.role?.[0]?.ref;
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
