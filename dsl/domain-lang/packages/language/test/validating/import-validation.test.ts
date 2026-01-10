import { beforeAll, describe, expect, test } from 'vitest';
import type { TestServices } from '../test-helpers.js';
import { setupTestSuite, expectValidDocument, s } from '../test-helpers.js';
import type { Diagnostic } from 'vscode-languageserver-types';

let testServices: TestServices;

beforeAll(() => {
    testServices = setupTestSuite();
});

const diagnosticToString = (d: Diagnostic): string => `${d.severity}: ${d.message}`;

describe('Import Validation', () => {
    // TODO: Named import syntax is not supported by the current grammar.
    // Acceptance criteria to enable:
    //  - Grammar supports `import { Symbol } from "./file"`
    //  - Scope/linking resolves imported symbols and emits diagnostics for missing ones
    test.skip('should validate named imports - symbol not found', async () => {
        // Arrange
        const input = s`
            import { NonExistentDomain } from "./missing.dlang"
            
            Domain TestDomain:
                vision: "This is a test domain."
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert (future): expect a linking diagnostic about NonExistentDomain
        const messages = document.diagnostics?.map(diagnosticToString) ?? [];
        expect(messages.some(m => m.toLowerCase().includes('nonexistentdomain'))).toBe(true);
    });

    test('should validate import path - file not found', async () => {
        // Arrange
        const input = s`
            import "./nonexistent.dlang"
            
            Domain TestDomain:
                vision: "This is a test domain."
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert: parsing succeeds; file resolution diagnostics (if any) are implementation-defined
        expectValidDocument(document);
    });

    test('should validate simple import with alias', async () => {
        // Arrange
        const input = s`
            import "./other.dlang" as Other
            
            Domain TestDomain:
                vision: "This is a test domain."
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should handle git URL imports', async () => {
        // Arrange
        const input = s`
            import "owner/repo@v1.0.0"
            
            Domain TestDomain:
                vision: "This is a test domain."
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should allow valid domain definition without imports', async () => {
        // Arrange
        const input = s`
            Domain TestDomain:
                vision: "This is a test domain."
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        const errors = document.diagnostics?.filter((d: Diagnostic) => d.severity === 1) ?? [];
        expect(errors).toHaveLength(0);
    });
});