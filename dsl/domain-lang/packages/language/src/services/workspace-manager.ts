import path from 'node:path';
import fs from 'node:fs/promises';
import YAML from 'yaml';
import { DependencyResolver } from './dependency-resolver.js';
import { GitUrlResolver } from './git-url-resolver.js';
import { getGlobalOptimizer } from './performance-optimizer.js';
import type { 
    LockFile, 
    LockedDependency, 
    ModelManifest, 
    DependencySpec, 
    ExtendedDependencySpec, 
    PathAliases,
    WorkspaceManagerOptions 
} from './types.js';

const DEFAULT_MANIFEST_FILES = [
    'model.yaml'
] as const;

const DEFAULT_LOCK_FILES = [
    'model.lock'
] as const;

const JSON_SPACE = 2;

interface ManifestCache {
    readonly manifest: ModelManifest;
    readonly path: string;
    readonly mtimeMs: number;
}

interface LoadedLockFile {
    readonly lockFile: LockFile;
    readonly filePath: string;
}

/**
 * Coordinates workspace discovery, lock file lifecycle management, and git resolver configuration.
 */
export class WorkspaceManager {
    private readonly manifestFiles: readonly string[];
    private readonly lockFiles: readonly string[];
    private workspaceRoot: string | undefined;
    private lockFile: LockFile | undefined;
    private gitResolver: GitUrlResolver | undefined;
    private dependencyResolver: DependencyResolver | undefined;
    private initializePromise: Promise<void> | undefined;
    private manifestCache: ManifestCache | undefined;

    constructor(private readonly options: WorkspaceManagerOptions = {}) {
        this.manifestFiles = options.manifestFiles ?? [...DEFAULT_MANIFEST_FILES];
        this.lockFiles = options.lockFiles ?? [...DEFAULT_LOCK_FILES];
    }

    /**
     * Finds the workspace root, loads any existing lock file, and prepares the git resolver.
     * Repeated calls await the same initialization work.
     */
    async initialize(startPath: string): Promise<void> {
        if (!this.initializePromise) {
            this.initializePromise = this.performInitialization(startPath);
        }
        await this.initializePromise;
    }

    /**
     * Returns the absolute path of the workspace root.
     * @throws Error if {@link initialize} has not completed successfully.
     */
    getWorkspaceRoot(): string {
        if (!this.workspaceRoot) {
            throw new Error('WorkspaceManager not initialized. Call initialize() first.');
        }
        return this.workspaceRoot;
    }

    /**
     * Resolves the manifest file path within the workspace, if present.
     */
    async getManifestPath(): Promise<string | undefined> {
        await this.ensureInitialized();
        const root = this.workspaceRoot;
        if (!root) {
            return undefined;
        }

        for (const manifest of this.manifestFiles) {
            const candidate = path.join(root, manifest);
            if (await this.fileExists(candidate)) {
                return candidate;
            }
        }

        return undefined;
    }

    /**
     * Returns the parsed manifest when present, otherwise undefined.
     * Uses cached contents when unchanged on disk.
     */
    async getManifest(): Promise<ModelManifest | undefined> {
        await this.ensureInitialized();
        return this.loadManifest();
    }

    /**
     * Returns the cached lock file or triggers resolution when missing.
     */
    async ensureLockFile(): Promise<LockFile> {
        await this.ensureInitialized();

        if (!this.lockFile) {
            // Try loading from cache first
            const optimizer = getGlobalOptimizer();
            const cached = await optimizer.getCachedLockFile(this.workspaceRoot || '');
            
            if (cached) {
                this.lockFile = cached;
            } else {
                if (this.options.allowNetwork === false) {
                    throw new Error(
                        'Lock file (model.lock) not found and network access is disabled.\n' +
                        'Hint: Run \'dlang install\' to generate the lock file.'
                    );
                }
                await this.generateLockFile();
            }
        }

        if (!this.lockFile) {
            throw new Error(
                'Unable to resolve workspace lock file.\n' +
                'Hint: Ensure model.yaml exists and run \'dlang install\' to generate model.lock.'
            );
        }

        return this.lockFile;
    }

    /**
     * Gets the currently cached lock file without refreshing from disk.
     */
    async getLockFile(): Promise<LockFile | undefined> {
        await this.ensureInitialized();
        return this.lockFile;
    }

    /**
     * Reloads the lock file from disk, updating the git resolver.
     */
    async refreshLockFile(): Promise<LockFile | undefined> {
        await this.ensureInitialized();
        const loaded = await this.loadLockFileFromDisk();
        this.applyLockFile(loaded);
        return this.lockFile;
    }

