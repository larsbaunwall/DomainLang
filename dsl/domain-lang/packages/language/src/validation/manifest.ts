/**
 * Manifest Validation for DomainLang.
 * 
 * Provides schema validation and issue detection for model.yaml files.
 * This validation is triggered by the workspace manager when manifests are loaded.
 * 
 * Validation includes:
 * - Required fields for publishable packages
 * - Dependency configuration correctness
 * - Path alias validation
 * - Version format validation
 * 
 * @module
 */

import type { ModelManifest, DependencySpec, ExtendedDependencySpec } from '../services/types.js';
import { IssueCodes } from './constants.js';

// ============================================================================
// Manifest Validation Types
// ============================================================================

/**
 * Severity levels for manifest diagnostics.
 */
export type ManifestSeverity = 'error' | 'warning' | 'info';

/**
 * A diagnostic issue found in model.yaml.
 */
export interface ManifestDiagnostic {
    /** Issue code for code action mapping */
    readonly code: string;
    /** Error severity */
    readonly severity: ManifestSeverity;
    /** Human-readable message */
    readonly message: string;
    /** YAML path to the issue (e.g., "dependencies.core.version") */
    readonly path: string;
    /** Optional hint for resolution */
    readonly hint?: string;
}

/**
 * Result of manifest validation.
 */
export interface ManifestValidationResult {
    /** Whether the manifest is valid (no errors) */
    readonly valid: boolean;
    /** All diagnostics found */
    readonly diagnostics: ManifestDiagnostic[];
    /** Count of errors only */
    readonly errorCount: number;
    /** Count of warnings only */
    readonly warningCount: number;
}

// ============================================================================
// Issue Code Mapping for Manifest Validation
// ============================================================================

/**
 * Issue codes specific to manifest validation.
 * These extend the general IssueCodes for manifest-specific issues.
 */
export const ManifestIssueCodes = {
    // Model section issues
    ModelMissingName: 'manifest-model-missing-name',
    ModelMissingVersion: 'manifest-model-missing-version',
    ModelInvalidVersion: 'manifest-model-invalid-version',
    
    // Dependency section issues
    DependencyMissingRef: 'manifest-dependency-missing-ref',
    DependencyInvalidRef: 'manifest-dependency-invalid-ref',
    DependencyConflictingSourcePath: 'manifest-dependency-conflicting-source-path',
    DependencyMissingSourceOrPath: 'manifest-dependency-missing-source-or-path',
    DependencyInvalidSource: 'manifest-dependency-invalid-source',
    DependencyAbsolutePath: 'manifest-dependency-absolute-path',
    
    // Path alias issues
    PathAliasMissingAtPrefix: 'manifest-path-alias-missing-at-prefix',
    PathAliasAbsolutePath: 'manifest-path-alias-absolute-path'
} as const;

type ManifestIssueCode = typeof ManifestIssueCodes[keyof typeof ManifestIssueCodes] | typeof IssueCodes[keyof typeof IssueCodes];

// ============================================================================
// Manifest Validator
// ============================================================================

/**
 * Validates model.yaml manifests and reports issues.
 * 
 * Usage:
 * ```typescript
 * const validator = new ManifestValidator();
 * const result = validator.validate(manifest);
 * if (!result.valid) {
 *   console.log(result.diagnostics);
 * }
 * ```
 */
export class ManifestValidator {
    
    /**
     * Validates a parsed model.yaml manifest.
     * 
     * @param manifest - The parsed manifest object
     * @param options - Optional validation options
     * @returns Validation result with diagnostics
     */
    validate(
        manifest: ModelManifest, 
        options: { requirePublishable?: boolean } = {}
    ): ManifestValidationResult {
        const diagnostics: ManifestDiagnostic[] = [];
        
        // Validate model section
        this.validateModelSection(manifest, diagnostics, options.requirePublishable ?? false);
        
        // Validate dependencies section
        this.validateDependenciesSection(manifest, diagnostics);
        
        // Validate paths section
        this.validatePathsSection(manifest, diagnostics);
        
        // Calculate counts
        const errorCount = diagnostics.filter(d => d.severity === 'error').length;
        const warningCount = diagnostics.filter(d => d.severity === 'warning').length;
        
        return {
            valid: errorCount === 0,
            diagnostics,
            errorCount,
            warningCount
        };
    }
    
