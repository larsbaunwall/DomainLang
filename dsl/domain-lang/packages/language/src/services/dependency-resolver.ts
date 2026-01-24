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
 * 5. Resolve version constraints using "Latest Wins" strategy
 * 6. Generate lock file with pinned commit hashes
 * 
 * Resolution Strategy ("Latest Wins"):
 * - SemVer tags (same major): Pick highest compatible version
 * - Same branch: No conflict, resolve once
 * - Commit pins: Error (explicit pins are intentional)
 * - Major version mismatch: Error
 * - Tag vs Branch: Error (incompatible intent)
 */

import path from 'node:path';
import fs from 'node:fs/promises';
import YAML from 'yaml';
import { GitUrlParser, GitUrlResolver } from './git-url-resolver.js';
import { parseSemVer, pickLatestSemVer, detectRefType } from './semver.js';
import type { SemVer, ResolvingPackage, LockFile, LockedDependency, DependencyGraph } from './types.js';

export class DependencyResolver {
    private gitResolver: GitUrlResolver;
    private workspaceRoot: string;

    constructor(workspaceRoot: string, gitResolver?: GitUrlResolver) {
        this.workspaceRoot = workspaceRoot;
        // Per PRS-010: Project-local cache at .dlang/packages/
        const cacheDir = path.join(workspaceRoot, '.dlang', 'packages');
        this.gitResolver = gitResolver || new GitUrlResolver(cacheDir);
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

        // Apply overrides before conflict detection
        this.applyOverrides(graph, rootConfig.overrides);

        // Detect version conflicts and package-level cycles before resolving
        this.detectVersionConflicts(graph);
        this.detectPackageCycles(graph);

        // Resolve version constraints
        await this.resolveVersions(graph);

        // Generate and return lock file (caller writes to disk)
        return this.generateLockFile(graph);
    }

    /**
     * Applies ref overrides from model.yaml to resolve conflicts explicitly.
     * 
     * Overrides take precedence over all other constraints.
     * 
     * @example
     * ```yaml
     * overrides:
     *   domainlang/core: v2.0.0
     * ```
     */
    private applyOverrides(graph: DependencyGraph, overrides?: Record<string, string>): void {
        if (!overrides) return;

        for (const [pkg, overrideRef] of Object.entries(overrides)) {
            const node = graph.nodes[pkg];
            if (node) {
                // Override replaces all constraints with a single definitive ref
                node.constraints = new Set([overrideRef]);
                node.refConstraint = overrideRef;
                
                // Track that this was an override for messaging
                this.overrideMessages.push(`Override applied: ${pkg}@${overrideRef}`);
            }
        }
    }

    /** Override messages for CLI output */
    private overrideMessages: string[] = [];

    /**
     * Returns any override messages from the last dependency resolution.
     */
    getOverrideMessages(): string[] {
        return this.overrideMessages;
    }

    /**
     * Builds the complete dependency graph by recursively discovering transitive dependencies.
     */
    private async buildDependencyGraph(rootConfig: ResolvingPackage): Promise<DependencyGraph> {
        const graph: DependencyGraph = {
            nodes: {},
            root: rootConfig.name || 'root',
        };

        // Process root dependencies
        const queue: Array<{ packageKey: string; refConstraint: string; parent: string }> = [];
        
        for (const [depName, refConstraint] of Object.entries(rootConfig.dependencies || {})) {
            queue.push({ 
                packageKey: depName, 
                refConstraint, 
                parent: graph.root 
            });
        }

        // BFS to discover all transitive dependencies
        const visited = new Set<string>();

        while (queue.length > 0) {
            const entry = queue.shift();
            if (!entry) break;
            const { packageKey, refConstraint, parent } = entry;

            // Skip if already processed
            if (visited.has(packageKey)) {
                // Update dependents list and record constraint
                const existing = graph.nodes[packageKey];
                if (!existing.dependents.includes(parent)) {
                    existing.dependents.push(parent);
                }
                if (!existing.constraints) existing.constraints = new Set<string>();
                existing.constraints.add(refConstraint);
                continue;
            }
            visited.add(packageKey);

            // Parse package identifier
            const gitInfo = GitUrlParser.parse(packageKey);
            
            // Download package to get its model.yaml
            const packageUri = await this.gitResolver.resolve(packageKey);
            const packageDir = path.dirname(packageUri.fsPath);

            // Load package config
            const packageConfig = await this.loadPackageConfig(packageDir);

            // Add to graph
            graph.nodes[packageKey] = {
                packageKey,
                refConstraint,
                constraints: new Set<string>([refConstraint]),
                repoUrl: gitInfo.repoUrl,
                dependencies: packageConfig.dependencies || {},
                dependents: [parent],
            };

            // Queue transitive dependencies
            for (const [transDepName, transRefConstraint] of Object.entries(packageConfig.dependencies || {})) {
                queue.push({
                    packageKey: transDepName,
                    refConstraint: transRefConstraint,
                    parent: packageKey,
                });
            }
        }

        return graph;
    }

