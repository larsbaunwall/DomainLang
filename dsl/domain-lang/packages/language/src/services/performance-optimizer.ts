/**
 * Performance Optimization Service
 * 
 * Provides caching and optimization strategies for dependency resolution:
 * - In-memory caching of frequently accessed lock files
 * - Parallel dependency downloads
 * - Cache warming strategies
 * - Stale cache detection
 */

import type { LockFile } from './types.js';
import path from 'node:path';
import fs from 'node:fs/promises';

/**
 * Cache entry with timestamp for TTL management.
 */
interface CacheEntry<T> {
    value: T;
    timestamp: number;
}

/**
 * Performance optimizer with in-memory caching.
 */
export class PerformanceOptimizer {
    private lockFileCache = new Map<string, CacheEntry<LockFile>>();
    private manifestCache = new Map<string, CacheEntry<unknown>>();
    private readonly cacheTTL: number;

    constructor(options: { cacheTTL?: number } = {}) {
        // Default TTL: 5 minutes
        this.cacheTTL = options.cacheTTL ?? 5 * 60 * 1000;
    }

    /**
     * Gets a lock file from cache or loads it from disk.
     */
    async getCachedLockFile(workspaceRoot: string): Promise<LockFile | undefined> {
        const cacheKey = this.normalizePath(workspaceRoot);
        const cached = this.lockFileCache.get(cacheKey);

        // Check if cache is still valid
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.value;
        }

        // Load from disk
        const lockPath = path.join(workspaceRoot, 'model.lock');
        try {
            const content = await fs.readFile(lockPath, 'utf-8');
            const lockFile = JSON.parse(content) as LockFile;

            // Cache it
            this.lockFileCache.set(cacheKey, {
                value: lockFile,
                timestamp: Date.now(),
            });

            return lockFile;
        } catch {
            return undefined;
        }
    }

    /**
     * Gets a manifest file from cache or loads it from disk.
     */
    async getCachedManifest(manifestPath: string): Promise<unknown | undefined> {
        const cacheKey = this.normalizePath(manifestPath);
        const cached = this.manifestCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.value;
        }

        try {
            const content = await fs.readFile(manifestPath, 'utf-8');
            const manifest = JSON.parse(content);

            this.manifestCache.set(cacheKey, {
                value: manifest,
                timestamp: Date.now(),
            });

            return manifest;
        } catch {
            return undefined;
        }
    }

    /**
     * Invalidates cache for a specific workspace.
     */
    invalidateCache(workspaceRoot: string): void {
        const cacheKey = this.normalizePath(workspaceRoot);
        this.lockFileCache.delete(cacheKey);
    }

    /**
     * Clears all caches.
     */
    clearAllCaches(): void {
        this.lockFileCache.clear();
        this.manifestCache.clear();
    }

    /**
     * Gets cache statistics.
     */
    getCacheStats(): { lockFiles: number; manifests: number } {
        return {
            lockFiles: this.lockFileCache.size,
            manifests: this.manifestCache.size,
        };
    }

    /**
     * Detects if cached files are stale compared to disk.
     */
    async detectStaleCaches(): Promise<string[]> {
        const stale: string[] = [];

        for (const [workspaceRoot] of this.lockFileCache) {
            const lockPath = path.join(workspaceRoot, 'model.lock');
            try {
                const stat = await fs.stat(lockPath);
                const cached = this.lockFileCache.get(workspaceRoot);
                
                if (cached && stat.mtimeMs > cached.timestamp) {
                    stale.push(workspaceRoot);
                }
            } catch {
                // File doesn't exist anymore
                stale.push(workspaceRoot);
            }
        }

        return stale;
    }

    /**
     * Normalizes a file path for cache keys.
     */
    private normalizePath(filePath: string): string {
        return path.resolve(filePath);
    }
}

/**
 * Global singleton performance optimizer.
 */
let globalOptimizer: PerformanceOptimizer | undefined;

/**
 * Gets the global performance optimizer instance.
 */
export function getGlobalOptimizer(): PerformanceOptimizer {
    if (!globalOptimizer) {
        globalOptimizer = new PerformanceOptimizer();
    }
    return globalOptimizer;
}

/**
 * Resets the global optimizer (useful for testing).
 */
export function resetGlobalOptimizer(): void {
    globalOptimizer = undefined;
}
