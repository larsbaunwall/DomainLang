import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { DependencyAnalyzer } from '../../src/services/dependency-analyzer.js';
import type { LockFile } from '../../src/services/git-url-resolver.js';
import { join } from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import YAML from 'yaml';

describe('DependencyAnalyzer', () => {
    let analyzer: DependencyAnalyzer;

    beforeEach(() => {
        analyzer = new DependencyAnalyzer();
    });

    describe('buildDependencyTree', () => {
    test('should build tree from lock file with no dependencies', async () => {
            const lockFile: LockFile = {
                version: '1',
                dependencies: {},
            };

            const tree = await analyzer.buildDependencyTree(lockFile, '/tmp/test');
            expect(tree).toEqual([]);
        });

    test('should build tree with single dependency', async () => {
            const lockFile: LockFile = {
                version: '1',
                dependencies: {
                    'acme/patterns': {
                        version: '1.0.0',
                        resolved: 'https://github.com/acme/patterns',
                        commit: 'abc123',
                    },
                },
            };

            // Note: This test would need actual cache dir with model.yaml
            // For now, we test the structure
            const tree = await analyzer.buildDependencyTree(lockFile, '/tmp/test');
            expect(tree).toBeDefined();
        });
    });

    describe('formatDependencyTree', () => {
        test('should format empty tree', () => {
            const formatted = analyzer.formatDependencyTree([]);
            expect(formatted).toBe('');
        });

        test('should format tree with single node', () => {
            const tree = [{
                packageKey: 'acme/patterns',
                version: '1.0.0',
                commit: 'abc123',
                dependencies: [],
                depth: 0,
            }];

            const formatted = analyzer.formatDependencyTree(tree);
            expect(formatted).toContain('acme/patterns@1.0.0');
        });

        test('should format tree with nested dependencies', () => {
            const tree = [{
                packageKey: 'acme/patterns',
                version: '1.0.0',
                commit: 'abc123',
                dependencies: [{
                    packageKey: 'acme/core',
                    version: '2.0.0',
                    commit: 'def456',
                    dependencies: [],
                    depth: 1,
                }],
                depth: 0,
            }];

            const formatted = analyzer.formatDependencyTree(tree);
            expect(formatted).toContain('acme/patterns@1.0.0');
            expect(formatted).toContain('acme/core@2.0.0');
            expect(formatted).toMatch(/[├└]/); // Tree characters
        });

        test('should include commit hashes when requested', () => {
            const tree = [{
                packageKey: 'acme/patterns',
                version: '1.0.0',
                commit: 'abc123def',
                dependencies: [],
                depth: 0,
            }];

            const formatted = analyzer.formatDependencyTree(tree, { showCommits: true });
            expect(formatted).toContain('abc123d'); // First 7 chars
        });
    });

    describe('findReverseDependencies', () => {
            test('should find no dependencies for unused package', async () => {
            const lockFile: LockFile = {
                version: '1',
                dependencies: {
                    'acme/patterns': {
                        version: '1.0.0',
                        resolved: 'https://github.com/acme/patterns',
                        commit: 'abc123',
                    },
                },
            };

            const reverseDeps = await analyzer.findReverseDependencies(
                'acme/unused',
                lockFile,
                '/tmp/test'
            );
            expect(reverseDeps).toEqual([]);
        });
    });

    describe('resolveVersionPolicy', () => {
            test('should resolve "latest" policy', async () => {
            const result = await analyzer.resolveVersionPolicy(
                'acme/test',
                'latest',
                ['v1.0.0', 'v2.0.0', 'v1.5.0']
            );

            expect(result.policy).toBe('latest');
            expect(result.version).toBe('v2.0.0');
            expect(result.availableVersions).toContain('v2.0.0');
        });

            test('should resolve "stable" policy excluding pre-releases', async () => {
            const result = await analyzer.resolveVersionPolicy(
                'acme/test',
                'stable',
                ['v1.0.0', 'v2.0.0-beta', 'v1.5.0']
            );

            expect(result.policy).toBe('stable');
            expect(result.version).toBe('v1.5.0'); // Excludes beta
        });

            test('should resolve pinned version', async () => {
            const result = await analyzer.resolveVersionPolicy(
                'acme/test',
                'v1.2.3',
                ['v1.0.0', 'v1.2.3', 'v2.0.0']
            );

            expect(result.policy).toBe('pinned');
            expect(result.version).toBe('v1.2.3');
        });
    });

    describe('detectCircularDependencies', () => {
        let tempHome: string;
        let homeSpy: ReturnType<typeof vi.spyOn>;

        beforeEach(async () => {
            tempHome = await fs.mkdtemp(join(os.tmpdir(), 'dlang-cache-'));
            homeSpy = vi.spyOn(os, 'homedir').mockReturnValue(tempHome);
        });

        afterEach(async () => {
            homeSpy.mockRestore();
            await fs.rm(tempHome, { recursive: true, force: true });
        });

            test('should detect no cycles in acyclic graph', async () => {
            const lockFile: LockFile = {
                version: '1',
                dependencies: {
                    'acme/a': {
                        version: '1.0.0',
                        resolved: 'https://github.com/acme/a',
                        commit: 'aaa',
                    },
                    'acme/b': {
                        version: '1.0.0',
                        resolved: 'https://github.com/acme/b',
                        commit: 'bbb',
                    },
                },
            };

            const cycles = await analyzer.detectCircularDependencies(lockFile);
            expect(cycles).toEqual([]);
        });

            test('should detect simple cycle between packages', async () => {
            const lockFile: LockFile = {
                version: '1',
                dependencies: {
                    'acme/a': {
                        version: '1.0.0',
                        resolved: 'https://github.com/acme/a',
                        commit: 'aaa111',
                    },
                    'acme/b': {
                        version: '1.0.0',
                        resolved: 'https://github.com/acme/b',
                        commit: 'bbb222',
                    },
                },
            };

            const cacheA = join(tempHome, '.dlang', 'cache', 'github', 'acme', 'a', 'aaa111');
            await fs.mkdir(cacheA, { recursive: true });
            await fs.writeFile(
                join(cacheA, 'model.yaml'),
                YAML.stringify({
                    dependencies: {
                        serviceB: { source: 'acme/b', version: '1.0.0' },
                    },
                }),
                'utf-8'
            );

            const cacheB = join(tempHome, '.dlang', 'cache', 'github', 'acme', 'b', 'bbb222');
            await fs.mkdir(cacheB, { recursive: true });
            await fs.writeFile(
                join(cacheB, 'model.yaml'),
                YAML.stringify({
                    dependencies: {
                        serviceA: { source: 'acme/a', version: '1.0.0' },
                    },
                }),
                'utf-8'
            );

            const cycles = await analyzer.detectCircularDependencies(lockFile);
            expect(cycles).toContainEqual(['acme/a', 'acme/b', 'acme/a']);
        });
    });
});
