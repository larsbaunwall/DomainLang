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
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import YAML from 'yaml';
import type { GitImportInfo, ResolvingPackage, LockFile } from './types.js';

const execAsync = promisify(exec);

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

        throw new Error(
            `Invalid git import URL: '${importStr}'.\n` +
            `Hint: Use 'owner/repo' or 'owner/repo@version' format (e.g., 'domainlang/core@v1.0.0').`
        );
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
            throw new Error(
                `Invalid GitHub shorthand format: '${importStr}'.\n` +
                `Hint: Use 'owner/repo' or 'owner/repo@version' format.`
            );
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
            entryPoint: 'index.dlang', // Default, will be resolved from model.yaml
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

        throw new Error(
            `Unsupported git URL format: '${importStr}'.\n` +
            `Supported formats:\n` +
            `  • owner/repo (GitHub shorthand)\n` +
            `  • owner/repo@version\n` +
            `  • https://github.com/owner/repo\n` +
            `  • https://gitlab.com/owner/repo`
        );
    }
}

/**
 * Resolves git repository imports to local entry point files.
 * 
 * Implements a content-addressable cache:
 * - Cache location: .dlang/packages/ (project-local, per PRS-010)
 * - Cache key: {owner}/{repo}/{commit-hash}
 * - Downloads entire repository on first use
 * - Reads model.yaml to find entry point
 * - Returns URI to entry point file
 */
export class GitUrlResolver {
    private cacheDir: string;
    private lockFile?: LockFile;

    /**
     * Creates a GitUrlResolver with a project-local cache directory.
     * 
     * @param cacheDir - The cache directory path. Per PRS-010, this should be
     *                   the project's `.dlang/packages/` directory for isolation
     *                   and reproducibility (like node_modules).
     */
    constructor(cacheDir: string) {
        this.cacheDir = cacheDir;
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
     * 6. Read model.yaml to find entry point
     * 7. Return URI to entry point file
     * 
     * @param importUrl - The git import URL
     * @returns URI to the package's entry point file
     */
    async resolve(importUrl: string, options: { allowNetwork?: boolean } = {}): Promise<URI> {
        const gitInfo = GitUrlParser.parse(importUrl);

        // Check lock file for pinned version (handles transitive dependencies)
        let commitHash: string;
        const packageKey = `${gitInfo.owner}/${gitInfo.repo}`;
        
        if (this.lockFile?.dependencies[packageKey]) {
            // Use locked commit hash (reproducible build)
            commitHash = this.lockFile.dependencies[packageKey].commit;
        } else {
            // No lock file entry - need to resolve dynamically
            if (options.allowNetwork === false) {
                // LSP mode: cannot perform network operations
                throw new Error(
                    `Dependency '${packageKey}' not installed.\n` +
                    `Hint: Run 'dlang install' to fetch dependencies and generate model.lock.`
                );
            }
            // CLI/dev mode: resolve version via network
            commitHash = await this.resolveCommit(gitInfo);
        }

        // Check cache
        const cachedPath = this.getCachePath(gitInfo, commitHash);

        if (!(await this.existsInCache(cachedPath))) {
            if (options.allowNetwork === false) {
                throw new Error(
                    `Dependency '${packageKey}' not installed.\n` +
                    `Hint: Run 'dlang install' to fetch dependencies.`
                );
            }

            // Download repository
            await this.downloadRepo(gitInfo, commitHash, cachedPath);
        }

        // Read package metadata to get entry point
        const entryPoint = await this.getEntryPoint(cachedPath);
        const entryFile = path.join(cachedPath, entryPoint);

        // Verify entry point exists
        if (!(await this.existsInCache(entryFile))) {
            throw new Error(
                `Entry point '${entryPoint}' not found in package '${gitInfo.owner}/${gitInfo.repo}@${gitInfo.version}'.\n` +
                `Hint: Ensure the package has an entry point file (default: index.dlang).`
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
            return metadata.entry ?? 'index.dlang';
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
    private parseYaml(content: string): ResolvingPackage {
        const parsed = YAML.parse(content) as {
            model?: {
                name?: string;
                version?: string;
                entry?: string;
            };
        };

        return {
            entry: parsed.model?.entry,
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

            throw new Error(
                `Could not resolve version '${gitInfo.version}' for ${gitInfo.repoUrl}.\n` +
                `Hint: Check that the version (tag, branch, or commit) exists in the repository.`
            );
        } catch (error) {
            throw new Error(
                `Failed to resolve git version '${gitInfo.version}' for ${gitInfo.repoUrl}.\n` +
                `Error: ${error}\n` +
                `Hint: Verify the repository URL is correct and accessible.`
            );
        }
    }

    /**
     * Gets the local cache path for a git repository.
     * 
     * Format: .dlang/packages/{owner}/{repo}/{version}/
     * 
     * Per PRS-010: Project-local cache structure mirrors the Design Considerations
     * section showing `.dlang/packages/{owner}/{repo}/{version}/` layout.
     */
    private getCachePath(gitInfo: GitImportInfo, commitHash: string): string {
        return path.join(
            this.cacheDir,
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
                `Failed to download package '${gitInfo.owner}/${gitInfo.repo}@${gitInfo.version}'.\n` +
                `Error: ${message}\n` +
                `Hint: Check your network connection and verify the repository URL is correct.`
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
     * 
     * Cache structure: .dlang/packages/{owner}/{repo}/{version}/
     */
    async getCacheStats(): Promise<{
        totalSize: number;
        repoCount: number;
        cacheDir: string;
    }> {
        let totalSize = 0;
        let repoCount = 0;

        try {
            const owners = await fs.readdir(this.cacheDir);
            for (const owner of owners) {
                const ownerPath = path.join(this.cacheDir, owner);
                const ownerStat = await fs.stat(ownerPath);
                if (!ownerStat.isDirectory()) continue;
                
                const repos = await fs.readdir(ownerPath);
                for (const repo of repos) {
                    const repoPath = path.join(ownerPath, repo);
                    const repoStat = await fs.stat(repoPath);
                    if (!repoStat.isDirectory()) continue;
                    
                    const versions = await fs.readdir(repoPath);
                    repoCount += versions.length;

                    for (const version of versions) {
                        const versionPath = path.join(repoPath, version);
                        totalSize += await this.getDirectorySize(versionPath);
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
