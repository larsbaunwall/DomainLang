import fs from 'node:fs/promises';
import path from 'node:path';
import type { ValidationAcceptor, ValidationChecks } from 'langium';
import { Cancellation } from 'langium';
import type { DomainLangAstType, ImportStatement } from '../generated/ast.js';
import type { DomainLangServices } from '../domain-lang-module.js';
import type { LangiumDocument } from 'langium';
import type { WorkspaceManager } from '../services/workspace-manager.js';
import type { ExtendedDependencySpec, ModelManifest, LockFile } from '../services/types.js';
import { ValidationMessages, buildCodeDescription, IssueCodes } from './constants.js';

/**
 * Validates import statements in DomainLang.
 *
 * Uses async validators (Langium 4.x supports MaybePromise<void>) to leverage
 * the shared WorkspaceManager service with its cached manifest/lock file reading.
 *
 * Checks:
 * - External imports require manifest + alias
 * - Local path dependencies stay inside workspace  
 * - Lock file exists for external dependencies
 */
export class ImportValidator {
    private readonly workspaceManager: WorkspaceManager;

    constructor(services: DomainLangServices) {
        this.workspaceManager = services.imports.WorkspaceManager;
    }

    /**
     * Validates an import statement asynchronously.
     *
     * Langium validators can return MaybePromise<void>, enabling async operations
     * like reading manifests via the shared, cached WorkspaceManager.
     */
    async checkImportPath(
        imp: ImportStatement,
        accept: ValidationAcceptor,
        document: LangiumDocument,
        _cancelToken: Cancellation.CancellationToken
    ): Promise<void> {
        if (!imp.uri) {
            accept('error', ValidationMessages.IMPORT_MISSING_URI(), {
                node: imp,
                keyword: 'import',
                codeDescription: buildCodeDescription('language.md', 'imports'),
                data: { code: IssueCodes.ImportMissingUri }
            });
            return;
        }

        if (!this.isExternalImport(imp.uri)) {
            return;
        }

        // Initialize workspace manager from document location
        const docDir = path.dirname(document.uri.fsPath);
        await this.workspaceManager.initialize(docDir);

        const manifest = await this.workspaceManager.getManifest();
        if (!manifest) {
            accept('error', ValidationMessages.IMPORT_REQUIRES_MANIFEST(imp.uri), {
                node: imp,
                property: 'uri',
                codeDescription: buildCodeDescription('language.md', 'imports'),
                data: { code: IssueCodes.ImportRequiresManifest, specifier: imp.uri }
            });
            return;
        }

        const alias = imp.uri.split('/')[0];
        const dependency = this.getDependency(manifest, alias);

        if (!dependency) {
            accept('error', ValidationMessages.IMPORT_NOT_IN_MANIFEST(alias), {
                node: imp,
                property: 'uri',
                codeDescription: buildCodeDescription('language.md', 'imports'),
                data: { code: IssueCodes.ImportNotInManifest, alias }
            });
            return;
        }

        this.validateDependencyConfig(dependency, alias, accept, imp);

        // External source dependencies require lock file and cached packages
        if (dependency.source) {
            const lockFile = await this.workspaceManager.getLockFile();
            if (!lockFile) {
                accept('error', ValidationMessages.IMPORT_NOT_INSTALLED(alias), {
                    node: imp,
                    property: 'uri',
                    codeDescription: buildCodeDescription('language.md', 'imports'),
                    data: { code: IssueCodes.ImportNotInstalled, alias }
                });
                return;
            }

            await this.validateCachedPackage(dependency, alias, lockFile, accept, imp);
        }
    }

    /**
     * Determines if an import URI is external (requires manifest).
     *
     * Per PRS-010:
     * - Local relative: ./path, ../path
     * - Path aliases: @/path, @alias/path (resolved via manifest paths section)
     * - External: owner/package (requires manifest dependencies)
     */
    private isExternalImport(uri: string): boolean {
        if (uri.startsWith('./') || uri.startsWith('../')) {
            return false;
        }
        if (uri.startsWith('@')) {
            return false;
        }
        return true;
    }

    /**
     * Gets the normalized dependency configuration for an alias.
     */
    private getDependency(manifest: ModelManifest, alias: string): ExtendedDependencySpec | undefined {
        const dep = manifest.dependencies?.[alias];
        if (!dep) {
            return undefined;
        }

        if (typeof dep === 'string') {
            return { source: alias, ref: dep };
        }

        if (!dep.source && !dep.path) {
            return { ...dep, source: alias };
        }

        return dep;
    }

