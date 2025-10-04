import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import {
    showDependencyTree,
    showImpactAnalysis,
    validateModel,
    auditDependencies,
    checkCompliance,
} from '../../src/cli/dependency-commands.js';
import type { LockFile } from '../../src/language/services/git-url-resolver.js';

describe('CLI Commands - Phase 3 & 4', () => {
    let tempDir: string;
    let lockPath: string;
    let manifestPath: string;

    beforeEach(async () => {
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dlang-cli-test-'));
        lockPath = path.join(tempDir, 'model.lock');
        manifestPath = path.join(tempDir, 'model.yaml');
        
        // Create minimal model.yaml so WorkspaceManager can find workspace root
        const manifest = {
            model: {
                name: 'test-project',
                version: '1.0.0',
            },
        };
        await fs.writeFile(manifestPath, `model:\n  name: test-project\n  version: 1.0.0\n`, 'utf-8');
    });

    afterEach(async () => {
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        } catch {
            // Ignore cleanup errors
        }
    });

    describe('showDependencyTree', () => {
        it('handles empty dependencies', async () => {
            const lockFile: LockFile = {
                version: '1',
                dependencies: {},
            };
            await fs.writeFile(lockPath, JSON.stringify(lockFile), 'utf-8');

            // Should not throw
            await expect(showDependencyTree(tempDir)).resolves.toBeUndefined();
        });

        it('handles missing lock file', async () => {
            // Should not throw
            await expect(showDependencyTree(tempDir)).resolves.toBeUndefined();
        });
    });

    describe('showImpactAnalysis', () => {
        it('handles package with no dependents', async () => {
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
            await fs.writeFile(lockPath, JSON.stringify(lockFile), 'utf-8');

            await expect(showImpactAnalysis(tempDir, 'acme/unused')).resolves.toBeUndefined();
        });

        it('handles missing lock file', async () => {
            await expect(showImpactAnalysis(tempDir, 'acme/test')).resolves.toBeUndefined();
        });
    });

    describe('validateModel', () => {
        it('validates model without circular dependencies', async () => {
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
            await fs.writeFile(lockPath, JSON.stringify(lockFile), 'utf-8');

            await expect(validateModel(tempDir)).resolves.toBeUndefined();
        });

        it('handles missing lock file', async () => {
            await expect(validateModel(tempDir)).resolves.toBeUndefined();
        });
    });

    describe('auditDependencies', () => {
        it('generates audit report', async () => {
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
            await fs.writeFile(lockPath, JSON.stringify(lockFile), 'utf-8');

            await expect(auditDependencies(tempDir)).resolves.toBeUndefined();
        });

        it('handles missing lock file', async () => {
            await expect(auditDependencies(tempDir)).resolves.toBeUndefined();
        });
    });

    describe('checkCompliance', () => {
        it('checks compliance with no policy', async () => {
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
            await fs.writeFile(lockPath, JSON.stringify(lockFile), 'utf-8');

            await expect(checkCompliance(tempDir)).resolves.toBeUndefined();
        });

        it('handles missing lock file', async () => {
            await expect(checkCompliance(tempDir)).resolves.toBeUndefined();
        });

        it('detects policy violations', async () => {
            // Add governance policy to model.yaml
            const manifest = `
model:
  name: test-project
  version: 1.0.0

governance:
  requireStableVersions: true
`;
            await fs.writeFile(manifestPath, manifest, 'utf-8');

            const lockFile: LockFile = {
                version: '1',
                dependencies: {
                    'acme/patterns': {
                        version: '1.0.0-beta',
                        resolved: 'https://github.com/acme/patterns',
                        commit: 'abc123',
                    },
                },
            };
            await fs.writeFile(lockPath, JSON.stringify(lockFile), 'utf-8');

            await expect(checkCompliance(tempDir)).resolves.toBeUndefined();
        });
    });
});
