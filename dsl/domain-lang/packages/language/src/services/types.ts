/**
 * Centralized Type Definitions for DomainLang Services
 * 
 * Type design principles:
 * - **Atomic**: Each type represents a single, well-defined concept
 * - **Non-overlapping**: Types don't duplicate fields unnecessarily
 * - **Rich**: Types use adjacent types for composition rather than primitives
 * - **Discriminated**: Union types use discriminants for type narrowing
 * 
 * Type hierarchy:
 * ```
 * Core Building Blocks
 *   ├── RefType (discriminant for git references)
 *   └── SemVer (semantic version components)
 * 
 * Package Identity
 *   └── PackageIdentity (name, version, entry)
 * 
 * Dependencies
 *   ├── DependencySpec (how deps are specified)
 *   │   ├── ShortDependencySpec (string ref only)
 *   │   └── ExtendedDependencySpec (full options)
 *   └── ResolvedDependency (locked/pinned state)
 * 
 * Manifest & Lock
 *   ├── ModelManifest (model.yaml schema)
 *   └── LockFile (model.lock schema)
 * 
 * Resolution Graph
 *   ├── DependencyNode (graph node during resolution)
 *   └── DependencyGraph (complete resolution graph)
 * 
 * Analysis & Governance
 *   ├── GovernancePolicy (policy configuration)
 *   └── GovernanceViolation (validation result)
 * ```
 * 
 * @module services/types
 */

// ============================================================================
// Core Building Blocks
// ============================================================================

/**
 * Type of git reference for version pinning.
 * 
 * Used as discriminant in ref-related types:
 * - **tag**: SemVer version tag (v1.0.0, 2.3.4)
 * - **branch**: Branch name (main, develop)
 * - **commit**: Full commit SHA (40 hex chars)
 */
export type RefType = 'tag' | 'branch' | 'commit';

/**
 * Parsed semantic version following SemVer 2.0.0.
 * 
 * @example
 * ```typescript
 * const v: SemVer = {
 *   major: 1, minor: 2, patch: 3,
 *   preRelease: 'beta.1',
 *   original: 'v1.2.3-beta.1'
 * };
 * ```
 */
export interface SemVer {
    readonly major: number;
    readonly minor: number;
    readonly patch: number;
    /** Pre-release identifier (e.g., "alpha", "beta.1", "rc.2") */
    readonly preRelease?: string;
    /** Build metadata - ignored in version comparison */
    readonly buildMetadata?: string;
    /** Original string representation */
    readonly original: string;
}

/**
 * Result of parsing a git ref string.
 */
export interface ParsedRef {
    readonly type: RefType;
    /** Present only for valid SemVer tags */
    readonly semver?: SemVer;
    readonly original: string;
}

// ============================================================================
// Package Identity
// ============================================================================

/**
 * Core package identity and metadata.
 * 
 * Used in model.yaml `model:` section and internally during resolution.
 */
export interface PackageIdentity {
    /** Package name in owner/repo format */
    readonly name?: string;
    /** SemVer version string */
    readonly version?: string;
    /** Entry point file (default: index.dlang) */
    readonly entry?: string;
}

// ============================================================================
// Dependency Specification Types
// ============================================================================

/**
 * Extended dependency specification with full options.
 * 
 * Either `source` OR `path` must be provided (mutually exclusive):
 * - `source`: Remote git coordinates (owner/repo)
 * - `path`: Local filesystem path for monorepo deps
 */
export interface ExtendedDependencySpec {
    /** Git coordinates (owner/repo) - mutually exclusive with path */
    readonly source?: string;
    /** Git ref (tag, branch, or commit SHA) */
    readonly ref?: string;
    /** Local path - mutually exclusive with source */
    readonly path?: string;
    /** SHA-256 integrity hash for verification */
    readonly integrity?: string;
    /** Human-readable description */
    readonly description?: string;
}

/**
 * Dependency specification in model.yaml.
 * 
 * Can be either:
 * - **string**: Short form (just the ref, key is owner/repo)
 * - **ExtendedDependencySpec**: Full form with options
 * 
 * @example
 * ```yaml
 * dependencies:
 *   acme/core: "v1.0.0"              # Short form
 *   acme/utils:                       # Extended form
 *     source: acme/utils
 *     ref: main
 *     integrity: sha256-abc123
 * ```
 */
export type DependencySpec = string | ExtendedDependencySpec;

/**
 * Type guard for extended dependency spec.
 */
export function isExtendedDependencySpec(dep: DependencySpec): dep is ExtendedDependencySpec {
    return typeof dep === 'object' && dep !== null;
}

// ============================================================================
// Resolved/Locked Dependency Types
// ============================================================================

/**
 * A fully resolved and locked dependency.
 * 
 * Represents a dependency after resolution with all fields pinned
 * to exact values for reproducible builds.
 */
export interface LockedDependency {
    /** Original ref from manifest */
    readonly ref: string;
    /** Detected ref type */
    readonly refType: RefType;
    /** Full git URL used for fetching */
    readonly resolved: string;
    /** Exact commit hash (40-char SHA) */
    readonly commit: string;
    /** Optional integrity hash */
    readonly integrity?: string;
}

// ============================================================================
// Manifest Types (model.yaml)
// ============================================================================

/**
 * Path aliases for @ imports.
 * 
 * @example
 * ```yaml
 * paths:
 *   "@/": "./src/"
 *   "@shared/": "./libs/shared/"
 * ```
 */
export type PathAliases = Readonly<Record<string, string>>;

/**
 * Governance policy configuration.
 */