    /**
     * Invalidates all cached data (manifest and lock file).
     * Call this when config files change externally (e.g., from CLI commands).
     * 
     * After invalidation, the next call to getManifest() or getLockFile()
     * will re-read from disk.
     */
    invalidateCache(): void {
        this.manifestCache = undefined;
        this.lockFile = undefined;
        // Re-apply undefined to git resolver to clear its lock file
        if (this.gitResolver) {
            this.gitResolver.setLockFile(undefined);
        }
    }

    /**
     * Invalidates only the manifest cache.
     * Call this when model.yaml changes.
     */
    invalidateManifestCache(): void {
        this.manifestCache = undefined;
    }

    /**
     * Invalidates only the lock file cache.
     * Call this when model.lock changes.
     */
    invalidateLockCache(): void {
        this.lockFile = undefined;
        if (this.gitResolver) {
            this.gitResolver.setLockFile(undefined);
        }
    }

    /**
     * Provides the shared git URL resolver configured with the current lock file.
     */
    async getGitResolver(): Promise<GitUrlResolver> {
        await this.ensureInitialized();
        if (!this.gitResolver) {
            throw new Error('GitUrlResolver not available. Workspace initialization failed.');
        }
        return this.gitResolver;
    }

    /**
     * Forces dependency resolution and regenerates lock files on disk.
     */
    async regenerateLockFile(): Promise<LockFile> {
        await this.ensureInitialized();
        await this.generateLockFile(true);
        if (!this.lockFile) {
            throw new Error('Failed to regenerate workspace lock file.');
        }
        return this.lockFile;
    }

    /**
     * Returns the path aliases from the manifest, if present.
     */
    async getPathAliases(): Promise<PathAliases | undefined> {
        const manifest = await this.getManifest();
        return manifest?.paths;
    }

    /**
     * Normalizes a dependency entry to its extended form.
     * Handles both short form (string version) and extended form (object).
     * 
     * In the new format, the key IS the owner/package, so source is derived from key
     * ONLY for git dependencies (not for path-based local dependencies).
     */
    private normalizeDependency(key: string, dep: DependencySpec): ExtendedDependencySpec {
        if (typeof dep === 'string') {
            // Short form: "owner/package": "v1.0.0" or "main"
            // Key is the source (owner/package format)
            return { source: key, ref: dep };
        }
        // Extended form:
        // - If has source: use as-is
        // - If has path: it's a local dep, don't set source
        // - If neither: derive source from key (owner/package becomes source)
        if (dep.source || dep.path) {
            return dep;
        }
        return { ...dep, source: key };
    }

    /**
     * Resolves a manifest dependency to its git import string.
     * 
     * NEW FORMAT (PRS-010): Dependencies are keyed by owner/package directly
     * @param specifier - Import specifier (owner/package format, may include subpaths)
     * @returns Resolved git import string or undefined when not found
     */
    async resolveDependencyImport(specifier: string): Promise<string | undefined> {
        await this.ensureInitialized();
        const manifest = await this.loadManifest();
        const dependencies = manifest?.dependencies;

        if (!dependencies) {
            return undefined;
        }

        // NEW: Dependencies are keyed by owner/package (e.g., "domainlang/core")
        // Import specifier is also owner/package, potentially with subpath
        for (const [key, dep] of Object.entries(dependencies)) {
            const normalized = this.normalizeDependency(key, dep);
            
            // Skip path-based dependencies (handled by path aliases)
            if (normalized.path) {
                continue;
            }

            if (!normalized.source) {
                continue;
            }

            // Match if specifier equals key or starts with key/
            if (specifier === key || specifier.startsWith(`${key}/`)) {
                const suffix = specifier.slice(key.length);
                const ref = normalized.ref ?? '';
                const refSegment = ref
                    ? (ref.startsWith('@') ? ref : `@${ref}`)
                    : '';
                return `${normalized.source}${refSegment}${suffix}`;
            }
        }

        return undefined;
    }

    private async performInitialization(startPath: string): Promise<void> {
        this.workspaceRoot = await this.findWorkspaceRoot(startPath) ?? path.resolve(startPath);

        // Per PRS-010: Project-local cache at .dlang/packages/ (like node_modules)
        const cacheDir = path.join(this.workspaceRoot, '.dlang', 'packages');
        this.gitResolver = new GitUrlResolver(cacheDir);
        const loaded = await this.loadLockFileFromDisk();
        this.applyLockFile(loaded);

        if (!this.lockFile && this.options.autoResolve !== false && this.options.allowNetwork !== false) {
            await this.generateLockFile();
        }
    }

