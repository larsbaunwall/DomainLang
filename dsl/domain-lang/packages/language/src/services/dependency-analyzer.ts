/**
 * Dependency Analysis Service
 * 
 * Provides tools for visualizing and analyzing dependency relationships:
 * - Dependency tree visualization
 * - Impact analysis (reverse dependencies)
 * - Circular dependency detection
 * - Version policy enforcement
 */

import type { LockFile, DependencyTreeNode, ReverseDependency, VersionPolicy } from './types.js';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import YAML from 'yaml';
import { sortVersionsDescending, isPreRelease } from './semver.js';

/**
 * Analyzes dependency relationships and provides visualization/analysis tools.
 */
export class DependencyAnalyzer {
    /**
     * Builds a dependency tree from a lock file.
     * 
     * @param lockFile - The lock file to analyze
     * @param workspaceRoot - Workspace root to load dependency metadata
     * @returns Root nodes of the dependency tree
     */
    async buildDependencyTree(lockFile: LockFile, workspaceRoot: string): Promise<DependencyTreeNode[]> {
        const manifestPath = path.join(workspaceRoot, 'model.yaml');
        
        // Load root manifest to get direct dependencies
        const rootDeps: Record<string, string> = {};
        try {
            const content = await fs.readFile(manifestPath, 'utf-8');
            const manifest = YAML.parse(content) as {
                dependencies?: Record<string, { source: string; version: string }>;
            };
            
            if (manifest.dependencies) {
                for (const [, dep] of Object.entries(manifest.dependencies)) {
                    rootDeps[dep.source] = dep.version;
                }
            }
        } catch {
            // No manifest or parse error
        }

        // Build tree for each direct dependency
        const rootNodes: DependencyTreeNode[] = [];
        const visited = new Set<string>();

        for (const packageKey of Object.keys(rootDeps)) {
            const node = await this.buildTreeNode(packageKey, lockFile, workspaceRoot, 0, visited);
            if (node) {
                rootNodes.push(node);
            }
        }

        return rootNodes;
    }

    /**
     * Recursively builds a dependency tree node.
     */
    private async buildTreeNode(
        packageKey: string,
        lockFile: LockFile,
        workspaceRoot: string,
        depth: number,
        visited: Set<string>
    ): Promise<DependencyTreeNode | null> {
        const locked = lockFile.dependencies[packageKey];
        if (!locked) {
            return null;
        }

        // Prevent infinite recursion
        if (visited.has(packageKey)) {
            return {
                packageKey,
                ref: locked.ref,
                commit: locked.commit,
                dependencies: [], // Don't recurse into already visited
                depth,
            };
        }

        visited.add(packageKey);

        // Load package dependencies from cache
        const cacheDir = this.getCacheDir(packageKey, locked.commit);
        const packageDeps = await this.loadPackageDependencies(cacheDir);

        // Build child nodes
        const children: DependencyTreeNode[] = [];
        for (const depKey of Object.keys(packageDeps)) {
            const childNode = await this.buildTreeNode(depKey, lockFile, workspaceRoot, depth + 1, new Set(visited));
            if (childNode) {
                children.push(childNode);
            }
        }

        return {
            packageKey,
            ref: locked.ref,
            commit: locked.commit,
            dependencies: children,
            depth,
        };
    }

    /**
     * Finds all packages that depend on a given package.
     * 
     * @param targetPackage - Package to analyze
     * @param lockFile - Lock file with all dependencies
     * @param workspaceRoot - Workspace root
     * @returns List of reverse dependencies
     */
    async findReverseDependencies(
        targetPackage: string,
        lockFile: LockFile,
        workspaceRoot: string
    ): Promise<ReverseDependency[]> {
        const reverseDeps: ReverseDependency[] = [];
        const manifestPath = path.join(workspaceRoot, 'model.yaml');

        // Check if target is a direct dependency of root
        try {
            const content = await fs.readFile(manifestPath, 'utf-8');
            const manifest = YAML.parse(content) as {
                dependencies?: Record<string, { source: string; version: string }>;
            };

            if (manifest.dependencies) {
                for (const [, dep] of Object.entries(manifest.dependencies)) {
                    if (dep.source === targetPackage) {
                        reverseDeps.push({
                            dependentPackage: 'root',
                            ref: 'workspace',
                            type: 'direct',
                        });
                    }
                }
            }
        } catch {
            // Ignore
        }

        // Check all other packages in lock file
        for (const [packageKey, locked] of Object.entries(lockFile.dependencies)) {
            if (packageKey === targetPackage) {
                continue;
            }

            const cacheDir = this.getCacheDir(packageKey, locked.commit);
            const packageDeps = await this.loadPackageDependencies(cacheDir);

            if (packageDeps[targetPackage]) {
                reverseDeps.push({
                    dependentPackage: packageKey,
                    ref: locked.ref,
                    type: 'direct',
                });
            }
        }

        return reverseDeps;
    }

