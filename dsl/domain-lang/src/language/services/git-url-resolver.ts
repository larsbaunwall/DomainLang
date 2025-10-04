/**
 * Git Repository Resolver Service
 * 
 * Resolves git-based package imports to local cached repositories.
 * Supports simplified GitHub syntax (owner/repo@version) and full URLs.
 * 
 * Design: Repository-level imports (not individual files)
 * - Imports load entire package
 * - Package entry point defined in model.yaml
 * - Version pinning at repository level
 */

import { URI } from 'langium';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import YAML from 'yaml';

const execAsync = promisify(exec);

/**
 * Parsed git import with repository-level information.
 */
export interface GitImportInfo {
    /** Original import string */
    original: string;
    /** Git platform (github, gitlab, bitbucket, or generic) */
    platform: 'github' | 'gitlab' | 'bitbucket' | 'generic';
    /** Repository owner/organization */
    owner: string;
    /** Repository name */
    repo: string;
    /** Version (tag, branch, or commit hash) */
    version: string;
    /** Full git repository URL */
    repoUrl: string;
    /** Package main entry point (from dlang.toml or default index.dlang) */
    entryPoint: string;
}

/**
 * Package metadata from model.yaml
 */
export interface PackageMetadata {
    name?: string;
    version?: string;
    main?: string; // Entry point file (legacy field name for compatibility)
    entry?: string; // Entry point file (preferred field name)
    exports?: Record<string, string>;
    dependencies?: Record<string, string>; // name → version constraint
}

/**
 * Lock file format (dlang.lock)
 * 
 * Pins exact versions and commit hashes for all dependencies
 * in the dependency tree. Ensures reproducible builds.
 */
export interface LockFile {
    version: string; // Lock file format version (currently "1")
    dependencies: Record<string, LockedDependency>; // package name → locked info
}

/**
 * A single locked dependency with pinned version and commit.
 */
export interface LockedDependency {
    version: string; // Resolved semantic version
    resolved: string; // Full git URL
    commit: string; // Exact commit hash (content-addressable)
    integrity?: string; // Optional SHA-256 hash for verification
}

/**
 * Parses import URLs into structured git import information.
 * 
 * Supported formats:
 * - owner/repo@version (GitHub assumed)
 * - owner/repo (GitHub, defaults to main)
 * - https://github.com/owner/repo@version
 * - https://gitlab.com/owner/repo@version
 * - https://git.example.com/owner/repo@version
 */
export class GitUrlParser {
    /**
     * Determines if an import string is a git repository import.
     */
    static isGitUrl(importStr: string): boolean {
        // GitHub shorthand: owner/repo or owner/repo@version
        if (/^[a-zA-Z0-9-]+\/[a-zA-Z0-9-_.]+(@[^/]+)?$/.test(importStr)) {
            return true;
        }

        // Full URLs
        return (
            importStr.startsWith('https://github.com/') ||
            importStr.startsWith('https://gitlab.com/') ||
            importStr.startsWith('https://bitbucket.org/') ||
            importStr.startsWith('https://git.') ||
            importStr.startsWith('git://')
        );
    }

    /**
     * Parses a git import URL into structured components.
     * 
     * @param importStr - The import URL string
     * @returns Parsed git import information
     * @throws Error if URL format is invalid
     */
    static parse(importStr: string): GitImportInfo {
        // Handle GitHub shorthand (owner/repo or owner/repo@version)
        if (this.isGitHubShorthand(importStr)) {
            return this.parseGitHubShorthand(importStr);
        }

        // Handle full URLs
        if (importStr.startsWith('https://') || importStr.startsWith('git://')) {
            return this.parseFullUrl(importStr);
        }

        throw new Error(`Invalid git import URL: ${importStr}`);
    }

    /**
     * Checks if string is GitHub shorthand format.
     */
    private static isGitHubShorthand(importStr: string): boolean {
        return /^[a-zA-Z0-9-]+\/[a-zA-Z0-9-_.]+(@[^/]+)?$/.test(importStr);
    }

    /**
     * Parses GitHub shorthand (owner/repo or owner/repo@version).
     */
    private static parseGitHubShorthand(importStr: string): GitImportInfo {
        const match = importStr.match(/^([a-zA-Z0-9-]+)\/([a-zA-Z0-9-_.]+)(?:@([^/]+))?$/);
        if (!match) {
            throw new Error(`Invalid GitHub shorthand format: ${importStr}`);
        }

        const [, owner, repo, version] = match;
        const resolvedVersion = version || 'main';

        return {
            original: importStr,
            platform: 'github',
            owner,
            repo,
            version: resolvedVersion,
            repoUrl: `https://github.com/${owner}/${repo}`,
            entryPoint: 'index.dlang', // Default, will be resolved from dlang.toml
        };
    }

