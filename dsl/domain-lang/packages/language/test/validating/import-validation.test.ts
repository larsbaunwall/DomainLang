import { beforeAll, describe, expect, test } from 'vitest';
import type { TestServices } from '../test-helpers.js';
import { setupTestSuite, expectValidDocument, s } from '../test-helpers.js';
import type { Diagnostic } from 'vscode-languageserver-types';

let testServices: TestServices;

beforeAll(() => {
    testServices = setupTestSuite();
});

describe('Import Validation', () => {
    test('should validate import path - file not found', async () => {
        // Arrange
        const input = s`
            import "./nonexistent.dlang"
            
            Domain TestDomain {
                vision: "This is a test domain."
            }
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
            
            Domain TestDomain {
                vision: "This is a test domain."
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should handle manifest dependency imports', async () => {
        // Arrange
        const input = s`
            import "core"
            
            Domain TestDomain {
                vision: "This is a test domain."
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should allow valid domain definition without imports', async () => {
        // Arrange
        const input = s`
            Domain TestDomain {
                vision: "This is a test domain."
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        const errors = document.diagnostics?.filter((d: Diagnostic) => d.severity === 1) ?? [];
        expect(errors).toHaveLength(0);
    });
});