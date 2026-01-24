/**
 * Tests for ManifestDiagnosticsService.
 *
 * Verifies the LSP integration for manifest validation:
 * - Converts ManifestDiagnostic to LSP Diagnostic
 * - Handles YAML parse errors
 * - Finds correct source locations for diagnostics
 */

import { describe, test, expect } from 'vitest';
import { DiagnosticSeverity } from 'vscode-languageserver-types';
import { ManifestDiagnosticsService } from '../../src/lsp/manifest-diagnostics.js';

describe('ManifestDiagnosticsService', () => {
    const service = new ManifestDiagnosticsService();

    describe('validate', () => {
        test('returns empty array for valid manifest', () => {
            const content = `
model:
  name: test-package
  version: 1.0.0
`;
            const diagnostics = service.validate(content);
            expect(diagnostics).toHaveLength(0);
        });

        test('returns YAML parse error diagnostic', () => {
            // Use completely broken YAML that will definitely fail parsing
            const content = `
model: {
  broken yaml
  missing: [colon
`;
            const diagnostics = service.validate(content);
            expect(diagnostics.length).toBeGreaterThan(0);
            expect(diagnostics[0].message).toContain('YAML parse error');
            expect(diagnostics[0].severity).toBe(DiagnosticSeverity.Error);
        });

        test('returns warning for invalid SemVer version', () => {
            const content = `
model:
  name: test-package
  version: invalid-version
`;
            const diagnostics = service.validate(content);
            const versionDiag = diagnostics.find(d => 
                d.message.includes('SemVer') || d.message.includes('version')
            );
            expect(versionDiag).toBeDefined();
            expect(versionDiag?.severity).toBe(DiagnosticSeverity.Warning);
        });

        test('returns error for missing name in publishable mode', () => {
            const content = `
model:
  version: 1.0.0
`;
            const diagnostics = service.validate(content, { requirePublishable: true });
            const nameDiag = diagnostics.find(d => d.message.includes('name'));
            expect(nameDiag).toBeDefined();
            expect(nameDiag?.severity).toBe(DiagnosticSeverity.Error);
        });

        test('returns error for conflicting source and path', () => {
            const content = `
dependencies:
  bad-dep:
    source: owner/repo
    path: ./local
    version: v1.0.0
`;
            const diagnostics = service.validate(content);
            const conflictDiag = diagnostics.find(d => 
                d.message.includes('source') && d.message.includes('path')
            );
            expect(conflictDiag).toBeDefined();
            expect(conflictDiag?.severity).toBe(DiagnosticSeverity.Error);
        });

        test('returns error for git dependency without version', () => {
            const content = `
dependencies:
  missing-version:
    source: owner/repo
`;
            const diagnostics = service.validate(content);
            const versionDiag = diagnostics.find(d => d.message.includes('version'));
            expect(versionDiag).toBeDefined();
            expect(versionDiag?.severity).toBe(DiagnosticSeverity.Error);
        });

        test('returns warning for path alias without @ prefix', () => {
            const content = `
paths:
  lib: ./lib
`;
            const diagnostics = service.validate(content);
            const aliasDiag = diagnostics.find(d => d.message.includes('@'));
            expect(aliasDiag).toBeDefined();
            // Missing @ is a warning, not an error
            expect(aliasDiag?.severity).toBe(DiagnosticSeverity.Warning);
        });

        test('returns error for absolute path in paths', () => {
            const content = `
paths:
  '@lib': /absolute/path
`;
            const diagnostics = service.validate(content);
            const pathDiag = diagnostics.find(d => d.message.includes('relative'));
            expect(pathDiag).toBeDefined();
            expect(pathDiag?.severity).toBe(DiagnosticSeverity.Error);
        });

        test('includes hint in diagnostic message when available', () => {
            const content = `
dependencies:
  bad-dep:
    source: owner/repo
    path: ./local
    version: v1.0.0
`;
            const diagnostics = service.validate(content);
            const conflictDiag = diagnostics.find(d => 
                d.message.includes('source') && d.message.includes('path')
            );
            // Hints are appended to the message
            expect(conflictDiag?.message).toContain('Hint');
        });

        test('sets source to domainlang', () => {
            const content = `
model:
  version: bad-version
`;
            const diagnostics = service.validate(content);
            expect(diagnostics.length).toBeGreaterThan(0);
            expect(diagnostics[0].source).toBe('domainlang');
        });

        test('includes diagnostic code for code action mapping', () => {
            const content = `
dependencies:
  missing-version:
    source: owner/repo
`;
            const diagnostics = service.validate(content);
            const versionDiag = diagnostics.find(d => d.message.includes('version'));
            expect(versionDiag?.code).toBeDefined();
        });
    });

    describe('diagnostic ranges', () => {
        test('locates diagnostic at correct YAML path', () => {
            const content = `model:
  name: test
  version: bad-version
`;
            const diagnostics = service.validate(content);
            const versionDiag = diagnostics.find(d => d.message.includes('SemVer'));
            
            // Should point to line with 'version'
            expect(versionDiag?.range.start.line).toBe(2); // 0-indexed, version is on line 3
        });

        test('handles nested paths in dependencies', () => {
            const content = `dependencies:
  my-dep:
    source: owner/repo
`;
            const diagnostics = service.validate(content);
            // Should have a diagnostic for missing ref
            const refDiag = diagnostics.find(d => d.message.includes('ref'));
            expect(refDiag).toBeDefined();
        });
    });
});
