import { describe, it, expect, beforeEach } from 'vitest';
import { GovernanceValidator, loadGovernancePolicy } from '../../src/language/services/governance-validator.js';
import type { LockFile } from '../../src/language/services/git-url-resolver.js';
import type { GovernancePolicy } from '../../src/language/services/governance-validator.js';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';

describe('GovernanceValidator', () => {
    describe('validate', () => {
        it('passes validation with no policy', async () => {
            const policy: GovernancePolicy = {};
            const validator = new GovernanceValidator(policy);

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

            const violations = await validator.validate(lockFile, '/tmp/test');
            expect(violations).toEqual([]);
        });

        it('detects blocked source', async () => {
            const policy: GovernancePolicy = {
                allowedSources: ['github.com/acme'],
            };
            const validator = new GovernanceValidator(policy);

            const lockFile: LockFile = {
                version: '1',
                dependencies: {
                    'evil/malware': {
                        version: '1.0.0',
                        resolved: 'https://github.com/evil/malware',
                        commit: 'xxx',
                    },
                },
            };

            const violations = await validator.validate(lockFile, '/tmp/test');
            expect(violations.length).toBeGreaterThan(0);
            expect(violations[0].type).toBe('blocked-source');
            expect(violations[0].severity).toBe('error');
        });

        it('detects unstable versions', async () => {
            const policy: GovernancePolicy = {
                requireStableVersions: true,
            };
            const validator = new GovernanceValidator(policy);

            const lockFile: LockFile = {
                version: '1',
                dependencies: {
                    'acme/patterns': {
                        version: '1.0.0-beta',
                        resolved: 'https://github.com/acme/patterns',
                        commit: 'abc',
                    },
                },
            };

            const violations = await validator.validate(lockFile, '/tmp/test');
            expect(violations.length).toBeGreaterThan(0);
            expect(violations[0].type).toBe('unstable-version');
            expect(violations[0].message).toContain('beta');
        });

        it('allows stable versions', async () => {
            const policy: GovernancePolicy = {
                requireStableVersions: true,
            };
            const validator = new GovernanceValidator(policy);

            const lockFile: LockFile = {
                version: '1',
                dependencies: {
                    'acme/patterns': {
                        version: '1.0.0',
                        resolved: 'https://github.com/acme/patterns',
                        commit: 'abc',
                    },
                },
            };

            const violations = await validator.validate(lockFile, '/tmp/test');
            expect(violations).toEqual([]);
        });

        it('detects blocked packages', async () => {
            const policy: GovernancePolicy = {
                blockedPackages: ['evil/malware', 'test/blocked'],
            };
            const validator = new GovernanceValidator(policy);

            const lockFile: LockFile = {
                version: '1',
                dependencies: {
                    'evil/malware': {
                        version: '1.0.0',
                        resolved: 'https://github.com/evil/malware',
                        commit: 'xxx',
                    },
                },
            };

            const violations = await validator.validate(lockFile, '/tmp/test');
            expect(violations.length).toBeGreaterThan(0);
            expect(violations[0].type).toBe('blocked-source');
        });
    });

    describe('generateAuditReport', () => {
        it('generates report with no violations', async () => {
            const policy: GovernancePolicy = {};
            const validator = new GovernanceValidator(policy);

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

            const report = await validator.generateAuditReport(lockFile, '/tmp/test');
            expect(report).toContain('Dependency Audit Report');
            expect(report).toContain('acme/patterns');
            expect(report).toContain('No policy violations');
        });

        it('generates report with violations', async () => {
            const policy: GovernancePolicy = {
                requireStableVersions: true,
            };
            const validator = new GovernanceValidator(policy);

            const lockFile: LockFile = {
                version: '1',
                dependencies: {
                    'acme/patterns': {
                        version: '1.0.0-alpha',
                        resolved: 'https://github.com/acme/patterns',
                        commit: 'abc',
                    },
                },
            };

            const report = await validator.generateAuditReport(lockFile, '/tmp/test');
            expect(report).toContain('Violations:');
            expect(report).toContain('alpha');
        });
    });

    describe('loadGovernanceMetadata', () => {
        it('returns empty metadata when file missing', async () => {
            const validator = new GovernanceValidator({});
            const metadata = await validator.loadGovernanceMetadata('/nonexistent');
            expect(metadata).toEqual({});
        });
    });
});

describe('loadGovernancePolicy', () => {
    it('returns empty policy when file missing', async () => {
        const policy = await loadGovernancePolicy('/nonexistent');
        expect(policy).toEqual({});
    });

    it('loads governance policy from model.yaml', async () => {
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dlang-gov-test-'));
        const manifestPath = path.join(tempDir, 'model.yaml');
        
        const manifest = `
model:
  name: test
  version: 1.0.0

governance:
  requireStableVersions: true
  allowedSources:
    - github.com/acme
`;
        
        await fs.writeFile(manifestPath, manifest, 'utf-8');
        
        const policy = await loadGovernancePolicy(tempDir);
        expect(policy.requireStableVersions).toBe(true);
        expect(policy.allowedSources).toEqual(['github.com/acme']);
        
        await fs.rm(tempDir, { recursive: true, force: true });
    });
});