    /**
     * Validates dependency configuration.
     */
    private validateDependencyConfig(
        dependency: ExtendedDependencySpec,
        alias: string,
        accept: ValidationAcceptor,
        imp: ImportStatement
    ): void {
        if (dependency.source && dependency.path) {
            accept('error', ValidationMessages.IMPORT_CONFLICTING_SOURCE_PATH(alias), {
                node: imp,
                property: 'uri',
                codeDescription: buildCodeDescription('language.md', 'imports'),
                data: { code: IssueCodes.ImportConflictingSourcePath, alias }
            });
            return;
        }

        if (!dependency.source && !dependency.path) {
            accept('error', ValidationMessages.IMPORT_MISSING_SOURCE_OR_PATH(alias), {
                node: imp,
                property: 'uri',
                codeDescription: buildCodeDescription('language.md', 'imports'),
                data: { code: IssueCodes.ImportMissingSourceOrPath, alias }
            });
            return;
        }

        if (dependency.source && !dependency.ref) {
            accept('error', ValidationMessages.IMPORT_MISSING_REF(alias), {
                node: imp,
                property: 'uri',
                codeDescription: buildCodeDescription('language.md', 'imports'),
                data: { code: IssueCodes.ImportMissingRef, alias }
            });
        }

        if (dependency.path) {
            this.validateLocalPathDependency(dependency.path, alias, accept, imp);
        }
    }

    /**
     * Validates local path dependencies stay within workspace.
     */
    private validateLocalPathDependency(
        dependencyPath: string,
        alias: string,
        accept: ValidationAcceptor,
        imp: ImportStatement
    ): void {
        if (path.isAbsolute(dependencyPath)) {
            accept('error', ValidationMessages.IMPORT_ABSOLUTE_PATH(alias, dependencyPath), {
                node: imp,
                property: 'uri',
                codeDescription: buildCodeDescription('language.md', 'imports'),
                data: { code: IssueCodes.ImportAbsolutePath, alias, path: dependencyPath }
            });
            return;
        }

        const workspaceRoot = this.workspaceManager.getWorkspaceRoot();
        const resolvedPath = path.resolve(workspaceRoot, dependencyPath);
        const relativeToWorkspace = path.relative(workspaceRoot, resolvedPath);

        if (relativeToWorkspace.startsWith('..') || path.isAbsolute(relativeToWorkspace)) {
            accept('error', ValidationMessages.IMPORT_ESCAPES_WORKSPACE(alias), {
                node: imp,
                property: 'uri',
                codeDescription: buildCodeDescription('language.md', 'imports'),
                data: { code: IssueCodes.ImportEscapesWorkspace, alias }
            });
        }
    }

    /**
     * Validates that external dependency is in lock file and cached.
     */
    private async validateCachedPackage(
        dependency: ExtendedDependencySpec,
        alias: string,
        lockFile: LockFile,
        accept: ValidationAcceptor,
        imp: ImportStatement
    ): Promise<void> {
        // Source is guaranteed to exist when this method is called (see caller)
        const packageKey = dependency.source ?? alias;
        const lockedDep = lockFile.dependencies[packageKey];

        if (!lockedDep) {
            accept('error', ValidationMessages.IMPORT_NOT_INSTALLED(alias), {
                node: imp,
                property: 'uri',
                codeDescription: buildCodeDescription('language.md', 'imports'),
                data: { code: IssueCodes.ImportNotInstalled, alias }
            });
            return;
        }

        const workspaceRoot = this.workspaceManager.getWorkspaceRoot();
        const cacheDir = this.getCacheDirectory(workspaceRoot, packageKey, lockedDep.commit);

        const cacheExists = await this.directoryExists(cacheDir);
        if (!cacheExists) {
            accept('error', ValidationMessages.IMPORT_NOT_INSTALLED(alias), {
                node: imp,
                property: 'uri',
                codeDescription: buildCodeDescription('language.md', 'imports'),
                data: { code: IssueCodes.ImportNotInstalled, alias }
            });
        }
    }

    /**
     * Gets the cache directory for a dependency.
     * Per PRS-010: Project-local cache at .dlang/packages/{owner}/{repo}/{commit}/
     */
    private getCacheDirectory(workspaceRoot: string, source: string, commitHash: string): string {
        const [owner, repo] = source.split('/');
        return path.join(workspaceRoot, '.dlang', 'packages', owner, repo, commitHash);
    }

    /**
     * Checks if a directory exists (async).
     */
    private async directoryExists(dirPath: string): Promise<boolean> {
        try {
            const stat = await fs.stat(dirPath);
            return stat.isDirectory();
        } catch {
            return false;
        }
    }
}

/**
 * Creates validation checks for import statements.
 *
 * Returns async validators that leverage the shared WorkspaceManager
 * for cached manifest/lock file reading.
 */
export function createImportChecks(services: DomainLangServices): ValidationChecks<DomainLangAstType> {
    const validator = new ImportValidator(services);

    return {
        // Langium 4.x supports async validators via MaybePromise<void>
        ImportStatement: async (imp, accept, cancelToken) => {
            const document = imp.$document;
            if (!document) return;

            await validator.checkImportPath(imp, accept, document, cancelToken);
        }
    };
}
