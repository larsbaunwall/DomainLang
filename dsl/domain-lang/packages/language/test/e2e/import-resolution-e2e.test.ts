/**
 * E2E Import Resolution Tests
 * 
 * Tests the complete import resolution flow for all three import types:
 * 1. External imports (from manifest) - loaded from package cache
 * 2. Local file imports (with .dlang extension) - loaded directly
 * 3. Local module imports (no extension) - requires model.yaml in directory
 */
import { beforeAll, describe, expect, test } from 'vitest';
import { ImportResolver } from '../../src/services/import-resolver.js';
import { WorkspaceManager } from '../../src/services/workspace-manager.js';
import type { DomainLangServices } from '../../src/domain-lang-module.js';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';

describe('Import Resolution E2E', () => {
    let tempDir: string;
    let resolver: ImportResolver;
    let workspaceManager: WorkspaceManager;

    beforeAll(async () => {
        // Create temp workspace
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dlang-e2e-'));
    });

    describe('Scenario 1: External import from manifest', () => {
        /**
         * import "std/core" as Core
         * 
         * - Looks up "std" in model.yaml dependencies
         * - Finds source: domainlang/core
         * - Checks model.lock for pinned commit
         * - Resolves to .dlang/packages/domainlang/core/{commit}/index.dlang
         */
        test('external import requires manifest with dependency entry', async () => {
            const projectDir = path.join(tempDir, 'external-import');
            await fs.mkdir(projectDir, { recursive: true });

            // No model.yaml - should fail
            workspaceManager = new WorkspaceManager({ autoResolve: false, allowNetwork: false });
            const services = { imports: { WorkspaceManager: workspaceManager } } as DomainLangServices;
            resolver = new ImportResolver(services);

            await expect(
                resolver.resolveFrom(projectDir, 'std/core')
            ).rejects.toThrow(/requires model\.yaml/i);
        });

        test('external import without lock file produces install error', async () => {
            const projectDir = path.join(tempDir, 'external-no-lock');
            await fs.mkdir(projectDir, { recursive: true });

            // Create model.yaml with dependency but no lock file
            const manifest = `
model:
  name: test-project
  entry: index.dlang

dependencies:
  std:
    source: domainlang/core
    ref: v1.0.0
`;
            await fs.writeFile(path.join(projectDir, 'model.yaml'), manifest);

            workspaceManager = new WorkspaceManager({ autoResolve: false, allowNetwork: false });
            const services = { imports: { WorkspaceManager: workspaceManager } } as DomainLangServices;
            resolver = new ImportResolver(services);

            await expect(
                resolver.resolveFrom(projectDir, 'std/core')
            ).rejects.toThrow(/not installed/i);
        });

        test('external import with lock file and cache resolves correctly', async () => {
            const projectDir = path.join(tempDir, 'external-with-cache');
            await fs.mkdir(projectDir, { recursive: true });

            // Create model.yaml
            const manifest = `
model:
  name: test-project
  entry: index.dlang

dependencies:
  std:
    source: domainlang/core
    ref: v1.0.0
`;
            await fs.writeFile(path.join(projectDir, 'model.yaml'), manifest);

            // Create model.lock
            const lockFile = {
                version: '1',
                dependencies: {
                    'domainlang/core': {
                        ref: 'v1.0.0',
                        refType: 'tag',
                        resolved: 'https://github.com/domainlang/core',
                        commit: 'abc123def456'
                    }
                }
            };
            await fs.writeFile(path.join(projectDir, 'model.lock'), JSON.stringify(lockFile, null, 2));

            // Create cache structure: .dlang/packages/domainlang/core/abc123def456/
            const cacheDir = path.join(projectDir, '.dlang', 'packages', 'domainlang', 'core', 'abc123def456');
            await fs.mkdir(cacheDir, { recursive: true });

            // Create package model.yaml with entry point
            await fs.writeFile(path.join(cacheDir, 'model.yaml'), `
model:
  name: core
  entry: index.dlang
`);

            // Create the entry file
            await fs.writeFile(path.join(cacheDir, 'index.dlang'), `
Namespace domainlang.core {
    Metadata Language
}
`);

            workspaceManager = new WorkspaceManager({ autoResolve: false, allowNetwork: false });
            const services = { imports: { WorkspaceManager: workspaceManager } } as DomainLangServices;
            resolver = new ImportResolver(services);

            const uri = await resolver.resolveFrom(projectDir, 'std');
            expect(uri.fsPath).toBe(path.join(cacheDir, 'index.dlang'));
        });
    });

    describe('Scenario 2: Local file import', () => {
        /**
         * import "./types.dlang"
         * 
         * - Starts with ./ so it's a local import
         * - Has .dlang extension so it's a FILE import
         * - Resolves directly to the file
         * - No manifest required
         */
        test('local file import with .dlang extension resolves directly', async () => {
            const projectDir = path.join(tempDir, 'local-file');
            await fs.mkdir(projectDir, { recursive: true });

            // Create the target file
            await fs.writeFile(path.join(projectDir, 'types.dlang'), `
Domain Types { vision: "Type definitions" }
`);

            workspaceManager = new WorkspaceManager({ autoResolve: false, allowNetwork: false });
            const services = { imports: { WorkspaceManager: workspaceManager } } as DomainLangServices;
            resolver = new ImportResolver(services);

            const uri = await resolver.resolveFrom(projectDir, './types.dlang');
            expect(uri.fsPath).toBe(path.join(projectDir, 'types.dlang'));
        });

        test('local file import without prefix is treated as external', async () => {
            const projectDir = path.join(tempDir, 'no-prefix');
            await fs.mkdir(projectDir, { recursive: true });

            // Create types.dlang but import without ./
            await fs.writeFile(path.join(projectDir, 'types.dlang'), `Domain Types {}`);

            workspaceManager = new WorkspaceManager({ autoResolve: false, allowNetwork: false });
            const services = { imports: { WorkspaceManager: workspaceManager } } as DomainLangServices;
            resolver = new ImportResolver(services);

            // "types.dlang" without ./ is treated as external dependency
            await expect(
                resolver.resolveFrom(projectDir, 'types.dlang')
            ).rejects.toThrow(/requires model\.yaml/i);
        });

        test('missing local file produces clear error', async () => {
            const projectDir = path.join(tempDir, 'missing-file');
            await fs.mkdir(projectDir, { recursive: true });

            workspaceManager = new WorkspaceManager({ autoResolve: false, allowNetwork: false });
            const services = { imports: { WorkspaceManager: workspaceManager } } as DomainLangServices;
            resolver = new ImportResolver(services);

            await expect(
                resolver.resolveFrom(projectDir, './nonexistent.dlang')
            ).rejects.toThrow(/not found/i);
        });
    });

    describe('Scenario 3: Local module import (directory-first)', () => {
        /**
         * import "./shared/types"
         * 
         * Per PRS-010 (updated design) - Directory-first resolution:
         * - Starts with ./ so it's a local import
         * - NO .dlang extension → directory-first resolution
         * - Step 1: Try ./shared/types/index.dlang (default entry, no model.yaml required)
         * - Step 2: If directory doesn't exist, try ./shared/types.dlang (file fallback)
         * - model.yaml is optional - only needed for custom entry points
         */
        test('local module import with index.dlang works without model.yaml', async () => {
            const projectDir = path.join(tempDir, 'local-module-no-manifest');
            const moduleDir = path.join(projectDir, 'shared', 'types');
            await fs.mkdir(moduleDir, { recursive: true });

            // Create index.dlang (default entry) - NO model.yaml needed
            await fs.writeFile(path.join(moduleDir, 'index.dlang'), `Domain Types {}`);

            workspaceManager = new WorkspaceManager({ autoResolve: false, allowNetwork: false });
            const services = { imports: { WorkspaceManager: workspaceManager } } as DomainLangServices;
            resolver = new ImportResolver(services);

            // Should resolve to index.dlang without requiring model.yaml
            const uri = await resolver.resolveFrom(projectDir, './shared/types');
            expect(uri.fsPath).toBe(path.join(moduleDir, 'index.dlang'));
        });

        test('local module import with model.yaml resolves to custom entry point', async () => {
            const projectDir = path.join(tempDir, 'local-module-with-manifest');
            const moduleDir = path.join(projectDir, 'shared', 'types');
            await fs.mkdir(moduleDir, { recursive: true });

            // Create module's model.yaml with custom entry
            await fs.writeFile(path.join(moduleDir, 'model.yaml'), `
model:
  name: shared-types
  entry: main.dlang
`);

            // Create the entry file
            await fs.writeFile(path.join(moduleDir, 'main.dlang'), `
Namespace shared.types {
    Domain SharedTypes { vision: "Shared type definitions" }
}
`);

            workspaceManager = new WorkspaceManager({ autoResolve: false, allowNetwork: false });
            const services = { imports: { WorkspaceManager: workspaceManager } } as DomainLangServices;
            resolver = new ImportResolver(services);

            const uri = await resolver.resolveFrom(projectDir, './shared/types');
            expect(uri.fsPath).toBe(path.join(moduleDir, 'main.dlang'));
        });

        test('local module defaults to index.dlang when no entry specified', async () => {
            const projectDir = path.join(tempDir, 'local-module-default-entry');
            const moduleDir = path.join(projectDir, 'utils');
            await fs.mkdir(moduleDir, { recursive: true });

            // Create model.yaml without entry field
            await fs.writeFile(path.join(moduleDir, 'model.yaml'), `
model:
  name: utils
`);

            // Create default entry file
            await fs.writeFile(path.join(moduleDir, 'index.dlang'), `
Namespace utils {
    Domain Utilities { vision: "Utility definitions" }
}
`);

            workspaceManager = new WorkspaceManager({ autoResolve: false, allowNetwork: false });
            const services = { imports: { WorkspaceManager: workspaceManager } } as DomainLangServices;
            resolver = new ImportResolver(services);

            const uri = await resolver.resolveFrom(projectDir, './utils');
            expect(uri.fsPath).toBe(path.join(moduleDir, 'index.dlang'));
        });
    });
});