    /**
     * Parses full git URLs (https://...).
     * 
     * Supported:
     * - https://github.com/owner/repo@version
     * - https://gitlab.com/owner/repo@version
     * - https://git.example.com/owner/repo@version
     */
    private static parseFullUrl(importStr: string): GitImportInfo {
        // GitHub
        const ghMatch = importStr.match(
            /^https:\/\/github\.com\/([^/]+)\/([^/@]+)(?:@([^/]+))?$/
        );
        if (ghMatch) {
            const [, owner, repo, version] = ghMatch;
            return {
                original: importStr,
                platform: 'github',
                owner,
                repo,
                version: version || 'main',
                repoUrl: `https://github.com/${owner}/${repo}`,
                entryPoint: 'index.dlang',
            };
        }

        // GitLab
        const glMatch = importStr.match(
            /^https:\/\/gitlab\.com\/([^/]+)\/([^/@]+)(?:@([^/]+))?$/
        );
        if (glMatch) {
            const [, owner, repo, version] = glMatch;
            return {
                original: importStr,
                platform: 'gitlab',
                owner,
                repo,
                version: version || 'main',
                repoUrl: `https://gitlab.com/${owner}/${repo}`,
                entryPoint: 'index.dlang',
            };
        }

        // Bitbucket
        const bbMatch = importStr.match(
            /^https:\/\/bitbucket\.org\/([^/]+)\/([^/@]+)(?:@([^/]+))?$/
        );
        if (bbMatch) {
            const [, owner, repo, version] = bbMatch;
            return {
                original: importStr,
                platform: 'bitbucket',
                owner,
                repo,
                version: version || 'main',
                repoUrl: `https://bitbucket.org/${owner}/${repo}`,
                entryPoint: 'index.dlang',
            };
        }

        // Generic git URL
        const genericMatch = importStr.match(
            /^(?:https|git):\/\/([^/]+)\/([^/]+)\/([^/@]+)(?:@([^/]+))?$/
        );
        if (genericMatch) {
            const [, host, owner, repo, version] = genericMatch;
            return {
                original: importStr,
                platform: 'generic',
                owner,
                repo,
                version: version || 'main',
                repoUrl: `https://${host}/${owner}/${repo}`,
                entryPoint: 'index.dlang',
            };
        }

        throw new Error(`Unsupported git URL format: ${importStr}`);
    }
}

/**
 * Resolves git repository imports to local entry point files.
 * 
 * Implements a content-addressable cache:
 * - Cache location: ~/.dlang/cache/
 * - Cache key: platform/owner/repo/commit-hash
 * - Downloads entire repository on first use
 * - Reads dlang.toml to find entry point
 * - Returns URI to entry point file
 */
export class GitUrlResolver {
    private cacheDir: string;
    private lockFile?: LockFile;

    constructor(cacheDir?: string) {
        this.cacheDir = cacheDir || path.join(os.homedir(), '.dlang', 'cache');
    }

    /**
     * Sets the lock file for dependency resolution.
     * 
     * When a lock file is set, all package imports will use
     * the locked commit hashes instead of resolving versions.
     * This ensures reproducible builds and handles transitive dependencies.
     * 
     * @param lockFile - The parsed lock file from the workspace root
     */
    setLockFile(lockFile: LockFile | undefined): void {
        this.lockFile = lockFile;
    }

    /**
     * Resolves a git import URL to the package's entry point file.
     * 
     * Process:
     * 1. Parse git URL
     * 2. Check lock file for pinned version (transitive dependency support)
     * 3. Resolve version to commit hash (if not locked)
     * 4. Check cache
     * 5. Download repository if not cached
     * 6. Read dlang.toml to find entry point
     * 7. Return URI to entry point file
     * 
     * @param importUrl - The git import URL
     * @returns URI to the package's entry point file
     */
    async resolve(importUrl: string): Promise<URI> {
        const gitInfo = GitUrlParser.parse(importUrl);

        // Check lock file for pinned version (handles transitive dependencies)
        let commitHash: string;
        const packageKey = `${gitInfo.owner}/${gitInfo.repo}`;
        
        if (this.lockFile?.dependencies[packageKey]) {
            // Use locked commit hash (reproducible build)
            commitHash = this.lockFile.dependencies[packageKey].commit;
        } else {
            // Resolve version dynamically (development mode or missing lock)
            commitHash = await this.resolveCommit(gitInfo);
        }

        // Check cache
        const cachedPath = this.getCachePath(gitInfo, commitHash);

        if (!(await this.existsInCache(cachedPath))) {
            // Download repository
            await this.downloadRepo(gitInfo, commitHash, cachedPath);
        }

        // Read package metadata to get entry point
        const entryPoint = await this.getEntryPoint(cachedPath);
        const entryFile = path.join(cachedPath, entryPoint);

        // Verify entry point exists
        if (!(await this.existsInCache(entryFile))) {
            throw new Error(
                `Entry point not found: ${entryPoint} in ${gitInfo.repoUrl}@${gitInfo.version}`
            );
        }

        return URI.file(entryFile);
    }

