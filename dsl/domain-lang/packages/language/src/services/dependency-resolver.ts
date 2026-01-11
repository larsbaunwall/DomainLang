/**
 * Dependency Resolution Service
 * 
 * Discovers and resolves transitive dependencies for DomainLang packages.
 * Generates lock files for reproducible builds.
 * 
 * Algorithm:
 * 1. Parse root model.yaml
 * 2. Download all direct dependencies
 * 3. Parse each dependency's model.yaml
 * 4. Recursively discover transitive dependencies
 * 5. Resolve version constraints (simple: use latest satisfying version)
 * 6. Generate lock file with pinned commit hashes
 */

import path from 'node:path';
import fs from 'node:fs/promises';
import YAML from 'yaml';
import { GitUrlParser, GitUrlResolver, PackageMetadata, LockFile, LockedDependency } from './git-url-resolver.js';

/**
 * Dependency graph node representing a package and its dependencies.
 */
export interface DependencyNode {
    /** Package identifier (owner/repo) */
    packageKey: string;
    /** Version constraint from parent (e.g., "^1.0.0") */
    versionConstraint: string;
    /** Resolved version */
    resolvedVersion?: string;
    /** Resolved commit hash */
    commitHash?: string;
    /** Full git URL */
    repoUrl?: string;
    /** Direct dependencies of this package */
    dependencies: Record<string, string>;
    /** Parent packages that depend on this one */
    dependents: string[];
}

/**
 * Dependency graph for the entire workspace.
 */
export interface DependencyGraph {
    /** All discovered packages, keyed by owner/repo */
    nodes: Record<string, DependencyNode>;
    /** Root package name */
    root: string;
}

/**
 * Resolves dependencies and generates lock files.
 */
export type { LockFile, PackageMetadata } from './git-url-resolver.js';
export class DependencyResolver {
    private gitResolver: GitUrlResolver;
    private workspaceRoot: string;

    constructor(workspaceRoot: string, gitResolver?: GitUrlResolver) {
        this.workspaceRoot = workspaceRoot;
        this.gitResolver = gitResolver || new GitUrlResolver();
    }

    /**
     * Resolves all dependencies for a workspace.
     * 
     * Process:
     * 1. Load root model.yaml
     * 2. Build dependency graph (discover transitive deps)
     * 3. Resolve version constraints
     * 4. Generate lock file
     * 5. Download all dependencies to cache
     * 
     * @returns Generated lock file
     */
    async resolveDependencies(): Promise<LockFile> {
        // Load root package config
        const rootConfig = await this.loadPackageConfig(this.workspaceRoot);
        
        if (!rootConfig.dependencies || Object.keys(rootConfig.dependencies).length === 0) {
            // No dependencies
            return { version: '1', dependencies: {} };
        }

        // Build dependency graph
        const graph = await this.buildDependencyGraph(rootConfig);

        // Resolve version constraints
        await this.resolveVersions(graph);

        // Generate and return lock file (caller writes to disk)
        return this.generateLockFile(graph);
    }

    /**
     * Builds the complete dependency graph by recursively discovering transitive dependencies.
     */
    private async buildDependencyGraph(rootConfig: PackageMetadata): Promise<DependencyGraph> {
        const graph: DependencyGraph = {
            nodes: {},
            root: rootConfig.name || 'root',
        };

        // Process root dependencies
        const queue: Array<{ packageKey: string; versionConstraint: string; parent: string }> = [];
        
        for (const [depName, versionConstraint] of Object.entries(rootConfig.dependencies || {})) {
            queue.push({ 
                packageKey: depName, 
                versionConstraint, 
                parent: graph.root 
            });
        }

        // BFS to discover all transitive dependencies
        const visited = new Set<string>();

        while (queue.length > 0) {
            const entry = queue.shift();
            if (!entry) break;
            const { packageKey, versionConstraint, parent } = entry;

            // Skip if already processed
            if (visited.has(packageKey)) {
                // Update dependents list
                if (!graph.nodes[packageKey].dependents.includes(parent)) {
                    graph.nodes[packageKey].dependents.push(parent);
                }
                continue;
            }
            visited.add(packageKey);

            // Parse package identifier
            const gitInfo = GitUrlParser.parse(packageKey);
            
            // Download package to get its dlang.toml
            const packageUri = await this.gitResolver.resolve(packageKey);
            const packageDir = path.dirname(packageUri.fsPath);

            // Load package config
            const packageConfig = await this.loadPackageConfig(packageDir);

            // Add to graph
            graph.nodes[packageKey] = {
                packageKey,
                versionConstraint,
                repoUrl: gitInfo.repoUrl,
                dependencies: packageConfig.dependencies || {},
                dependents: [parent],
            };

            // Queue transitive dependencies
            for (const [transDepName, transVersionConstraint] of Object.entries(packageConfig.dependencies || {})) {
                queue.push({
                    packageKey: transDepName,
                    versionConstraint: transVersionConstraint,
                    parent: packageKey,
                });
            }
        }

        return graph;
    }