    /**
     * Resolves ref constraints to specific commits.
     * 
     * Simple algorithm: Use the ref specified in the constraint.
     * Detects refType (tag, branch, or commit) based on format.
     */
    private async resolveVersions(graph: DependencyGraph): Promise<void> {
        for (const [packageKey, node] of Object.entries(graph.nodes)) {
            // Parse package to get repo info
            const gitInfo = GitUrlParser.parse(packageKey);

            // Extract ref from constraint
            const ref = this.extractRefFromConstraint(node.refConstraint);
            
            // Detect ref type based on format
            const refType = detectRefType(ref);
            
            // Resolve ref to commit hash
            const commitHash = await this.resolveCommitHash(gitInfo.repoUrl, ref);

            node.resolvedRef = ref;
            node.refType = refType;
            node.commitHash = commitHash;
        }
    }

    /**
     * Extracts a ref from a constraint string.
     * 
     * Examples:
     * - "^1.0.0" → "1.0.0" (treated as tag)
     * - "~2.3.0" → "2.3.0" (treated as tag)
     * - "1.5.0" → "1.5.0" (treated as tag)
     * - "main" → "main" (treated as branch)
     * - "abc123def" → "abc123def" (treated as commit)
     * - "owner/repo@1.0.0" → "1.0.0"
     */
    private extractRefFromConstraint(constraint: string): string {
        // Remove semver operators (legacy support)
        let ref = constraint.replace(/^[\^~>=<]/, '');
        
        // Extract ref from full import URL if present
        if (ref.includes('@')) {
            ref = ref.split('@')[1];
        }
        
        return ref || 'main';
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
        // Per PRS-010: Project-local cache at .dlang/packages/{owner}/{repo}/{commit}/
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
            if (!node.resolvedRef || !node.commitHash) {
                throw new Error(
                    `Failed to resolve ref for '${packageKey}'.\n` +
                    `Hint: Check that the package exists and the ref is valid.`
                );
            }

            dependencies[packageKey] = {
                ref: node.resolvedRef,
                refType: node.refType ?? 'commit',
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
    private async loadPackageConfig(packageDir: string): Promise<ResolvingPackage> {
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
     *     ref: v1.0.0
     */
    private parseYaml(content: string): ResolvingPackage {
        const parsed = YAML.parse(content) as {
            model?: {
                name?: string;
                version?: string;
                entry?: string;
            };
            dependencies?: Record<string, { source?: string; ref?: string }>;
            overrides?: Record<string, string>;
        };

        const config: ResolvingPackage = {};

        if (parsed.model) {
            config.name = parsed.model.name;
            config.version = parsed.model.version;
            config.entry = parsed.model.entry;
        }

        if (parsed.dependencies) {
            config.dependencies = {};
            for (const [, depInfo] of Object.entries(parsed.dependencies)) {
                if (depInfo.source) {
                    const refConstraint = depInfo.ref || 'main';
                    // Store as "source@ref" for consistency with import resolution
                    config.dependencies[depInfo.source] = refConstraint;
                }
            }
        }

        // Parse overrides section for explicit ref control
        if (parsed.overrides) {
            config.overrides = parsed.overrides;
        }

        return config;
    }

    /**
     * Detects ref conflicts and applies "Latest Wins" resolution strategy.
     * 
     * Resolution Rules:
     * - SemVer tags (same major): Pick highest version automatically
     * - Same branch refs: No conflict, use single resolution
     * - Commit SHA conflicts: Error (explicit pins are intentional)
     * - Major version mismatch: Error (breaking change)
     * - Tag vs Branch: Error (incompatible intent)
     * 
     * Modifies graph nodes in-place to set the resolved constraint.
     * Throws an error only for unresolvable conflicts.
     */
    private detectVersionConflicts(graph: DependencyGraph): void {
        const resolutionMessages: string[] = [];

        for (const [pkg, node] of Object.entries(graph.nodes)) {
            const constraints = node.constraints ?? new Set<string>([node.refConstraint]);
            
            if (constraints.size <= 1) continue; // No conflict
            
            const refs = Array.from(constraints);
            const refTypes = refs.map(ref => ({
                ref,
                type: detectRefType(ref),
                semver: parseSemVer(ref),
            }));
            
            // Check for mixed types (tag vs branch vs commit)
            const types = new Set(refTypes.map(r => r.type));
            
            // Case 1: All commits - must be exact match
            if (types.size === 1 && types.has('commit')) {
                this.throwConflictError(pkg, refs, node.dependents,
                    'Explicit commit pins cannot be automatically resolved.\n' +
                    'Add an override in model.yaml:\n\n' +
                    '  overrides:\n' +
                    `    ${pkg}: ${refs[0]}`
                );
            }
            
            // Case 2: Mixed types (tag vs branch or tag vs commit)
            if (types.size > 1) {
                this.throwConflictError(pkg, refs, node.dependents,
                    'Cannot mix ref types (tags, branches, commits).\n' +
                    'Add an override in model.yaml to specify which to use:\n\n' +
                    '  overrides:\n' +
                    `    ${pkg}: <ref>`
                );
            }
            
            // Case 3: All branches - must be same branch
            if (types.size === 1 && types.has('branch')) {
                const uniqueBranches = new Set(refs);
                if (uniqueBranches.size > 1) {
                    this.throwConflictError(pkg, refs, node.dependents,
                        'Different branch refs cannot be automatically resolved.\n' +
                        'Add an override in model.yaml:\n\n' +
                        '  overrides:\n' +
                        `    ${pkg}: ${refs[0]}`
                    );
                }
                // Same branch - no conflict, continue
                continue;
            }
            
            // Case 4: All SemVer tags - apply "Latest Wins"
            const semvers = refTypes
                .filter((r): r is typeof r & { semver: SemVer } => r.semver !== undefined)
                .map(r => r.semver);
            
            if (semvers.length !== refs.length) {
                // Some refs don't parse as SemVer - can't auto-resolve
                this.throwConflictError(pkg, refs, node.dependents,
                    'Not all refs are valid SemVer tags.\n' +
                    'Add an override in model.yaml:\n\n' +
                    '  overrides:\n' +
                    `    ${pkg}: <ref>`
                );
            }
            
            // Check major version compatibility
            const majors = new Set(semvers.map(s => s.major));
            if (majors.size > 1) {
                const majorList = Array.from(majors).sort().join(' vs ');
                this.throwConflictError(pkg, refs, node.dependents,
                    `Major version mismatch (v${majorList}). This may indicate breaking changes.\n` +
                    'Add an override in model.yaml if you want to force a version:\n\n' +
                    '  overrides:\n' +
                    `    ${pkg}: ${refs[refs.length - 1]}`
                );
            }
            
            // All same major version - pick latest (Latest Wins!)
            const latest = pickLatestSemVer(refs);
            if (latest && latest !== node.refConstraint) {
                // Update the node to use the resolved ref
                node.refConstraint = latest;
                
                // Log the resolution for user feedback
                const otherRefs = refs.filter(r => r !== latest).join(', ');
                resolutionMessages.push(
                    `Resolved ${pkg}: using ${latest} (satisfies ${otherRefs})`
                );
            }
        }
        
        // Store resolution messages for later output
        if (resolutionMessages.length > 0) {
            this.resolutionMessages = resolutionMessages;
        }
    }
    
    /**
     * Throws a formatted conflict error with actionable hints.
     */
    private throwConflictError(
        pkg: string, 
        refs: string[], 
        dependents: string[],
        hint: string
    ): never {
        const depLines = dependents.map((d, i) => 
            `  └─ ${d} requires ${pkg}@${refs[i] || refs[0]}`
        ).join('\n');
        
        throw new Error(
            `Dependency ref conflict for '${pkg}'\n` +
            depLines + '\n\n' +
            hint
        );
    }
    
    /** Resolution messages from "Latest Wins" auto-resolution */
    private resolutionMessages: string[] = [];
    
    /**
     * Returns any resolution messages from the last dependency resolution.
     * Useful for CLI output to inform users about auto-resolved conflicts.
     */
    getResolutionMessages(): string[] {
        return this.resolutionMessages;
    }

    /**
     * Detects package-level cycles in the dependency graph and throws a clear error.
     */
    private detectPackageCycles(graph: DependencyGraph): void {
        const GRAY = 1, BLACK = 2;
        const color: Record<string, number> = {};
        const stack: string[] = [];

        const visit = (pkg: string): void => {
            color[pkg] = GRAY;
            stack.push(pkg);
            const deps = Object.keys(graph.nodes[pkg]?.dependencies ?? {});
            for (const dep of deps) {
                if (!graph.nodes[dep]) continue; // Unknown dep will resolve later
                if (color[dep] === GRAY) {
                    // Found a back edge: cycle
                    const cycleStart = stack.indexOf(dep);
                    const cyclePath = [...stack.slice(cycleStart), dep].join(' → ');
                    throw new Error(
                        `Cyclic package dependency detected:\n` +
                        `  ${cyclePath}\n\n` +
                        `Hint: Extract shared types into a separate package that both can depend on.`
                    );
                }
                if (color[dep] !== BLACK) visit(dep);
            }
            stack.pop();
            color[pkg] = BLACK;
        };

        for (const pkg of Object.keys(graph.nodes)) {
            if (!color[pkg]) visit(pkg);
        }
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
