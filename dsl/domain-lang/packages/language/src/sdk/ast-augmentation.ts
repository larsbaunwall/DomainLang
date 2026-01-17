/**
 * SDK AST Augmentation - Module augmentation for native SDK properties.
 * 
 * This file uses TypeScript's declaration merging to add computed properties
 * directly to the AST types with transparent precedence rules. After importing
 * this module, all BoundedContext and Domain instances have native access to
 * resolved properties via getters.
 * 
 * **Precedence Rules:**
 * The augmented properties implement DDD-aware resolution that applies precedence:
 * - **Inline properties have highest priority** (e.g., `bc as Role by Team`)
 * - **Block declarations are secondary** (e.g., `role: Role` in blocks)
 * - **Merged properties** (e.g., `metadata` merges all MetadataBlocks)
 * 
 * **Usage:**
 * ```typescript
 * import '../sdk/ast-augmentation.js'; // Enable augmented properties
 * import { fromDocument } from '../sdk/index.js';
 * 
 * // In LSP provider:
 * fromDocument(document); // Ensures augmentation
 * const bc: BoundedContext = ...;
 * console.log(bc.description); // Native property access - transparent precedence!
 * console.log(bc.team);        // Inline team takes precedence over block team
 * ```
 * 
 * **Properties added to BoundedContext:**
 * - `description` - First DescriptionBlock (precedence: block only)
 * - `role` - Classification with precedence: inline `as` → RoleBlock → ClassificationBlock
 * - `team` - Team with precedence: inline `by` → TeamBlock
 * - `businessModel` - Classification with precedence: ClassificationBlock → BusinessModelBlock
 * - `lifecycle` - Classification with precedence: ClassificationBlock → LifecycleBlock
 * - `metadata` - Map merged from all MetadataBlocks (later entries override)
 * - `fqn` - Computed fully qualified name
 * - `hasRole(name)` - Check if role matches
 * - `hasTeam(name)` - Check if team matches
 * - `hasMetadata(key, value?)` - Check metadata
 * 
 * **Properties added to Domain:**
 * - `description` - First DescriptionBlock
 * - `vision` - First VisionBlock
 * - `classification` - Classification from DomainClassificationBlock
 * - `fqn` - Computed fully qualified name
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
     * Augmented BoundedContext with SDK-resolved properties.
     */
    interface BoundedContext {
        /**
         * The description of this Bounded Context.
         * 
         * **Precedence:** First DescriptionBlock found
         */
        readonly description: string | undefined;
        
        /**
         * The resolved role/classification of this Bounded Context.
         * 
         * **Precedence (Highest to Lowest):**
         * 1. Inline role from header (`as` keyword)
         * 2. Standalone RoleBlock
         * 3. BoundedContextClassificationBlock.role
         * 
         * **Note:** The grammar property `role` is a Reference; this is the resolved Classification
         * after applying precedence rules.
         */
        readonly resolvedRole: import('../generated/ast.js').Classification | undefined;
        
        /**
         * The resolved team that owns this Bounded Context.
         * 
         * **Precedence (Highest to Lowest):**
         * 1. Inline team from header (`by` keyword)
         * 2. Standalone TeamBlock
         * 
         * **Note:** The grammar property `team` is a Reference; this is the resolved Team
         * after applying precedence rules. Inline team (from `by` keyword) always takes precedence
         * over team definitions in blocks.
         */
        readonly resolvedTeam: import('../generated/ast.js').Team | undefined;
        
        /**
         * The business model classification of this Bounded Context.
         * 
         * **Precedence (Highest to Lowest):**
         * 1. BoundedContextClassificationBlock.businessModel
         * 2. Standalone BusinessModelBlock
         */
        readonly businessModel: import('../generated/ast.js').Classification | undefined;
        
        /**
         * The lifecycle classification of this Bounded Context.
         * 
         * **Precedence (Highest to Lowest):**
         * 1. BoundedContextClassificationBlock.lifecycle
         * 2. Standalone LifecycleBlock
         */
        readonly lifecycle: import('../generated/ast.js').Classification | undefined;
        
        /**
         * Metadata for this Bounded Context.
         * 
         * **Precedence:** Merged from all MetadataBlocks (later entries override)
         */
        readonly metadata: ReadonlyMap<string, string>;
        
        /** SDK-computed fully qualified name */
        readonly fqn: string;
        
        /**
         * Checks if this bounded context has the specified role.
         * @param name - Role name or Classification to check
         */
        hasRole(name: string | import('../generated/ast.js').Classification): boolean;
        
        /**
         * Checks if this bounded context is owned by the specified team.
         * @param name - Team name or Team to check
         */
        hasTeam(name: string | import('../generated/ast.js').Team): boolean;
        
        /**
         * Checks if this bounded context has metadata with the given key (and optionally value).
         * @param key - Metadata key
         * @param value - Optional value to match
         */
        hasMetadata(key: string, value?: string): boolean;
    }

    /**
     * Augmented Domain with SDK-resolved properties.
     */
    interface Domain {
        /**
         * The description of this Domain.
         * 
         * **Precedence:** First DescriptionBlock found
         */
        readonly description: string | undefined;
        
        /**
         * The vision statement for this Domain.
         * 
         * **Precedence:** First VisionBlock found
         */
        readonly vision: string | undefined;
        
        /**
         * The classification of this Domain (Core, Supporting, Generic).
         * 
         * **Precedence:** First DomainClassificationBlock found
         */
        readonly classification: import('../generated/ast.js').Classification | undefined;
        
        /** SDK-computed fully qualified name */
        readonly fqn: string;
        
        /**
         * Checks if this domain has the specified classification.
         * @param name - Classification name or Classification to check
         */
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
