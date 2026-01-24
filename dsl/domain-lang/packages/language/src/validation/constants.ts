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
// Issue Codes for Code Actions
// ============================================================================

/**
 * Diagnostic codes used to identify validation issues.
 * Code actions match on these codes to provide quick fixes.
 * 
 * Naming convention: CATEGORY_SPECIFIC_ISSUE
 */
export const IssueCodes = {
    // Import & Dependency Issues
    ImportMissingUri: 'import-missing-uri',
    ImportRequiresManifest: 'import-requires-manifest',
    ImportNotInManifest: 'import-not-in-manifest',
    ImportNotInstalled: 'import-not-installed',
    ImportConflictingSourcePath: 'import-conflicting-source-path',
    ImportMissingSourceOrPath: 'import-missing-source-or-path',
    ImportMissingRef: 'import-missing-ref',
    ImportAbsolutePath: 'import-absolute-path',
    ImportEscapesWorkspace: 'import-escapes-workspace',
    
    // Domain Issues
    DomainNoVision: 'domain-no-vision',
    DomainCircularHierarchy: 'domain-circular-hierarchy',
    
    // Bounded Context Issues
    BoundedContextNoDescription: 'bounded-context-no-description',
    BoundedContextNoDomain: 'bounded-context-no-domain',
    BoundedContextClassificationConflict: 'bounded-context-classification-conflict',
    BoundedContextTeamConflict: 'bounded-context-team-conflict',
    
    // Integration Pattern Issues
    SharedKernelNotBidirectional: 'shared-kernel-not-bidirectional',
    AclOnWrongSide: 'acl-on-wrong-side',
    ConformistOnWrongSide: 'conformist-on-wrong-side',
    TooManyPatterns: 'too-many-patterns',
    
    // Context/Domain Map Issues
    ContextMapNoContexts: 'context-map-no-contexts',
    ContextMapNoRelationships: 'context-map-no-relationships',
    DomainMapNoDomains: 'domain-map-no-domains',
    
    // Metadata Issues
    MetadataMissingName: 'metadata-missing-name',
    
    // General Issues
    DuplicateElement: 'duplicate-element'
} as const;

export type IssueCode = typeof IssueCodes[keyof typeof IssueCodes];

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
     * Error message when a circular domain hierarchy is detected.
     * @param cycle - Array of domain names forming the cycle
     */
    DOMAIN_CIRCULAR_HIERARCHY: (cycle: string[]) =>
        `Circular domain hierarchy detected: ${cycle.join(' → ')}.`,
    
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
        `Too many integration patterns (${count}) on ${side} side. Typically use 1-2 patterns per side.`,

    // ========================================================================
    // Import & Dependency Validation (PRS-010 Phase 8)
    // ========================================================================

    /**
     * Error when import statement has no URI.
     */
    IMPORT_MISSING_URI: () =>
        `Import statement must have a URI. Use: import "package" or import "./local-path"`,

    /**
     * Error when external dependency requires model.yaml but none exists.
     * @param specifier - The import specifier (e.g., "core", "domainlang/patterns")
     */
    IMPORT_REQUIRES_MANIFEST: (specifier: string) =>
        `External dependency '${specifier}' requires model.yaml.\n` +
        `Hint: Create model.yaml and add the dependency:\n` +
        `  dependencies:\n` +
        `    ${specifier}:\n` +
        `      ref: v1.0.0`,

    /**
     * Error when import specifier not found in manifest dependencies.
     * @param alias - The dependency alias/specifier
     */
    IMPORT_NOT_IN_MANIFEST: (alias: string) =>
        `Import '${alias}' not found in model.yaml dependencies.\n` +
        `Hint: Run 'dlang add ${alias} <source>@<ref>' to add it, or manually add to model.yaml:\n` +
        `  dependencies:\n` +
        `    ${alias}:\n` +
        `      ref: v1.0.0`,

    /**
     * Error when dependency not installed (no lock file entry).
     * @param alias - The dependency alias
     */
    IMPORT_NOT_INSTALLED: (alias: string) =>
        `Dependency '${alias}' not installed.\n` +
        `Hint: Run 'dlang install' to fetch dependencies and generate model.lock.`,

    /**
     * Error when dependency has conflicting source and path definitions.
     * @param alias - The dependency alias
     */
    IMPORT_CONFLICTING_SOURCE_PATH: (alias: string) =>
        `Dependency '${alias}' cannot define both 'source' and 'path' in model.yaml.\n` +
        `Hint: Use 'source' for git-based packages or 'path' for local workspace packages.`,

    /**
     * Error when dependency is missing both source and path.
     * @param alias - The dependency alias
     */
    IMPORT_MISSING_SOURCE_OR_PATH: (alias: string) =>
        `Dependency '${alias}' must define either 'source' or 'path' in model.yaml.\n` +
        `Hint: Add 'source: owner/repo' for git packages, or 'path: ./local/path' for local packages.`,

    /**
     * Error when git dependency is missing ref (tag, branch, or commit).
     * @param alias - The dependency alias
     */
    IMPORT_MISSING_REF: (alias: string) =>
        `Dependency '${alias}' must specify a git ref in model.yaml.\n` +
        `Hint: Add a git ref: 'ref: v1.0.0' (tag), 'ref: main' (branch), or a commit SHA.`,

    /**
     * Error when local path uses absolute path.
     * @param alias - The dependency alias
     * @param absolutePath - The absolute path that was specified
     */
    IMPORT_ABSOLUTE_PATH: (alias: string, absolutePath: string) =>
        `Local path dependency '${alias}' cannot use absolute path '${absolutePath}'.\n` +
        `Hint: Use a relative path from the workspace root, e.g., 'path: ./packages/shared'.`,

    /**
     * Error when local path escapes workspace boundary.
     * @param alias - The dependency alias
     */
    IMPORT_ESCAPES_WORKSPACE: (alias: string) =>
        `Local path dependency '${alias}' escapes workspace boundary.\n` +
        `Hint: Local dependencies must be within the workspace. Consider moving the dependency or using a git-based source.`,

    // ========================================================================
    // Context Map & Domain Map Validation
    // ========================================================================

    /**
     * Warning when context map contains no bounded contexts.
     * @param name - The context map name
     */
    CONTEXT_MAP_NO_CONTEXTS: (name: string) =>
        `Context Map '${name}' contains no bounded contexts.\n` +
        `Hint: Use 'contains ContextA, ContextB' to specify which contexts are in the map.`,

    /**
     * Info when context map has multiple contexts but no relationships.
     * @param name - The context map name
     * @param count - Number of contexts
     */
    CONTEXT_MAP_NO_RELATIONSHIPS: (name: string, count: number) =>
        `Context Map '${name}' contains ${count} contexts but no documented relationships.\n` +
        `Hint: Add relationships to show how contexts integrate (e.g., '[OHS] A -> [CF] B').`,

    /**
     * Warning when domain map contains no domains.
     * @param name - The domain map name
     */
    DOMAIN_MAP_NO_DOMAINS: (name: string) =>
        `Domain Map '${name}' contains no domains.\n` +
        `Hint: Use 'contains DomainA, DomainB' to specify which domains are in the map.`,

    // ========================================================================
    // Metadata Validation
    // ========================================================================

    /**
     * Error when metadata is missing a name.
     */
    METADATA_MISSING_NAME: () =>
        `Metadata must have a name.\n` +
        `Hint: Define metadata with: Metadata MyMetadata { ... }`
} as const;