    /**
     * Formats a dependency tree as a readable string.
     */
    formatDependencyTree(nodes: DependencyTreeNode[], options: { showCommits?: boolean } = {}): string {
        const lines: string[] = [];

        const formatNode = (node: DependencyTreeNode, prefix: string, isLast: boolean): void => {
            const branch = isLast ? '└── ' : '├── ';
            const refStr = options.showCommits
                ? `${node.ref} (${node.commit.substring(0, 7)})`
                : node.ref;
            
            lines.push(`${prefix}${branch}${node.packageKey}@${refStr}`);

            const childPrefix = prefix + (isLast ? '    ' : '│   ');
            node.dependencies.forEach((child, index) => {
                const isLastChild = index === node.dependencies.length - 1;
                formatNode(child, childPrefix, isLastChild);
            });
        };

        nodes.forEach((node, index) => {
            formatNode(node, '', index === nodes.length - 1);
        });

        return lines.join('\n');
    }

    /**
     * Detects circular dependencies in a dependency graph.
     */
    async detectCircularDependencies(lockFile: LockFile): Promise<string[][]> {
        const cycles: string[][] = [];
        const visiting = new Set<string>();
        const completed = new Set<string>();

        const dfs = async (packageKey: string, path: string[]): Promise<void> => {
            if (visiting.has(packageKey)) {
                const cycleStart = path.indexOf(packageKey);
                const cycle = cycleStart >= 0
                    ? [...path.slice(cycleStart), packageKey]
                    : [...path, packageKey];
                cycles.push(cycle);
                return;
            }

            if (completed.has(packageKey)) {
                return;
            }

            visiting.add(packageKey);

            const locked = lockFile.dependencies[packageKey];
            if (locked) {
                const cacheDir = this.getCacheDir(packageKey, locked.commit);
                const deps = await this.loadPackageDependencies(cacheDir);

                for (const depKey of Object.keys(deps)) {
                    await dfs(depKey, [...path, packageKey]);
                }
            }

            visiting.delete(packageKey);
            completed.add(packageKey);
        };

        for (const packageKey of Object.keys(lockFile.dependencies)) {
            await dfs(packageKey, []);
        }

        return cycles;
    }

    /**
     * Resolves ref policies (latest, stable) to concrete refs.
     */
    async resolveVersionPolicy(
        _packageKey: string,
        policy: string,
        availableRefs: string[]
    ): Promise<VersionPolicy> {
        if (policy === 'latest') {
            // Return the most recent ref
            const sorted = sortVersionsDescending(availableRefs);
            return {
                policy: 'latest',
                ref: sorted[0] || 'main',
                availableRefs: sorted,
            };
        }

        if (policy === 'stable') {
            // Return the most recent stable ref (exclude pre-release)
            const stable = availableRefs.filter(v => !isPreRelease(v));
            const sorted = sortVersionsDescending(stable);
            return {
                policy: 'stable',
                ref: sorted[0] || 'main',
                availableRefs: sorted,
            };
        }

        // Pinned ref
        return {
            policy: 'pinned',
            ref: policy,
        };
    }

    /**
     * Gets the cache directory for a package.
     */
    private getCacheDir(packageKey: string, commit: string): string {
        const [owner, repo] = packageKey.split('/');
        return path.join(
            os.homedir(),
            '.dlang',
            'cache',
            'github', // Assume GitHub for now
            owner,
            repo,
            commit
        );
    }

    /**
     * Loads dependencies from a cached package.
     */
    private async loadPackageDependencies(cacheDir: string): Promise<Record<string, string>> {
        const manifestPath = path.join(cacheDir, 'model.yaml');

        try {
            const content = await fs.readFile(manifestPath, 'utf-8');
            const manifest = YAML.parse(content) as {
                dependencies?: Record<string, { source: string; version: string }>;
            };

            const deps: Record<string, string> = {};
            if (manifest.dependencies) {
                for (const [, dep] of Object.entries(manifest.dependencies)) {
                    deps[dep.source] = dep.version;
                }
            }

            return deps;
        } catch {
            return {};
        }
    }
}