    /**
     * Reads model.yaml to get the package entry point.
     * Falls back to index.dlang if no model.yaml found.
     */
    private async getEntryPoint(repoPath: string): Promise<string> {
        const yamlPath = path.join(repoPath, 'model.yaml');

        try {
            const yamlContent = await fs.readFile(yamlPath, 'utf-8');
            const metadata = this.parseYaml(yamlContent);
            // Prefer 'entry' field, fallback to 'main' for backward compatibility
            return metadata.entry || metadata.main || 'index.dlang';
        } catch {
            // No model.yaml or parse error, use default
            return 'index.dlang';
        }
    }

    /**
     * Parses model.yaml content to extract entry point.
     * 
     * Expected structure:
     * model:
     *   entry: index.dlang
     */
    private parseYaml(content: string): PackageMetadata {
        const parsed = YAML.parse(content) as {
            model?: {
                name?: string;
                version?: string;
                entry?: string;
                main?: string;
            };
        };

        return {
            entry: parsed.model?.entry,
            main: parsed.model?.main,
            name: parsed.model?.name,
            version: parsed.model?.version,
        };
    }

    /**
     * Resolves a version (tag/branch) to a commit hash using git ls-remote.
     */
    private async resolveCommit(gitInfo: GitImportInfo): Promise<string> {
        try {
            // Try to resolve as tag or branch
            const { stdout } = await execAsync(
                `git ls-remote ${gitInfo.repoUrl} ${gitInfo.version}`
            );

            if (stdout.trim()) {
                const commitHash = stdout.split('\t')[0];
                return commitHash;
            }

            // If not found, assume it's already a commit hash
            if (/^[0-9a-f]{7,40}$/i.test(gitInfo.version)) {
                return gitInfo.version;
            }

            throw new Error(`Could not resolve version: ${gitInfo.version}`);
        } catch (error) {
            throw new Error(
                `Failed to resolve git version ${gitInfo.version} for ${gitInfo.repoUrl}: ${error}`
            );
        }
    }

    /**
     * Gets the local cache path for a git repository.
     * 
     * Format: ~/.dlang/cache/{platform}/{owner}/{repo}/{commit-hash}/
     */
    private getCachePath(gitInfo: GitImportInfo, commitHash: string): string {
        return path.join(
            this.cacheDir,
            gitInfo.platform,
            gitInfo.owner,
            gitInfo.repo,
            commitHash
        );
    }

    /**
     * Checks if a file or directory exists in the cache.
     */
    private async existsInCache(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Downloads a git repository to the cache.
     * 
     * Uses shallow clone for efficiency (only downloads the specific commit).
     */
    private async downloadRepo(
        gitInfo: GitImportInfo,
        commitHash: string,
        cachePath: string
    ): Promise<void> {
        const targetDir = path.resolve(cachePath);
        const parentDir = path.dirname(targetDir);
        await fs.mkdir(parentDir, { recursive: true });

        try {
            await execAsync(
                `git clone ${gitInfo.repoUrl}.git "${targetDir}" --no-checkout`
            );

            await execAsync(
                `git -C "${targetDir}" fetch --depth 1 origin ${commitHash}`
            );

            await execAsync(
                `git -C "${targetDir}" checkout --force --detach ${commitHash}`
            );

            await fs.rm(path.join(targetDir, '.git'), { recursive: true, force: true });
        } catch (error) {
            await fs.rm(targetDir, { recursive: true, force: true });
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(
                `Failed to download git repository ${gitInfo.repoUrl}@${gitInfo.version}: ${message}`
            );
        }
    }

    /**
     * Clears the entire cache.
     */
    async clearCache(): Promise<void> {
        await fs.rm(this.cacheDir, { recursive: true, force: true });
    }

    /**
     * Gets cache statistics (size, number of cached repos, etc.).
     */
    async getCacheStats(): Promise<{
        totalSize: number;
        repoCount: number;
        cacheDir: string;
    }> {
        let totalSize = 0;
        let repoCount = 0;

        try {
            const platforms = await fs.readdir(this.cacheDir);
            for (const platform of platforms) {
                const platformPath = path.join(this.cacheDir, platform);
                const owners = await fs.readdir(platformPath);
                for (const owner of owners) {
                    const ownerPath = path.join(platformPath, owner);
                    const repos = await fs.readdir(ownerPath);
                    for (const repo of repos) {
                        const repoPath = path.join(ownerPath, repo);
                        const commits = await fs.readdir(repoPath);
                        repoCount += commits.length;

                        for (const commit of commits) {
                            const commitPath = path.join(repoPath, commit);
                            totalSize += await this.getDirectorySize(commitPath);
                        }
                    }
                }
            }
        } catch {
            // Cache directory doesn't exist yet
        }

        return {
            totalSize,
            repoCount,
            cacheDir: this.cacheDir,
        };
    }

    /**
     * Gets the total size of a directory in bytes.
     */
    private async getDirectorySize(dirPath: string): Promise<number> {
        let size = 0;
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const entryPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                size += await this.getDirectorySize(entryPath);
            } else {
                const stats = await fs.stat(entryPath);
                size += stats.size;
            }
        }

        return size;
    }
}