    /**
     * Validates the model section of the manifest.
     */
    private validateModelSection(
        manifest: ModelManifest, 
        diagnostics: ManifestDiagnostic[],
        requirePublishable: boolean
    ): void {
        const model = manifest.model;
        
        // If no model section and not requiring publishable, that's OK
        if (!model && !requirePublishable) {
            return;
        }
        
        // If requiring publishable package, name and version are required
        if (requirePublishable) {
            if (!model?.name) {
                diagnostics.push({
                    code: ManifestIssueCodes.ModelMissingName as ManifestIssueCode,
                    severity: 'error',
                    message: 'Publishable packages require a model.name field.',
                    path: 'model.name',
                    hint: 'Add "name: my-package" under the model section.'
                });
            }
            
            if (!model?.version) {
                diagnostics.push({
                    code: ManifestIssueCodes.ModelMissingVersion as ManifestIssueCode,
                    severity: 'error',
                    message: 'Publishable packages require a model.version field.',
                    path: 'model.version',
                    hint: 'Add "version: 1.0.0" under the model section.'
                });
            }
        }
        
        // Validate version format if present
        if (model?.version && !this.isValidSemVer(model.version)) {
            diagnostics.push({
                code: ManifestIssueCodes.ModelInvalidVersion as ManifestIssueCode,
                severity: 'warning',
                message: `Version '${model.version}' is not valid SemVer format.`,
                path: 'model.version',
                hint: 'Use SemVer format like "1.0.0" or "1.2.3-beta".'
            });
        }
    }
    
    /**
     * Validates the dependencies section of the manifest.
     */
    private validateDependenciesSection(
        manifest: ModelManifest, 
        diagnostics: ManifestDiagnostic[]
    ): void {
        const dependencies = manifest.dependencies;
        if (!dependencies) {
            return;
        }
        
        for (const [key, dep] of Object.entries(dependencies)) {
            this.validateDependency(key, dep, diagnostics);
        }
    }
    
    /**
     * Validates a single dependency entry.
     */
    private validateDependency(
        key: string,
        dep: DependencySpec,
        diagnostics: ManifestDiagnostic[]
    ): void {
        const normalized = this.normalizeDependency(key, dep);
        const basePath = `dependencies.${key}`;
        
        // Check for conflicting source and path
        if (normalized.source && normalized.path) {
            diagnostics.push({
                code: IssueCodes.ImportConflictingSourcePath,
                severity: 'error',
                message: `Dependency '${key}' cannot have both 'source' and 'path'.`,
                path: basePath,
                hint: `Use 'source' for git packages or 'path' for local workspace packages.`
            });
            return; // Don't validate further if this fundamental issue exists
        }
        
        // Check that at least one of source or path is present
        if (!normalized.source && !normalized.path) {
            diagnostics.push({
                code: IssueCodes.ImportMissingSourceOrPath,
                severity: 'error',
                message: `Dependency '${key}' must have either 'source' or 'path'.`,
                path: basePath,
                hint: `Add 'source: owner/repo' for git packages or 'path: ./local' for local packages.`
            });
            return;
        }
        
        // Validate source-based dependencies
        if (normalized.source) {
            this.validateSourceDependency(key, normalized, basePath, diagnostics);
        }
        
        // Validate path-based dependencies
        if (normalized.path) {
            this.validatePathDependency(key, normalized, basePath, diagnostics);
        }
    }
    
    /**
     * Validates a git-source based dependency.
     */
    private validateSourceDependency(
        key: string,
        dep: ExtendedDependencySpec,
        basePath: string,
        diagnostics: ManifestDiagnostic[]
    ): void {
        // Source dependencies require a ref (tag, branch, or commit)
        if (!dep.ref) {
            diagnostics.push({
                code: IssueCodes.ImportMissingRef,
                severity: 'error',
                message: `Git dependency '${key}' requires a ref.`,
                path: `${basePath}.ref`,
                hint: `Add a git ref: 'ref: v1.0.0' (tag), 'ref: main' (branch), or a commit SHA.`
            });
        }
        
        // Validate ref format
        if (dep.ref && !this.isValidRefSpec(dep.ref)) {
            diagnostics.push({
                code: ManifestIssueCodes.DependencyInvalidRef as ManifestIssueCode,
                severity: 'warning',
                message: `Ref '${dep.ref}' for '${key}' may be invalid.`,
                path: `${basePath}.ref`,
                hint: `Use a tag (v1.0.0), branch name (main), or commit SHA.`
            });
        }
        
        // Validate source format (should be owner/repo)
        if (dep.source && !this.isValidSourceFormat(dep.source)) {
            diagnostics.push({
                code: ManifestIssueCodes.DependencyInvalidSource as ManifestIssueCode,
                severity: 'error',
                message: `Source '${dep.source}' is not valid owner/repo format.`,
                path: `${basePath}.source`,
                hint: `Use format 'owner/repo' like 'domainlang/core'.`
            });
        }
    }
    
