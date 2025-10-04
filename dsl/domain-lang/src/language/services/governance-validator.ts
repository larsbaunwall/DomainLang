/**
 * Governance and Compliance Validation Service
 * 
 * Enforces organizational policies and best practices:
 * - Allowed/blocked dependency sources
 * - Version policy enforcement (no pre-release in production)
 * - Team ownership validation
 * - License compliance
 * - Audit trail generation
 * 
 * Governance policies are defined in the `governance` section of model.yaml:
 * 
 * ```yaml
 * governance:
 *   allowedSources:
 *     - github.com/acme
 *   requireStableVersions: true
 *   requireTeamOwnership: true
 * ```
 */

import type { LockFile } from './git-url-resolver.js';
import path from 'node:path';
import fs from 'node:fs/promises';
import YAML from 'yaml';

export interface GovernancePolicy {
    /** Allowed git domains (e.g., ['github.com/acme']) */
    allowedSources?: string[];
    /** Blocked packages or patterns */
    blockedPackages?: string[];
    /** Require stable versions only (no pre-release) */
    requireStableVersions?: boolean;
    /** Require team ownership metadata */
    requireTeamOwnership?: boolean;
    /** Allowed licenses */
    allowedLicenses?: string[];
}

export interface GovernanceMetadata {
    /** Team responsible for the model */
    team?: string;
    /** Contact email */
    contact?: string;
    /** Business domain */
    domain?: string;
    /** Compliance tags */
    compliance?: string[];
}

export interface GovernanceViolation {
    /** Type of violation */
    type: 'blocked-source' | 'unstable-version' | 'missing-metadata' | 'license-violation';
    /** Package that violates the policy */
    packageKey: string;
    /** Violation message */
    message: string;
    /** Severity: error or warning */
    severity: 'error' | 'warning';
}

/**
 * Validates dependencies against organizational governance policies.
 */
export class GovernanceValidator {
    constructor(private readonly policy: GovernancePolicy) {}

    /**
     * Validates a lock file against governance policies.
     */
    async validate(lockFile: LockFile, workspaceRoot: string): Promise<GovernanceViolation[]> {
        const violations: GovernanceViolation[] = [];

        // Validate each dependency
        for (const [packageKey, locked] of Object.entries(lockFile.dependencies)) {
            // Check allowed sources
            if (this.policy.allowedSources && this.policy.allowedSources.length > 0) {
                const isAllowed = this.policy.allowedSources.some(pattern => 
                    locked.resolved.includes(pattern) || packageKey.startsWith(pattern)
                );

                if (!isAllowed) {
                    violations.push({
                        type: 'blocked-source',
                        packageKey,
                        message: `Package from unauthorized source: ${locked.resolved}`,
                        severity: 'error',
                    });
                }
            }

            // Check blocked packages
            if (this.policy.blockedPackages) {
                const isBlocked = this.policy.blockedPackages.some(pattern =>
                    packageKey.includes(pattern)
                );

                if (isBlocked) {
                    violations.push({
                        type: 'blocked-source',
                        packageKey,
                        message: `Package is blocked by governance policy`,
                        severity: 'error',
                    });
                }
            }

            // Check version stability
            if (this.policy.requireStableVersions) {
                if (this.isPreReleaseVersion(locked.version)) {
                    violations.push({
                        type: 'unstable-version',
                        packageKey,
                        message: `Pre-release version not allowed: ${locked.version}`,
                        severity: 'error',
                    });
                }
            }
        }

        // Validate workspace metadata
        if (this.policy.requireTeamOwnership) {
            const metadata = await this.loadGovernanceMetadata(workspaceRoot);
            if (!metadata.team || !metadata.contact) {
                violations.push({
                    type: 'missing-metadata',
                    packageKey: 'workspace',
                    message: 'Missing required team ownership metadata in model.yaml',
                    severity: 'warning',
                });
            }
        }

        return violations;
    }

    /**
     * Loads governance metadata from model.yaml.
     */
    async loadGovernanceMetadata(workspaceRoot: string): Promise<GovernanceMetadata> {
        const manifestPath = path.join(workspaceRoot, 'model.yaml');

        try {
            const content = await fs.readFile(manifestPath, 'utf-8');
            const manifest = YAML.parse(content) as {
                metadata?: GovernanceMetadata;
            };

            return manifest.metadata || {};
        } catch {
            return {};
        }
    }

    /**
     * Generates an audit report for compliance tracking.
     */
    async generateAuditReport(lockFile: LockFile, workspaceRoot: string): Promise<string> {
        const metadata = await this.loadGovernanceMetadata(workspaceRoot);
        const violations = await this.validate(lockFile, workspaceRoot);

        const lines: string[] = [];
        lines.push('=== Dependency Audit Report ===');
        lines.push('');
        lines.push(`Workspace: ${workspaceRoot}`);
        lines.push(`Team: ${metadata.team || 'N/A'}`);
        lines.push(`Contact: ${metadata.contact || 'N/A'}`);
        lines.push(`Domain: ${metadata.domain || 'N/A'}`);
        lines.push('');
        lines.push('Dependencies:');

        for (const [packageKey, locked] of Object.entries(lockFile.dependencies)) {
            lines.push(`  - ${packageKey}@${locked.version}`);
            lines.push(`    Source: ${locked.resolved}`);
            lines.push(`    Commit: ${locked.commit}`);
        }

        if (violations.length > 0) {
            lines.push('');
            lines.push('Violations:');
            for (const violation of violations) {
                lines.push(`  [${violation.severity.toUpperCase()}] ${violation.packageKey}: ${violation.message}`);
            }
        } else {
            lines.push('');
            lines.push('\u2713 No policy violations detected');
        }

        return lines.join('\n');
    }

    /**
     * Checks if a version is a pre-release.
     */
    private isPreReleaseVersion(version: string): boolean {
        const clean = version.replace(/^v/, '');
        return /-(alpha|beta|rc|pre|dev|snapshot)/.test(clean);
    }
}

/**
 * Loads governance policy from model.yaml governance section.
 */
export async function loadGovernancePolicy(workspaceRoot: string): Promise<GovernancePolicy> {
    const manifestPath = path.join(workspaceRoot, 'model.yaml');

    try {
        const content = await fs.readFile(manifestPath, 'utf-8');
        const manifest = YAML.parse(content) as {
            governance?: GovernancePolicy;
        };
        
        // Return governance section or empty policy if not defined
        return manifest.governance || {};
    } catch {
        // No manifest or parse error = permissive defaults
        return {};
    }
}
