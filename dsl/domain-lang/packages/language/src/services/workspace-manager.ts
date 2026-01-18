import path from 'node:path';
import fs from 'node:fs/promises';
import YAML from 'yaml';
import { DependencyResolver } from './dependency-resolver.js';
import { GitUrlResolver } from './git-url-resolver.js';
import { getGlobalOptimizer } from './performance-optimizer.js';
import type { LockFile, LockedDependency } from './git-url-resolver.js';

const DEFAULT_MANIFEST_FILES = [
    'model.yaml'
] as const;

const DEFAULT_LOCK_FILES = [
    'model.lock'
] as const;

const JSON_SPACE = 2;

export interface WorkspaceManagerOptions {
    readonly autoResolve?: boolean;
    readonly manifestFiles?: readonly string[];
    readonly lockFiles?: readonly string[];
}

interface ManifestDependency {
    readonly source?: string;      // Git coordinates (owner/repo) - mutually exclusive with path
    readonly version?: string;     // Pinned version (tag, branch, or commit SHA)
    readonly path?: string;        // Local path for monorepo/workspace dependencies - mutually exclusive with source
    readonly integrity?: string;   // Optional SHA-256 hash for verification
    readonly description?: string; // Optional human-readable description
}

interface ModelManifest {
    readonly model?: {
        readonly name?: string;      // Package name (required for publishable packages)
        readonly version?: string;   // SemVer (required for publishable packages)
        readonly namespace?: string; // Root namespace this package exports (optional)
        readonly entry?: string;     // Entry point file (default: index.dlang)
    };
    readonly dependencies?: Record<string, ManifestDependency>;
}

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
                await this.generateLockFile();
            }
        }

        if (!this.lockFile) {
            throw new Error('Unable to resolve workspace lock file.');
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
     * Resolves a manifest dependency alias to its git import string.
     *
     * @param aliasPath - Alias from import statement (may include subpaths)
     * @returns Resolved git import string or undefined when alias is unknown
     */
    async resolveDependencyImport(aliasPath: string): Promise<string | undefined> {
        await this.ensureInitialized();
        const manifest = await this.loadManifest();
        const dependencies = manifest?.dependencies;

        if (!dependencies) {
            return undefined;
        }

        for (const [alias, dep] of Object.entries(dependencies)) {
            if (!dep?.source) {
                continue;
            }

            if (aliasPath === alias || aliasPath.startsWith(`${alias}/`)) {
                const suffix = aliasPath.slice(alias.length);
                const version = dep.version ?? '';
                const versionSegment = version
                    ? (version.startsWith('@') ? version : `@${version}`)
                    : '';
                return `${dep.source}${versionSegment}${suffix}`;
            }
        }

        return undefined;
    }

    private async performInitialization(startPath: string): Promise<void> {
        this.workspaceRoot = await this.findWorkspaceRoot(startPath);
        if (!this.workspaceRoot) {
            throw new Error('Workspace root (directory with model.yaml) not found.');
        }

        this.gitResolver = new GitUrlResolver();
        const loaded = await this.loadLockFileFromDisk();
        this.applyLockFile(loaded);

        if (!this.lockFile && this.options.autoResolve !== false) {
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
     */
    private validateManifest(manifest: ModelManifest, manifestPath: string): void {
        if (!manifest.dependencies) {
            return; // No dependencies to validate
        }

        for (const [alias, dep] of Object.entries(manifest.dependencies)) {
            // Validate mutually exclusive source and path
            if (dep.source && dep.path) {
                throw new Error(
                    `Invalid manifest at ${manifestPath}: Dependency '${alias}' cannot have both 'source' and 'path'. ` +
                    `Use 'source' for git dependencies or 'path' for local dependencies, not both.`
                );
            }

            // Validate at least one of source or path is specified
            if (!dep.source && !dep.path) {
                throw new Error(
                    `Invalid manifest at ${manifestPath}: Dependency '${alias}' must have either 'source' (for git dependencies) or 'path' (for local dependencies).`
                );
            }

            // Validate path is relative and within workspace
            if (dep.path) {
                this.validateLocalPath(dep.path, alias, manifestPath);
            }

            // Validate source has version when specified
            if (dep.source && !dep.version) {
                throw new Error(
                    `Invalid manifest at ${manifestPath}: Git dependency '${alias}' must specify a 'version' (tag, branch, or commit SHA).`
                );
            }
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
                `Invalid manifest at ${manifestPath}: Local path dependency '${alias}' cannot use absolute path '${localPath}'. ` +
                `Use relative paths (e.g., '../shared', './lib') for local dependencies.`
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
                `Invalid manifest at ${manifestPath}: Local path dependency '${alias}' escapes workspace boundary. ` +
                `Path '${localPath}' resolves to '${resolvedPath}' which is outside workspace '${workspaceRoot}'. ` +
                `Local dependencies must remain within the workspace.`
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
            if (!value || typeof value.version !== 'string' || typeof value.resolved !== 'string' || typeof value.commit !== 'string') {
                continue;
            }
            dependencies[key] = {
                version: value.version,
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
