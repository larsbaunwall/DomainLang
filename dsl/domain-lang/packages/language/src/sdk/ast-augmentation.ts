/**
 * SDK AST Augmentation - Module augmentation for native SDK properties.
 *
 * This file uses TypeScript's declaration merging to add computed helpers
 * directly to the AST types. After importing this module, BoundedContext,
 * Domain, and Relationship instances expose convenience getters.
 *
 * **Only properties that add value beyond direct AST access are augmented:**
 * - Precedence resolution: `effectiveRole`, `effectiveTeam` (for array-based properties)
 * - Data transformation: `metadataMap` (array to Map)
 * - Computed values: `fqn` (fully qualified name)
 * - Helper methods: `hasRole()`, `hasTeam()`, `hasMetadata()`, `hasClassification()`
 *
 * **Direct AST access (no augmentation needed):**
 * - `bc.description` - Direct string property
 * - `bc.businessModel?.ref` - Direct reference
 * - `bc.lifecycle?.ref` - Direct reference
 * - `domain.description` - Direct string property
 * - `domain.vision` - Direct string property
 * - `domain.classification?.ref` - Direct reference
 *
 * **Usage:**
 * ```typescript
 * import '../sdk/ast-augmentation.js'; // Enable augmented properties
 * import { fromDocument } from '../sdk/index.js';
 *
 * fromDocument(document); // Ensures augmentation
 * const bc: BoundedContext = ...;
 * console.log(bc.effectiveRole?.name);
 * console.log(bc.metadataMap.get('Language'));
 * // Direct access for simple properties:
 * console.log(bc.businessModel?.ref?.name);
 * ```
 *
 * **Properties added to BoundedContext:**
 * - `effectiveRole` - Inline `role` header → body `role:`
 * - `effectiveTeam` - Inline `team` header → body `team:`
 * - `metadataMap` - Metadata entries exposed as a ReadonlyMap
 * - `fqn` - Computed fully qualified name
 * - `hasRole(name)` - Check if role matches
 * - `hasTeam(name)` - Check if team matches
 * - `hasMetadata(key, value?)` - Check metadata
 *
 * **Properties added to Domain:**
 * - `fqn` - Computed fully qualified name
 * - `hasClassification(name)` - Check classification matches
 *
 * **Properties added to Relationship:**
 * - `hasPattern(pattern)` - Check if pattern exists on either side
 * - `hasLeftPattern(pattern)` - Check left patterns
 * - `hasRightPattern(pattern)` - Check right patterns
 * - `isUpstream(side)` - Check if side is upstream
 * - `isDownstream(side)` - Check if side is downstream
 * - `isBidirectional` - Check if relationship is bidirectional
 * - `leftContextName` - Resolved name of left context
 * - `rightContextName` - Resolved name of right context
 *
 * @module sdk/ast-augmentation
 */

// Note: Types are referenced directly via import('...').TypeName in the declare module
// to avoid importing and re-exporting type-only modules that cause compilation issues

/**
 * Module augmentation for native SDK properties on AST types.
 */
declare module '../generated/ast.js' {
    /**
     * Augmented BoundedContext with SDK-computed properties.
     * 
     * Note: description, businessModel, lifecycle, metadata, relationships,
     * terminology, and decisions are direct AST properties - use them directly.
     */
    interface BoundedContext {
        /** Effective role/classification with inline precedence (header `as` > body `role:`) */
        readonly effectiveRole: import('../generated/ast.js').Classification | undefined;

        /** Effective team with inline precedence (header `by` > body `team:`) */
        readonly effectiveTeam: import('../generated/ast.js').Team | undefined;

        /** Metadata entries exposed as a map for O(1) lookups */
        readonly metadataMap: ReadonlyMap<string, string>;

        /** SDK-computed fully qualified name */
        readonly fqn: string;

        /** Checks if this bounded context has the specified role. */
        hasRole(name: string | import('../generated/ast.js').Classification): boolean;

        /** Checks if this bounded context is owned by the specified team. */
        hasTeam(name: string | import('../generated/ast.js').Team): boolean;

        /** Checks if this bounded context has metadata with the given key (and optionally value). */
        hasMetadata(key: string, value?: string): boolean;
    }

    /**
     * Augmented Domain with SDK-computed properties.
     * 
     * Note: description, vision, and classification are direct AST properties - use them directly.
     */
    interface Domain {
        /** SDK-computed fully qualified name */
        readonly fqn: string;

        /** Checks if this domain has the specified classification. */
        hasClassification(name: string | import('../generated/ast.js').Classification): boolean;
    }

    /**
     * Augmented Relationship with SDK helper methods.
     */
    interface Relationship {
        /** Resolved name of left context (handles 'this') */
        readonly leftContextName: string;
        /** Resolved name of right context (handles 'this') */
        readonly rightContextName: string;
        /** Whether this is a bidirectional relationship (<->) */
        readonly isBidirectional: boolean;
        
        /**
         * Checks if the relationship has a specific integration pattern on either side.
         * Accepts both abbreviations (SK, ACL) and full names (SharedKernel, AntiCorruptionLayer).
         * @param pattern - Pattern abbreviation or full name
         */
        hasPattern(pattern: import('./patterns.js').IntegrationPattern | string): boolean;
        
        /**
         * Checks if the left side has a specific integration pattern.
         * @param pattern - Pattern abbreviation or full name
         */
        hasLeftPattern(pattern: import('./patterns.js').IntegrationPattern | string): boolean;
        
        /**
         * Checks if the right side has a specific integration pattern.
         * @param pattern - Pattern abbreviation or full name
         */
        hasRightPattern(pattern: import('./patterns.js').IntegrationPattern | string): boolean;
        
        /**
         * Checks if the specified side is upstream (provider) in this relationship.
         * @param side - 'left' or 'right'
         */
        isUpstream(side: 'left' | 'right'): boolean;
        
        /**
         * Checks if the specified side is downstream (consumer) in this relationship.
         * @param side - 'left' or 'right'
         */
        isDownstream(side: 'left' | 'right'): boolean;
    }
}

// Export nothing - this file is purely for type augmentation
// The actual implementation is in query.ts via Object.defineProperties
export {};