    private async ensureInitialized(): Promise<void> {
        if (this.initializePromise) {
            await this.initializePromise;
        } else if (!this.workspaceRoot) {
            throw new Error('WorkspaceManager not initialized. Call initialize() first.');
        }
    }

    private applyLockFile(loaded: LoadedLockFile | undefined): void {
        if (!this.gitResolver) {
            return;
        }

        if (loaded) {
            this.lockFile = loaded.lockFile;
            this.gitResolver.setLockFile(this.lockFile);
        } else {
            this.lockFile = undefined;
            this.gitResolver.setLockFile(undefined);
        }
    }

    private async generateLockFile(force = false): Promise<void> {
        if (!this.workspaceRoot || !this.gitResolver) {
            throw new Error('WorkspaceManager not initialized.');
        }

        const resolver = this.ensureDependencyResolver();
        if (!force && this.lockFile) {
            return;
        }

        const lockFile = await resolver.resolveDependencies();
        this.lockFile = lockFile;
        this.gitResolver.setLockFile(lockFile);

        // Write JSON lock file
        await this.writeJsonLockFile(lockFile);
    }

    private ensureDependencyResolver(): DependencyResolver {
        if (!this.workspaceRoot || !this.gitResolver) {
            throw new Error('WorkspaceManager not initialized.');
        }

        if (!this.dependencyResolver) {
            this.dependencyResolver = new DependencyResolver(this.workspaceRoot, this.gitResolver);
        }

        return this.dependencyResolver;
    }

    private async writeJsonLockFile(lockFile: LockFile): Promise<void> {
        if (!this.workspaceRoot) {
            return;
        }

        const jsonPath = path.join(this.workspaceRoot, 'model.lock');
        const payload = {
            version: lockFile.version,
            dependencies: lockFile.dependencies,
        } satisfies LockFile;

        await fs.writeFile(jsonPath, JSON.stringify(payload, undefined, JSON_SPACE), 'utf-8');
    }

    private async loadLockFileFromDisk(): Promise<LoadedLockFile | undefined> {
        if (!this.workspaceRoot) {
            return undefined;
        }

        for (const filename of this.lockFiles) {
            const filePath = path.join(this.workspaceRoot, filename);
            const lockFile = await this.tryReadLockFile(filePath, filename);
            if (lockFile) {
                return { lockFile, filePath };
            }
        }

        return undefined;
    }

