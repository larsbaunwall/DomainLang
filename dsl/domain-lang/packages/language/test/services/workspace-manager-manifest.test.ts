/**
 * WorkspaceManager Manifest Tests
 *
 * Per PRS-010 Phase 2, these tests validate:
 * - Manifest file discovery by walking up directory tree
 * - YAML parsing and validation
 * - Dependency lookup by alias
 * - Path field for local dependencies with sandboxing
 * - Mutual exclusivity of source and path fields
 * - NEW: Support for both short form (owner/package: version) and extended form
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { WorkspaceManager } from '../../src/services/workspace-manager.js';
import type { DependencySpec, ExtendedDependencySpec } from '../../src/services/types.js';

/**
 * Helper to normalize a dependency to extended form for testing.
 */
function normalizeDep(key: string, dep: DependencySpec | undefined): ExtendedDependencySpec | undefined {
    if (dep === undefined) return undefined;
    if (typeof dep === 'string') {
        return { source: key, ref: dep };
    }
    return dep.source ? dep : { ...dep, source: key };
}

let tempDir: string;

beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dlang-workspace-manager-'));
});

afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
});

describe('WorkspaceManager manifest handling (PRS-010 Phase 2)', () => {
    // ========================================================================
    // Acceptance Criterion: Discovers model.yaml by walking up directory tree
    // ========================================================================

    test('finds nearest manifest when initializing from nested folder', async () => {
        // Arrange
        const rootDir = path.join(tempDir, 'project');
        const nestedDir = path.join(rootDir, 'nested', 'deep');
        await fs.mkdir(nestedDir, { recursive: true });
        const manifestPath = path.join(rootDir, 'model.yaml');
        await fs.writeFile(manifestPath, 'model:\n  name: sample\n');
        const manager = new WorkspaceManager({ autoResolve: false, allowNetwork: false });

        // Act
        await manager.initialize(nestedDir);
        const resolvedManifestPath = await manager.getManifestPath();

        // Assert
        expect(resolvedManifestPath).toBe(manifestPath);
    });

    test('stops at first manifest when multiple exist in hierarchy', async () => {
        // Arrange
        const root = path.join(tempDir, 'workspace');
        const sub1 = path.join(root, 'sub1');
        const sub2 = path.join(sub1, 'sub2');
        await fs.mkdir(sub2, { recursive: true });

        const rootManifest = path.join(root, 'model.yaml');
        const sub1Manifest = path.join(sub1, 'model.yaml');

        await fs.writeFile(rootManifest, 'model:\n  name: root\n');
        await fs.writeFile(sub1Manifest, 'model:\n  name: sub1\n');

        const manager = new WorkspaceManager({ autoResolve: false, allowNetwork: false });

        // Act
        await manager.initialize(sub2);
        const foundManifest = await manager.getManifestPath();

        // Assert - should find sub1, not root
        expect(foundManifest).toBe(sub1Manifest);
    });

    // ========================================================================
    // Acceptance Criterion: Parses valid YAML into typed structure
    // ========================================================================

    test('parses manifest with model metadata', async () => {
        // Arrange
        const manifestDir = path.join(tempDir, 'project');
        await fs.mkdir(manifestDir, { recursive: true });
        const manifestContent = `model:
  name: sample
  version: 1.0.0
  entry: index.dlang
`;
        await fs.writeFile(path.join(manifestDir, 'model.yaml'), manifestContent);
        const manager = new WorkspaceManager({ autoResolve: false, allowNetwork: false });

        // Act
        await manager.initialize(manifestDir);
        const manifest = await manager.getManifest();

        // Assert
        expect(manifest?.model?.name).toBe('sample');
        expect(manifest?.model?.version).toBe('1.0.0');
        expect(manifest?.model?.entry).toBe('index.dlang');
    });

    test('parses manifest dependencies including local paths', async () => {
        // Arrange
        const manifestDir = path.join(tempDir, 'project');
        await fs.mkdir(manifestDir, { recursive: true });
        const manifestContent = `model:
  name: sample
  version: 1.0.0
dependencies:
  core:
    source: domainlang/core
    ref: v1.0.0
  shared:
    path: ./shared
`;
        await fs.writeFile(path.join(manifestDir, 'model.yaml'), manifestContent);
        const manager = new WorkspaceManager({ autoResolve: false, allowNetwork: false });

        // Act
        await manager.initialize(manifestDir);
        const manifest = await manager.getManifest();

        // Assert - use normalizeDep for union type handling
        const coreDep = normalizeDep('core', manifest?.dependencies?.core);
        const sharedDep = normalizeDep('shared', manifest?.dependencies?.shared);
        expect(coreDep?.source).toBe('domainlang/core');
        expect(coreDep?.ref).toBe('v1.0.0');
        expect(sharedDep?.path).toBe('./shared');
    });

    test('parses short-form dependencies (owner/package: version) per PRS-010', async () => {
        // Arrange - NEW: Short form where key is owner/package and value is version
        const manifestDir = path.join(tempDir, 'project');
        await fs.mkdir(manifestDir, { recursive: true });
        const manifestContent = `model:
  name: sample
  version: 1.0.0
dependencies:
  domainlang/core: v1.0.0
  ddd-community/patterns: v2.3.1
`;
        await fs.writeFile(path.join(manifestDir, 'model.yaml'), manifestContent);
        const manager = new WorkspaceManager({ autoResolve: false, allowNetwork: false });

        // Act
        await manager.initialize(manifestDir);
        const manifest = await manager.getManifest();

        // Assert - Short form normalizes: key becomes source, value becomes ref
        const coreDep = normalizeDep('domainlang/core', manifest?.dependencies?.['domainlang/core']);
        const patternsDep = normalizeDep('ddd-community/patterns', manifest?.dependencies?.['ddd-community/patterns']);
        expect(coreDep?.source).toBe('domainlang/core');
        expect(coreDep?.ref).toBe('v1.0.0');
        expect(patternsDep?.source).toBe('ddd-community/patterns');
        expect(patternsDep?.ref).toBe('v2.3.1');
    });

    // ========================================================================
    // Acceptance Criterion: Returns dependency config by alias key
    // ========================================================================

    test('retrieves dependency by alias from manifest', async () => {
        // Arrange
        const manifestDir = path.join(tempDir, 'project');
        await fs.mkdir(manifestDir, { recursive: true });
        const manifestContent = `dependencies:
  patterns:
    source: domainlang/patterns
    ref: v2.1.0
    description: "DDD pattern library"
`;
        await fs.writeFile(path.join(manifestDir, 'model.yaml'), manifestContent);
        const manager = new WorkspaceManager({ autoResolve: false, allowNetwork: false });

        // Act
        await manager.initialize(manifestDir);
        const manifest = await manager.getManifest();
        const patternsDep = normalizeDep('patterns', manifest?.dependencies?.patterns);

        // Assert
        expect(patternsDep?.source).toBe('domainlang/patterns');
        expect(patternsDep?.ref).toBe('v2.1.0');
        expect(patternsDep?.description).toBe('DDD pattern library');
    });

    test('handles missing manifest gracefully', async () => {
        // Arrange
        const emptyDir = path.join(tempDir, 'no-manifest');
        await fs.mkdir(emptyDir, { recursive: true });
        const manager = new WorkspaceManager({ autoResolve: false, allowNetwork: false });

        // Act
        await manager.initialize(emptyDir);
        const manifestPath = await manager.getManifestPath();
        const manifest = await manager.getManifest();

        // Assert
        expect(manifestPath).toBeUndefined();
        expect(manifest).toBeUndefined();
    });

    // ========================================================================
    // Acceptance Criterion: Validates path and source are mutually exclusive
    // ========================================================================

    test('rejects manifest that mixes source and path in one dependency', async () => {
        // Arrange
        const manifestDir = path.join(tempDir, 'project');
        await fs.mkdir(manifestDir, { recursive: true });
        const manifestContent = `dependencies:
  invalid:
    source: domainlang/core
    path: ../shared
    ref: v1.0.0
`;
        await fs.writeFile(path.join(manifestDir, 'model.yaml'), manifestContent);
        const manager = new WorkspaceManager({ autoResolve: false, allowNetwork: false });

        // Act
        await manager.initialize(manifestDir);

        // Assert
        await expect(manager.getManifest()).rejects.toThrow(/Cannot specify both 'source' and 'path'/i);
    });

    // ========================================================================
    // Acceptance Criterion: Path sandboxing for local dependencies
    // ========================================================================

    test('rejects local path dependency that escapes workspace', async () => {
        // Arrange
        const manifestDir = path.join(tempDir, 'project');
        await fs.mkdir(manifestDir, { recursive: true });
        const manifestContent = `dependencies:
  secrets:
    path: ../../secrets
`;
        await fs.writeFile(path.join(manifestDir, 'model.yaml'), manifestContent);
        const manager = new WorkspaceManager({ autoResolve: false, allowNetwork: false });

        // Act
        await manager.initialize(manifestDir);

        // Assert
        await expect(manager.getManifest()).rejects.toThrow(/outside workspace boundary/i);
    });

    test('allows local path dependency within workspace boundary', async () => {
        // Arrange
        const manifestDir = path.join(tempDir, 'project');
        const sharedDir = path.join(manifestDir, 'shared');
        await fs.mkdir(sharedDir, { recursive: true });

        const manifestContent = `dependencies:
  shared:
    path: ./shared
`;
        await fs.writeFile(path.join(manifestDir, 'model.yaml'), manifestContent);
        const manager = new WorkspaceManager({ autoResolve: false, allowNetwork: false });

        // Act
        await manager.initialize(manifestDir);
        const manifest = await manager.getManifest();

        // Assert - should not throw, dependency should be accessible
        const sharedDep = normalizeDep('shared', manifest?.dependencies?.shared);
        expect(sharedDep?.path).toBe('./shared');
    });

    test('allows nested relative paths within workspace', async () => {
        // Arrange
        const manifestDir = path.join(tempDir, 'project');
        const sharedDir = path.join(manifestDir, 'lib', 'shared');
        await fs.mkdir(sharedDir, { recursive: true });

        const manifestContent = `dependencies:
  shared:
    path: ./lib/shared
`;
        await fs.writeFile(path.join(manifestDir, 'model.yaml'), manifestContent);
        const manager = new WorkspaceManager({ autoResolve: false, allowNetwork: false });

        // Act
        await manager.initialize(manifestDir);
        const manifest = await manager.getManifest();

        // Assert
        const sharedDepNested = normalizeDep('shared', manifest?.dependencies?.shared);
        expect(sharedDepNested?.path).toBe('./lib/shared');
    });

    // ========================================================================
    // Acceptance Criterion: Path aliases must start with @ (PRS-010)
    // ========================================================================

    test('rejects path alias that does not start with @', async () => {
        // Arrange - Per PRS-010, path aliases must start with @
        const manifestDir = path.join(tempDir, 'project');
        await fs.mkdir(manifestDir, { recursive: true });
        const manifestContent = `model:
  name: sample
paths:
  shared: ./shared
`;
        await fs.writeFile(path.join(manifestDir, 'model.yaml'), manifestContent);
        const manager = new WorkspaceManager({ autoResolve: false, allowNetwork: false });

        // Act
        await manager.initialize(manifestDir);

        // Assert - should reject because alias doesn't start with @
        await expect(manager.getManifest()).rejects.toThrow(/must start with '@'/i);
    });

    test('rejects path alias that escapes workspace boundary', async () => {
        // Arrange - Path aliases must not escape workspace (Scenario 10 in PRS-010)
        const manifestDir = path.join(tempDir, 'project');
        await fs.mkdir(manifestDir, { recursive: true });
        const manifestContent = `model:
  name: sample
paths:
  "@secrets": ../../../etc/secrets
`;
        await fs.writeFile(path.join(manifestDir, 'model.yaml'), manifestContent);
        const manager = new WorkspaceManager({ autoResolve: false, allowNetwork: false });

        // Act
        await manager.initialize(manifestDir);

        // Assert - should reject because path escapes workspace
        await expect(manager.getManifest()).rejects.toThrow(/outside workspace boundary/i);
    });

    test('allows valid path alias within workspace', async () => {
        // Arrange
        const manifestDir = path.join(tempDir, 'project');
        const sharedDir = path.join(manifestDir, 'packages', 'shared');
        await fs.mkdir(sharedDir, { recursive: true });

        const manifestContent = `model:
  name: sample
paths:
  "@shared": ./packages/shared
`;
        await fs.writeFile(path.join(manifestDir, 'model.yaml'), manifestContent);
        const manager = new WorkspaceManager({ autoResolve: false, allowNetwork: false });

        // Act
        await manager.initialize(manifestDir);
        const aliases = await manager.getPathAliases();

        // Assert
        expect(aliases?.['@shared']).toBe('./packages/shared');
    });
});