    /**
     * Validates a path-based local dependency.
     */
    private validatePathDependency(
        key: string,
        dep: ExtendedDependencySpec,
        basePath: string,
        diagnostics: ManifestDiagnostic[]
    ): void {
        // Path dependencies should use relative paths
        if (dep.path && this.isAbsolutePath(dep.path)) {
            diagnostics.push({
                code: IssueCodes.ImportAbsolutePath,
                severity: 'error',
                message: `Local path '${dep.path}' for '${key}' must be relative.`,
                path: `${basePath}.path`,
                hint: `Use a relative path like './packages/shared'.`
            });
        }
    }
    
    /**
     * Validates the paths section of the manifest.
     */
    private validatePathsSection(
        manifest: ModelManifest,
        diagnostics: ManifestDiagnostic[]
    ): void {
        const paths = manifest.paths;
        if (!paths) {
            return;
        }
        
        for (const [alias, targetPath] of Object.entries(paths)) {
            // Path aliases should start with @
            if (!alias.startsWith('@')) {
                diagnostics.push({
                    code: ManifestIssueCodes.PathAliasMissingAtPrefix as ManifestIssueCode,
                    severity: 'warning',
                    message: `Path alias '${alias}' should start with '@'.`,
                    path: `paths.${alias}`,
                    hint: `Rename to '@${alias}' for consistency.`
                });
            }
            
            // Target paths should be relative
            if (this.isAbsolutePath(targetPath)) {
                diagnostics.push({
                    code: ManifestIssueCodes.PathAliasAbsolutePath as ManifestIssueCode,
                    severity: 'error',
                    message: `Path alias '${alias}' cannot map to absolute path '${targetPath}'.`,
                    path: `paths.${alias}`,
                    hint: `Use a relative path like './src' or '.'`
                });
            }
        }
    }
    
    // ========================================================================
    // Helpers
    // ========================================================================
    
    /**
     * Normalizes a dependency to extended form.
     */
    private normalizeDependency(key: string, dep: DependencySpec): ExtendedDependencySpec {
        if (typeof dep === 'string') {
            return { source: key, ref: dep };
        }
        if (dep.source || dep.path) {
            return dep;
        }
        return { ...dep, source: key };
    }
    
    /**
     * Checks if a version string is valid SemVer.
     */
    private isValidSemVer(version: string): boolean {
        const semverRegex = /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/;
        return semverRegex.test(version);
    }
    
    /**
     * Checks if a ref spec is valid (tag, branch, or commit SHA).
     */
    private isValidRefSpec(ref: string): boolean {
        // SemVer with optional v prefix (tags)
        if (/^v?\d+\.\d+\.\d+/.test(ref)) {
            return true;
        }
        // Branch names (simple word chars)
        if (/^[\w][\w.-]*$/.test(ref)) {
            return true;
        }
        // Commit SHAs (40 hex chars)
        if (/^[0-9a-f]{40}$/i.test(ref)) {
            return true;
        }
        // Short commit SHAs (7+ hex chars)
        if (/^[0-9a-f]{7,}$/i.test(ref)) {
            return true;
        }
        return false;
    }
    
    /**
     * Checks if source is valid owner/repo format.
     */
    private isValidSourceFormat(source: string): boolean {
        return /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(source);
    }
    
    /**
     * Checks if a path is absolute.
     */
    private isAbsolutePath(p: string): boolean {
        return p.startsWith('/') || /^[A-Za-z]:/.test(p);
    }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Validates a manifest and returns true if valid, false otherwise.
 * Use this for simple pass/fail checks.
 */
export function isManifestValid(manifest: ModelManifest): boolean {
    const validator = new ManifestValidator();
    return validator.validate(manifest).valid;
}

/**
 * Validates a manifest and returns all diagnostics.
 * Use this to display validation errors to users.
 */
export function validateManifest(
    manifest: ModelManifest, 
    options?: { requirePublishable?: boolean }
): ManifestDiagnostic[] {
    const validator = new ManifestValidator();
    return validator.validate(manifest, options).diagnostics;
}
