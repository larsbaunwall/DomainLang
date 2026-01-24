/**
 * Tests for DomainLangCodeActionProvider.
 *
 * Verifies code action provider integration and behavior:
 * - Provider is properly wired up through LSP services
 * - Code actions are generated for import validation errors
 * - Each issue code maps to the correct code action
 */

import { describe, test, expect, beforeAll } from 'vitest';
import { setupTestSuite, type TestServices } from '../test-helpers.js';
import { IssueCodes } from '../../src/validation/constants.js';
import type { CodeActionParams } from 'vscode-languageserver-protocol';
import type { CodeAction, Diagnostic } from 'vscode-languageserver-types';
import { DiagnosticSeverity } from 'vscode-languageserver-types';

describe('DomainLangCodeActionProvider', () => {
    let testServices: TestServices;

    beforeAll(() => {
        testServices = setupTestSuite();
    });

    /**
     * Helper to get code actions for a given diagnostic.
     */
    const getCodeActions = async (
        diagnostic: Diagnostic
    ): Promise<Array<CodeAction>> => {
        const codeActionProvider = testServices.services.DomainLang.lsp.CodeActionProvider;
        expect(codeActionProvider).toBeDefined();

        // Create a minimal document for testing
        const document = await testServices.parse(`Domain Test {}`);
        
        const params: CodeActionParams = {
            textDocument: { uri: document.textDocument.uri },
            range: diagnostic.range,
            context: {
                diagnostics: [diagnostic],
                triggerKind: 1 // Explicitly triggered
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Provider existence asserted above
        const result = await codeActionProvider!.getCodeActions(document, params);
        return (result ?? []).filter((item): item is CodeAction => 'title' in item);
    };

    /**
     * Creates a mock diagnostic with the given code and alias.
     */
    const createDiagnostic = (
        code: string, 
        alias?: string,
        specifier?: string
    ): Diagnostic => ({
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } },
        message: 'Test diagnostic',
        severity: DiagnosticSeverity.Error,
        source: 'domain-lang',
        data: { code, alias, specifier }
    });

    test('code action provider is wired up', () => {
        expect(testServices.services.DomainLang.lsp.CodeActionProvider).toBeDefined();
    });

    describe('ImportNotInManifest code actions', () => {
        test('provides "Add to model.yaml" action for unknown import', async () => {
            // Arrange
            const diagnostic = createDiagnostic(IssueCodes.ImportNotInManifest, 'mypackage');

            // Act
            const actions = await getCodeActions(diagnostic);

            // Assert
            expect(actions.length).toBeGreaterThan(0);
            const addAction = actions.find(a => a.title.includes('Add'));
            expect(addAction).toBeDefined();
            expect(addAction?.title).toContain('mypackage');
            expect(addAction?.title).toContain('model.yaml');
            expect(addAction?.command?.command).toBe('domainlang.addDependency');
            expect(addAction?.command?.arguments).toContain('mypackage');
        });

        test('action is marked as preferred', async () => {
            // Arrange
            const diagnostic = createDiagnostic(IssueCodes.ImportNotInManifest, 'core');

            // Act
            const actions = await getCodeActions(diagnostic);

            // Assert
            const addAction = actions.find(a => a.title.includes('Add'));
            expect(addAction?.isPreferred).toBe(true);
        });
    });

    describe('ImportRequiresManifest code actions', () => {
        test('provides "Create model.yaml" action when manifest missing', async () => {
            // Arrange
            const diagnostic = createDiagnostic(
                IssueCodes.ImportRequiresManifest, 
                undefined,
                'owner/package'
            );

            // Act
            const actions = await getCodeActions(diagnostic);

            // Assert
            expect(actions.length).toBeGreaterThan(0);
            const createAction = actions.find(a => a.title.includes('Create'));
            expect(createAction).toBeDefined();
            expect(createAction?.command?.command).toBe('domainlang.createManifest');
        });
    });

    describe('ImportNotInstalled code actions', () => {
        test('provides "Run dlang install" action for uninstalled package', async () => {
            // Arrange
            const diagnostic = createDiagnostic(IssueCodes.ImportNotInstalled, 'uninstalled');

            // Act
            const actions = await getCodeActions(diagnostic);

            // Assert
            expect(actions.length).toBeGreaterThan(0);
            const installAction = actions.find(a => a.title.includes('install'));
            expect(installAction).toBeDefined();
            expect(installAction?.command?.command).toBe('domainlang.install');
        });
    });

    describe('ImportMissingRef code actions', () => {
        test('provides "Add ref" action for ref-less dependency', async () => {
            // Arrange
            const diagnostic = createDiagnostic(IssueCodes.ImportMissingRef, 'noref');

            // Act
            const actions = await getCodeActions(diagnostic);

            // Assert
            expect(actions.length).toBeGreaterThan(0);
            const refAction = actions.find(a => a.title.includes('ref'));
            expect(refAction).toBeDefined();
            expect(refAction?.command?.command).toBe('domainlang.addRef');
        });

        test('add ref action is not preferred', async () => {
            // Arrange
            const diagnostic = createDiagnostic(IssueCodes.ImportMissingRef, 'noref');

            // Act
            const actions = await getCodeActions(diagnostic);

            // Assert
            const refAction = actions.find(a => a.title.includes('ref'));
            expect(refAction?.isPreferred).toBe(false);
        });
    });

    describe('edge cases', () => {
        test('returns undefined for unknown diagnostic codes', async () => {
            // Arrange
            const diagnostic = createDiagnostic('unknown-code');

            // Act
            const actions = await getCodeActions(diagnostic);

            // Assert
            expect(actions.length).toBe(0);
        });

        test('returns undefined for diagnostic without data', async () => {
            // Arrange
            const diagnostic: Diagnostic = {
                range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } },
                message: 'Test diagnostic',
                severity: DiagnosticSeverity.Error,
                source: 'domain-lang'
            };

            // Act
            const actions = await getCodeActions(diagnostic);

            // Assert
            expect(actions.length).toBe(0);
        });

        test('handles missing alias gracefully', async () => {
            // Arrange - ImportNotInManifest without alias
            const diagnostic = createDiagnostic(IssueCodes.ImportNotInManifest);

            // Act
            const actions = await getCodeActions(diagnostic);

            // Assert - should not crash, just return no actions
            expect(actions.length).toBe(0);
        });
    });
});
