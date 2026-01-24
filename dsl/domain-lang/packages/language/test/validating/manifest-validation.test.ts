/**
 * Tests for ManifestValidator.
 *
 * Verifies manifest validation and diagnostics:
 * - Model section validation (name, version)
 * - Dependency validation (source, path, version)
 * - Path alias validation
 */

import { describe, test, expect } from 'vitest';
import { 
    ManifestValidator, 
    ManifestIssueCodes,
    isManifestValid,
    validateManifest 
} from '../../src/validation/manifest.js';
import type { ModelManifest } from '../../src/services/types.js';
import { IssueCodes } from '../../src/validation/constants.js';

describe('ManifestValidator', () => {
    const validator = new ManifestValidator();

    describe('valid manifests', () => {
        test('accepts minimal valid manifest', () => {
            const manifest: ModelManifest = {};
            const result = validator.validate(manifest);
            expect(result.valid).toBe(true);
            expect(result.errorCount).toBe(0);
        });

        test('accepts complete valid manifest', () => {
            const manifest: ModelManifest = {
                model: {
                    name: 'my-package',
                    version: '1.0.0',
                    entry: 'index.dlang'
                },
                paths: {
                    '@': '.',
                    '@lib': './lib'
                },
                dependencies: {
                    'domainlang/core': {
                        source: 'domainlang/core',
                        ref: 'v1.0.0'
                    },
                    'local/dep': {
                        path: './packages/local'
                    }
                }
            };
            const result = validator.validate(manifest);
            expect(result.valid).toBe(true);
            expect(result.errorCount).toBe(0);
        });

        test('accepts short-form dependencies', () => {
            const manifest: ModelManifest = {
                dependencies: {
                    'domainlang/core': 'v1.0.0'
                }
            };
            const result = validator.validate(manifest);
            expect(result.valid).toBe(true);
        });
    });

    describe('model section validation', () => {
        test('requires name for publishable packages', () => {
            const manifest: ModelManifest = {
                model: {
                    version: '1.0.0'
                }
            };
            const result = validator.validate(manifest, { requirePublishable: true });
            expect(result.valid).toBe(false);
            const diagnostic = result.diagnostics.find(d => d.code === ManifestIssueCodes.ModelMissingName);
            expect(diagnostic).toBeDefined();
            expect(diagnostic?.path).toBe('model.name');
        });

        test('requires version for publishable packages', () => {
            const manifest: ModelManifest = {
                model: {
                    name: 'my-package'
                }
            };
            const result = validator.validate(manifest, { requirePublishable: true });
            expect(result.valid).toBe(false);
            const diagnostic = result.diagnostics.find(d => d.code === ManifestIssueCodes.ModelMissingVersion);
            expect(diagnostic).toBeDefined();
            expect(diagnostic?.path).toBe('model.version');
        });

        test('warns on invalid SemVer version', () => {
            const manifest: ModelManifest = {
                model: {
                    name: 'my-package',
                    version: 'invalid-version'
                }
            };
            const result = validator.validate(manifest);
            const diagnostic = result.diagnostics.find(d => d.code === ManifestIssueCodes.ModelInvalidVersion);
            expect(diagnostic).toBeDefined();
            expect(diagnostic?.severity).toBe('warning');
        });

        test('accepts valid SemVer versions', () => {
            const validVersions = ['1.0.0', '2.3.4-beta', '0.0.1+build'];
            for (const version of validVersions) {
                const manifest: ModelManifest = {
                    model: { name: 'test', version }
                };
                const result = validator.validate(manifest);
                const versionErrors = result.diagnostics.filter(d => 
                    d.code === ManifestIssueCodes.ModelInvalidVersion
                );
                expect(versionErrors.length).toBe(0);
            }
        });
    });

    describe('dependency validation', () => {
        test('rejects conflicting source and path', () => {
            const manifest: ModelManifest = {
                dependencies: {
                    'bad-dep': {
                        source: 'owner/repo',
                        path: './local',
                        ref: 'v1.0.0'
                    }
                }
            };
            const result = validator.validate(manifest);
            expect(result.valid).toBe(false);
            const diagnostic = result.diagnostics.find(d => 
                d.code === IssueCodes.ImportConflictingSourcePath
            );
            expect(diagnostic).toBeDefined();
        });

        test('dependency without explicit source uses key as source', () => {
            // Our normalization adds source from key, so a dependency with just ref
            // gets the key as the source during normalization - validation passes
            const manifest: ModelManifest = {
                dependencies: {
                    'owner/repo': {
                        ref: 'v1.0.0'
                    }
                }
            };
            const result = validator.validate(manifest);
            // Validation passes because 'owner/repo' key becomes the source
            expect(result.valid).toBe(true);
            expect(result.errorCount).toBe(0);
        });

        test('requires ref for git dependencies', () => {
            const manifest: ModelManifest = {
                dependencies: {
                    'missing-ref': {
                        source: 'owner/repo'
                    }
                }
            };
            const result = validator.validate(manifest);
            expect(result.valid).toBe(false);
            const diagnostic = result.diagnostics.find(d => 
                d.code === IssueCodes.ImportMissingRef
            );
            expect(diagnostic).toBeDefined();
        });

        test('accepts valid ref specs', () => {
            const validRefs = ['v1.0.0', 'main', 'abc1234567', '1.2.3'];
            for (const ref of validRefs) {
                const manifest: ModelManifest = {
                    dependencies: {
                        'owner/repo': { ref }
                    }
                };
                const result = validator.validate(manifest);
                // Should not have missing ref error
                const missingRef = result.diagnostics.filter(d => 
                    d.code === IssueCodes.ImportMissingRef
                );
                expect(missingRef.length).toBe(0);
            }
        });

        test('rejects absolute paths in path dependencies', () => {
            const manifest: ModelManifest = {
                dependencies: {
                    'absolute': {
                        path: '/absolute/path'
                    }
                }
            };
            const result = validator.validate(manifest);
            expect(result.valid).toBe(false);
            const diagnostic = result.diagnostics.find(d => 
                d.code === IssueCodes.ImportAbsolutePath
            );
            expect(diagnostic).toBeDefined();
        });

        test('rejects invalid source format', () => {
            const manifest: ModelManifest = {
                dependencies: {
                    'bad-source': {
                        source: 'not-valid-format',
                        ref: 'v1.0.0'
                    }
                }
            };
            const result = validator.validate(manifest);
            const diagnostic = result.diagnostics.find(d => 
                d.code === ManifestIssueCodes.DependencyInvalidSource
            );
            expect(diagnostic).toBeDefined();
        });
    });

    describe('path alias validation', () => {
        test('warns on path alias without @ prefix', () => {
            const manifest: ModelManifest = {
                paths: {
                    'lib': './lib'
                }
            };
            const result = validator.validate(manifest);
            const diagnostic = result.diagnostics.find(d => 
                d.code === ManifestIssueCodes.PathAliasMissingAtPrefix
            );
            expect(diagnostic).toBeDefined();
            expect(diagnostic?.severity).toBe('warning');
        });

        test('rejects absolute path in alias target', () => {
            const manifest: ModelManifest = {
                paths: {
                    '@lib': '/absolute/path'
                }
            };
            const result = validator.validate(manifest);
            expect(result.valid).toBe(false);
            const diagnostic = result.diagnostics.find(d => 
                d.code === ManifestIssueCodes.PathAliasAbsolutePath
            );
            expect(diagnostic).toBeDefined();
        });
    });

    describe('convenience functions', () => {
        test('isManifestValid returns boolean', () => {
            expect(isManifestValid({})).toBe(true);
            expect(isManifestValid({
                dependencies: {
                    bad: { source: 'a', path: 'b' }
                }
            })).toBe(false);
        });

        test('validateManifest returns diagnostics array', () => {
            const diagnostics = validateManifest({
                dependencies: {
                    'owner/repo': { source: 'owner/repo' }
                }
            });
            expect(Array.isArray(diagnostics)).toBe(true);
            expect(diagnostics.length).toBeGreaterThan(0);
        });
    });
});