    /**
     * Resolves version constraints to specific versions.
     * 
     * Simple algorithm: Use the latest version that satisfies all constraints.
     * Future: Implement proper semantic versioning resolution.
     */
    private async resolveVersions(graph: DependencyGraph): Promise<void> {
        for (const [packageKey, node] of Object.entries(graph.nodes)) {
            // Parse package to get repo info
            const gitInfo = GitUrlParser.parse(packageKey);

            // For now, resolve to the version specified in the constraint
            // Future: Implement proper semver range resolution
            const version = this.extractVersionFromConstraint(node.versionConstraint);
            
            // Resolve version to commit hash
            const commitHash = await this.resolveCommitHash(gitInfo.repoUrl, version);

            node.resolvedVersion = version;
            node.commitHash = commitHash;
        }
    }

    /**
     * Extracts a version from a constraint string.
     * 
     * Examples:
     * - "^1.0.0" → "1.0.0"
     * - "~2.3.0" → "2.3.0"
     * - "1.5.0" → "1.5.0"
     * - "owner/repo@1.0.0" → "1.0.0"
     * 
     * Future: Implement proper semver range parsing and resolution.
     */
    private extractVersionFromConstraint(constraint: string): string {
        // Remove semver operators
        let version = constraint.replace(/^[\^~>=<]/, '');
        
        // Extract version from full import URL if present
        if (version.includes('@')) {
            version = version.split('@')[1];
        }
        
        return version || 'main';
    }

    /**
     * Resolves a version (tag/branch) to a commit hash using git ls-remote.
     */
    private async resolveCommitHash(repoUrl: string, version: string): Promise<string> {
        // This is a placeholder - the actual implementation is in GitUrlResolver
        // We need to extract it or call the resolver
        const gitInfo = GitUrlParser.parse(`${repoUrl}@${version}`);
        const uri = await this.gitResolver.resolve(gitInfo.original);
        
        // Extract commit hash from cache path
        // Cache format: ~/.dlang/cache/{platform}/{owner}/{repo}/{commit-hash}/
        const pathParts = uri.fsPath.split(path.sep);
        const commitHashIndex = pathParts.length - 2; // Second to last segment
        return pathParts[commitHashIndex];
    }

    /**
     * Generates a lock file from the resolved dependency graph.
     */
    private generateLockFile(graph: DependencyGraph): LockFile {
        const dependencies: Record<string, LockedDependency> = {};

        for (const [packageKey, node] of Object.entries(graph.nodes)) {
            if (!node.resolvedVersion || !node.commitHash) {
                throw new Error(`Failed to resolve version for ${packageKey}`);
            }

            dependencies[packageKey] = {
                version: node.resolvedVersion,
                resolved: node.repoUrl || '',
                commit: node.commitHash,
                // Future: Calculate integrity hash
            };
        }

        return {
            version: '1',
            dependencies,
        };
    }

    /**
     * Loads and parses a package's model.yaml file.
     */
    private async loadPackageConfig(packageDir: string): Promise<PackageMetadata> {
        const yamlPath = path.join(packageDir, 'model.yaml');

        try {
            const yamlContent = await fs.readFile(yamlPath, 'utf-8');
            return this.parseYaml(yamlContent);
        } catch {
            // No model.yaml found
            return {};
        }
    }

    /**
     * Parses model.yaml content.
     * 
     * Expected structure:
     * model:
     *   name: package-name
     *   version: 1.0.0
     *   entry: index.dlang
     * 
     * dependencies:
     *   package-name:
     *     source: owner/repo
     *     version: ^1.0.0
     */
    private parseYaml(content: string): PackageMetadata {
        const parsed = YAML.parse(content) as {
            model?: {
                name?: string;
                version?: string;
                entry?: string;
            };
            dependencies?: Record<string, { source?: string; version?: string }>;
        };

        const config: PackageMetadata = {};

        if (parsed.model) {
            config.name = parsed.model.name;
            config.version = parsed.model.version;
            config.main = parsed.model.entry;
        }

        if (parsed.dependencies) {
            config.dependencies = {};
            for (const [, depInfo] of Object.entries(parsed.dependencies)) {
                if (depInfo.source) {
                    const versionConstraint = depInfo.version || 'main';
                    // Store as "source@version" for consistency with import resolution
                    config.dependencies[depInfo.source] = versionConstraint;
                }
            }
        }

        return config;
    }

    /**
     * Loads an existing lock file from disk.
     */
    static async loadLockFile(workspaceRoot: string): Promise<LockFile | undefined> {
        const lockPath = path.join(workspaceRoot, 'model.lock');

        try {
            const content = await fs.readFile(lockPath, 'utf-8');
            return JSON.parse(content) as LockFile;
        } catch {
            // No lock file
            return undefined;
        }
    }

    /**
     * Parses a lock file from JSON format.
     */
    static parseLockFile(content: string): LockFile {
        return JSON.parse(content) as LockFile;
    }
}
