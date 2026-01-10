import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { PerformanceOptimizer, getGlobalOptimizer, resetGlobalOptimizer } from '../../src/services/performance-optimizer.js';
import type { LockFile } from '../../src/services/git-url-resolver.js';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';

describe('PerformanceOptimizer', () => {
    let optimizer: PerformanceOptimizer;
    let tempDir: string;

    beforeEach(async () => {
        optimizer = new PerformanceOptimizer({ cacheTTL: 1000 }); // 1 second TTL for testing
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dlang-perf-test-'));
    });

    afterEach(async () => {
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        } catch {
            // Ignore cleanup errors
        }
    });

    describe('getCachedLockFile', () => {
        test('returns undefined when no lock file exists', async () => {
            // Arrange
            // tempDir is set up in beforeEach with no lock file

            // Act
            const result = await optimizer.getCachedLockFile(tempDir);

            // Assert
            expect(result).toBeUndefined();
        });

        test('loads and caches lock file from disk', async () => {
            // Arrange
            const lockFile: LockFile = {
                version: '1',
                dependencies: {
                    'acme/test': {
                        version: '1.0.0',
                        resolved: 'https://github.com/acme/test',
                        commit: 'abc123',
                    },
                },
            };
            const lockPath = path.join(tempDir, 'model.lock');
            await fs.writeFile(lockPath, JSON.stringify(lockFile), 'utf-8');

            // Act
            const result = await optimizer.getCachedLockFile(tempDir);

            // Assert
            expect(result).toEqual(lockFile);
        });

        test('uses cache on second call', async () => {
            // Arrange
            const lockFile: LockFile = {
                version: '1',
                dependencies: {},
            };
            const lockPath = path.join(tempDir, 'model.lock');
            await fs.writeFile(lockPath, JSON.stringify(lockFile), 'utf-8');

            // Act
            // First call loads from disk
            const result1 = await optimizer.getCachedLockFile(tempDir);
            // Modify file
            await fs.writeFile(lockPath, JSON.stringify({ version: '2', dependencies: {} }), 'utf-8');
            // Second call uses cache (within TTL)
            const result2 = await optimizer.getCachedLockFile(tempDir);

            // Assert
            expect(result1).toEqual(result2); // Should be same cached value
        });

        test('refreshes cache after TTL expires', async () => {
            // Arrange
            const shortTTL = new PerformanceOptimizer({ cacheTTL: 10 }); // 10ms TTL
            const lockFile1: LockFile = {
                version: '1',
                dependencies: {},
            };
            const lockPath = path.join(tempDir, 'model.lock');
            await fs.writeFile(lockPath, JSON.stringify(lockFile1), 'utf-8');
            // First call
            await shortTTL.getCachedLockFile(tempDir);
            // Wait for TTL to expire
            await new Promise(resolve => setTimeout(resolve, 20));
            // Modify file
            const lockFile2: LockFile = {
                version: '2',
                dependencies: {},
            };
            await fs.writeFile(lockPath, JSON.stringify(lockFile2), 'utf-8');

            // Act
            const result = await shortTTL.getCachedLockFile(tempDir);

            // Assert
            expect(result?.version).toBe('2');
        });
    });

    describe('invalidateCache', () => {
        test('removes cached entry', async () => {
            // Arrange
            const lockFile: LockFile = {
                version: '1',
                dependencies: {},
            };
            const lockPath = path.join(tempDir, 'model.lock');
            await fs.writeFile(lockPath, JSON.stringify(lockFile), 'utf-8');
            // Load into cache
            await optimizer.getCachedLockFile(tempDir);

            // Act
            optimizer.invalidateCache(tempDir);

            // Assert
            const stats = optimizer.getCacheStats();
            expect(stats.lockFiles).toBe(0);
        });
    });

    describe('clearAllCaches', () => {
        test('clears all caches', async () => {
            // Arrange
            const lockFile: LockFile = {
                version: '1',
                dependencies: {},
            };
            const lockPath = path.join(tempDir, 'model.lock');
            await fs.writeFile(lockPath, JSON.stringify(lockFile), 'utf-8');
            await optimizer.getCachedLockFile(tempDir);

            // Act
            optimizer.clearAllCaches();

            // Assert
            const stats = optimizer.getCacheStats();
            expect(stats.lockFiles).toBe(0);
            expect(stats.manifests).toBe(0);
        });
    });

    describe('getCacheStats', () => {
        test('returns correct statistics', async () => {
            // Arrange
            const lockFile: LockFile = {
                version: '1',
                dependencies: {},
            };
            const lockPath = path.join(tempDir, 'model.lock');
            await fs.writeFile(lockPath, JSON.stringify(lockFile), 'utf-8');
            const initialStats = optimizer.getCacheStats();
            expect(initialStats.lockFiles).toBe(0);

            // Act
            await optimizer.getCachedLockFile(tempDir);

            // Assert
            const stats = optimizer.getCacheStats();
            expect(stats.lockFiles).toBe(1);
        });
    });

    describe('detectStaleCaches', () => {
        test('detects when cached file is stale', async () => {
            // Arrange
            const lockFile: LockFile = {
                version: '1',
                dependencies: {},
            };
            const lockPath = path.join(tempDir, 'model.lock');
            await fs.writeFile(lockPath, JSON.stringify(lockFile), 'utf-8');
            // Load into cache
            await optimizer.getCachedLockFile(tempDir);
            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 10));
            // Modify file
            await fs.writeFile(lockPath, JSON.stringify({ version: '2', dependencies: {} }), 'utf-8');

            // Act
            const stale = await optimizer.detectStaleCaches();

            // Assert
            expect(stale).toContain(path.resolve(tempDir));
        });
    });
});

describe('Global Optimizer', () => {
    afterEach(() => {
        resetGlobalOptimizer();
    });

    test('returns singleton instance', () => {
        // Arrange & Act
        const opt1 = getGlobalOptimizer();
        const opt2 = getGlobalOptimizer();

        // Assert
        expect(opt1).toBe(opt2);
    });

    test('resets singleton', () => {
        // Arrange
        const opt1 = getGlobalOptimizer();

        // Act
        resetGlobalOptimizer();
        const opt2 = getGlobalOptimizer();

        // Assert
        expect(opt1).not.toBe(opt2);
    });
});