    private async tryReadLockFile(filePath: string, _filename: string): Promise<LockFile | undefined> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            return this.parseJsonLockFile(content);
        } catch (error) {
            if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
                return undefined;
            }
            throw error;
        }
    }

    private async loadManifest(): Promise<ModelManifest | undefined> {
        const manifestPath = await this.getManifestPath();
        if (!manifestPath) {
            this.manifestCache = undefined;
            return undefined;
        }

        try {
            const stat = await fs.stat(manifestPath);
            if (this.manifestCache &&
                this.manifestCache.path === manifestPath &&
                this.manifestCache.mtimeMs === stat.mtimeMs) {
                return this.manifestCache.manifest;
            }

            const content = await fs.readFile(manifestPath, 'utf-8');
            const manifest = (YAML.parse(content) ?? {}) as ModelManifest;
            
            // Validate manifest structure
            this.validateManifest(manifest, manifestPath);
            
            this.manifestCache = {
                manifest,
                path: manifestPath,
                mtimeMs: stat.mtimeMs,
            };
            return manifest;
        } catch (error) {
            if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
                this.manifestCache = undefined;
                return undefined;
            }
            throw error;
        }
    }

    /**
     * Validates manifest structure and dependency configurations.
     * Throws detailed errors for invalid manifests.
     * 
     * Supports both new format (owner/package: version) and extended format.
     */
    private validateManifest(manifest: ModelManifest, manifestPath: string): void {
        // Validate path aliases
        if (manifest.paths) {
            this.validatePathAliases(manifest.paths, manifestPath);
        }

        if (!manifest.dependencies) {
            return; // No dependencies to validate
        }

        for (const [key, dep] of Object.entries(manifest.dependencies)) {
            const normalized = this.normalizeDependency(key, dep);

            // Validate mutually exclusive source and path
            if (normalized.source && normalized.path) {
                throw new Error(
                    `Invalid dependency '${key}' in ${manifestPath}:\n` +
                    `Cannot specify both 'source' and 'path'.\n` +
                    `Hint: Use 'source' for git dependencies or 'path' for local workspace dependencies.`
                );
            }

            // For string format, source is always derived from key (valid)
            // For extended format without source or path, error
            if (typeof dep !== 'string' && !normalized.source && !normalized.path) {
                throw new Error(
                    `Invalid dependency '${key}' in ${manifestPath}:\n` +
                    `Must specify either 'source' or 'path'.\n` +
                    `Hint: Add 'source: owner/repo' for git dependencies, or 'path: ./local/path' for local packages.`
                );
            }

            // Validate path is relative and within workspace
            if (normalized.path) {
                this.validateLocalPath(normalized.path, key, manifestPath);
            }

            // Validate source has ref when specified
            if (normalized.source && !normalized.ref) {
                throw new Error(
                    `Invalid dependency '${key}' in ${manifestPath}:\n` +
                    `Git dependencies must specify a 'ref' (git reference).\n` +
                    `Hint: Add 'ref: v1.0.0' (tag), 'ref: main' (branch), or a commit SHA.`
                );
            }
        }
    }

    /**
     * Validates path aliases for security and correctness.
     */
    private validatePathAliases(paths: PathAliases, manifestPath: string): void {
        for (const [alias, targetPath] of Object.entries(paths)) {
            // Validate alias starts with @
            if (!alias.startsWith('@')) {
                throw new Error(
                    `Invalid path alias '${alias}' in ${manifestPath}:\n` +
                    `Path aliases must start with '@'.\n` +
                    `Hint: Rename to '@${alias}' in your model.yaml paths section.`
                );
            }

            // Validate target path doesn't escape workspace
            this.validateLocalPath(targetPath, alias, manifestPath);
        }
    }

    /**
     * Validates local path dependencies for security.
     * Ensures paths don't escape workspace boundary.
     */
    private validateLocalPath(localPath: string, alias: string, manifestPath: string): void {
        // Reject absolute paths
        if (path.isAbsolute(localPath)) {
            throw new Error(
                `Invalid local path '${alias}' in ${manifestPath}:\n` +
                `Cannot use absolute path '${localPath}'.\n` +
                `Hint: Use relative paths (e.g., './lib', '../shared') for local dependencies.`
            );
        }

        // Resolve path relative to manifest directory
        const manifestDir = path.dirname(manifestPath);
        const resolvedPath = path.resolve(manifestDir, localPath);
        const workspaceRoot = this.workspaceRoot || manifestDir;

        // Check if resolved path is within workspace
        const relativePath = path.relative(workspaceRoot, resolvedPath);
        if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
            throw new Error(
                `Invalid local path '${alias}' in ${manifestPath}:\n` +
                `Path '${localPath}' resolves outside workspace boundary.\n` +
                `Resolved: ${resolvedPath}\n` +
                `Workspace: ${workspaceRoot}\n` +
                `Hint: Local dependencies must be within the workspace. Consider moving the dependency or using a git-based source.`
            );
        }
    }

    private parseJsonLockFile(content: string): LockFile {
        const parsed = JSON.parse(content) as Partial<LockFile> & {
            dependencies?: Record<string, Partial<LockedDependency>>;
        };

        const version = typeof parsed.version === 'string' ? parsed.version : '1';
        const dependencies: Record<string, LockedDependency> = {};

        for (const [key, value] of Object.entries(parsed.dependencies ?? {})) {
            if (!value || typeof value.ref !== 'string' || typeof value.resolved !== 'string' || typeof value.commit !== 'string') {
                continue;
            }
            dependencies[key] = {
                ref: value.ref,
                refType: value.refType ?? 'commit', // Default to commit for backwards compatibility
                resolved: value.resolved,
                commit: value.commit,
                integrity: value.integrity,
            };
        }

        return { version, dependencies };
    }

    private async findWorkspaceRoot(startPath: string): Promise<string | undefined> {
        let current = path.resolve(startPath);
        const { root } = path.parse(current);

        while (true) {
            if (await this.containsManifest(current)) {
                return current;
            }

            if (current === root) {
                return undefined;
            }

            const parent = path.dirname(current);
            if (parent === current) {
                return undefined;
            }

            current = parent;
        }
    }

    private async containsManifest(dir: string): Promise<boolean> {
        for (const manifest of this.manifestFiles) {
            if (await this.fileExists(path.join(dir, manifest))) {
                return true;
            }
        }
        return false;
    }

    private async fileExists(targetPath: string): Promise<boolean> {
        try {
            await fs.access(targetPath);
            return true;
        } catch (error) {
            if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
                return false;
            }
            throw error;
        }
    }
}