export interface GovernancePolicy {
    /** Allowed git domains (e.g., ['github.com/acme']) */
    readonly allowedSources?: readonly string[];
    /** Blocked packages or patterns */
    readonly blockedPackages?: readonly string[];
    /** Require stable versions only (no pre-release) */
    readonly requireStableVersions?: boolean;
    /** Require team ownership metadata */
    readonly requireTeamOwnership?: boolean;
    /** Allowed licenses */
    readonly allowedLicenses?: readonly string[];
}

/**
 * Package manifest (model.yaml) schema.
 * 
 * This is the user-facing YAML file structure.
 */
export interface ModelManifest {
    /** Package identity and metadata */
    readonly model?: PackageIdentity;
    /** Path aliases for @ imports */
    readonly paths?: PathAliases;
    /** Dependencies keyed by alias or owner/repo */
    readonly dependencies?: Readonly<Record<string, DependencySpec>>;
    /** Ref overrides for conflict resolution */
    readonly overrides?: Readonly<Record<string, string>>;
    /** Governance policies */
    readonly governance?: GovernancePolicy;
}

// ============================================================================
// Lock File Types (model.lock)
// ============================================================================

/**
 * Lock file schema (model.lock).
 * 
 * Pins exact commits for reproducible builds.
 */
export interface LockFile {
    /** Lock file format version */
    readonly version: string;
    /** All locked dependencies keyed by package name */
    readonly dependencies: Readonly<Record<string, LockedDependency>>;
}

// ============================================================================
// Dependency Resolution Types (internal)
// ============================================================================

/**
 * Mutable package metadata during resolution.
 * 
 * Unlike PackageIdentity (readonly user-facing), this is mutable
 * because the resolver builds it incrementally during YAML parsing.
 */
export interface ResolvingPackage {
    name?: string;
    version?: string;
    entry?: string;
    exports?: Record<string, string>;
    /** Dependencies as name → ref constraint */
    dependencies?: Record<string, string>;
    /** Ref overrides */
    overrides?: Record<string, string>;
}

/**
 * Node in the dependency graph during resolution.
 */
export interface DependencyNode {
    /** Package identifier (owner/repo) */
    readonly packageKey: string;
    /** Primary ref constraint from first encounter */
    refConstraint: string;
    /** All observed constraints from different parents */
    constraints?: Set<string>;
    /** Resolved ref after conflict resolution */
    resolvedRef?: string;
    /** Detected ref type */
    refType?: RefType;
    /** Resolved commit hash */
    commitHash?: string;
    /** Full git repository URL */
    repoUrl?: string;
    /** Direct dependencies of this package */
    dependencies: Record<string, string>;
    /** Parent packages that depend on this one */
    dependents: string[];
}

/**
 * Complete dependency graph for resolution.
 */
export interface DependencyGraph {
    /** All discovered packages */
    readonly nodes: Record<string, DependencyNode>;
    /** Root package name */
    readonly root: string;
}

// ============================================================================
// Git Import Types
// ============================================================================

/** Supported git platforms */
export type GitPlatform = 'github' | 'gitlab' | 'bitbucket' | 'generic';

/**
 * Parsed git import with repository information.
 */
export interface GitImportInfo {
    /** Original import string */
    readonly original: string;
    /** Git platform */
    readonly platform: GitPlatform;
    /** Repository owner/organization */
    readonly owner: string;
    /** Repository name */
    readonly repo: string;
    /** Version (tag, branch, or commit) */
    readonly version: string;
    /** Full git repository URL */
    readonly repoUrl: string;
    /** Package entry point */
    readonly entryPoint: string;
}

// ============================================================================
// Dependency Analysis Types
// ============================================================================

/**
 * Node in a dependency tree visualization.
 */
export interface DependencyTreeNode {
    readonly packageKey: string;
    readonly ref: string;
    readonly commit: string;
    readonly dependencies: readonly DependencyTreeNode[];
    /** Depth in tree (0 = root) */
    readonly depth: number;
}

/**
 * Reverse dependency relationship.
 */
export interface ReverseDependency {
    /** Package that depends on the target */
    readonly dependentPackage: string;
    /** Ref of the dependent */
    readonly ref: string;
    /** Relationship type */
    readonly type: 'direct' | 'transitive';
}

/**
 * Version update policy.
 */
export interface VersionPolicy {
    readonly policy: 'latest' | 'stable' | 'pinned';
    readonly ref: string;
    readonly availableRefs?: readonly string[];
}

// ============================================================================
// Governance Types
// ============================================================================

/** Governance violation type discriminant */
export type GovernanceViolationType = 
    | 'blocked-source' 
    | 'unstable-version' 
    | 'missing-metadata' 
    | 'license-violation';

/** Governance violation severity */
export type GovernanceViolationSeverity = 'error' | 'warning';

/**
 * A governance policy violation.
 */
export interface GovernanceViolation {
    readonly type: GovernanceViolationType;
    readonly packageKey: string;
    readonly message: string;
    readonly severity: GovernanceViolationSeverity;
}

/**
 * Governance metadata for a package (from model.yaml).
 */
export interface GovernanceMetadata {
    readonly team?: string;
    readonly contact?: string;
    readonly domain?: string;
    readonly compliance?: readonly string[];
}

// ============================================================================
// Workspace Types
// ============================================================================

/**
 * Options for workspace manager initialization.
 */
export interface WorkspaceManagerOptions {
    /** Auto-resolve dependencies on initialization */
    readonly autoResolve?: boolean;
    /** Manifest file names to search for */
    readonly manifestFiles?: readonly string[];
    /** Lock file names to search for */
    readonly lockFiles?: readonly string[];
    /** Allow network access for git operations */
    readonly allowNetwork?: boolean;
}
