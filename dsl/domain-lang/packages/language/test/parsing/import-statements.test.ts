/**
 * Import Statement Tests
 * 
 * Tests for the import system including:
 * - Local file imports
 * - Git URL imports (GitHub style)
 * - Named imports
 * - Import aliases
 * - Integrity checks
 */

import { describe, test, beforeAll, expect } from 'vitest';
import type { TestServices } from '../test-helpers.js';
import { setupTestSuite, expectValidDocument, s } from '../test-helpers.js';
import type { ImportStatement } from '../../src/generated/ast.js';

let testServices: TestServices;

beforeAll(() => {
    testServices = setupTestSuite();
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getImports(document: any): ImportStatement[] {
    return document.parseResult.value.imports ?? [];
}

// ============================================================================
// LOCAL FILE IMPORTS
// ============================================================================

describe('Local File Imports', () => {
    test('should parse relative path import', async () => {
        // Arrange
        const input = s`
            import "./types.dlang"
            
            Domain Sales {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const imports = getImports(document);
        expect(imports).toHaveLength(1);
        expect(imports[0].uri).toBe('./types.dlang');
    });

    test('should parse nested relative path import', async () => {
        // Arrange
        const input = s`
            import "./shared/types/base.dlang"
            
            Domain Sales {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const imports = getImports(document);
        expect(imports[0].uri).toBe('./shared/types/base.dlang');
    });

    test('should parse parent directory import', async () => {
        // Arrange
        const input = s`
            import "../common/types.dlang"
            
            Domain Sales {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const imports = getImports(document);
        expect(imports[0].uri).toBe('../common/types.dlang');
    });

    test('should parse workspace-relative import with tilde', async () => {
        // Arrange
        const input = s`
            import "~/contexts/sales.dlang"
            
            Domain Sales {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const imports = getImports(document);
        expect(imports[0].uri).toBe('~/contexts/sales.dlang');
    });
});

// ============================================================================
// GIT URL IMPORTS
// ============================================================================

describe('Git URL Imports', () => {
    test('should parse GitHub-style import', async () => {
        // Arrange
        const input = s`
            import "owner/repo@v1.0.0"
            
            Domain Sales {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const imports = getImports(document);
        expect(imports[0].uri).toBe('owner/repo@v1.0.0');
    });

    test('should parse GitHub-style import with branch', async () => {
        // Arrange
        const input = s`
            import "ddd-patterns/core@main"
            
            Domain Sales {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const imports = getImports(document);
        expect(imports[0].uri).toBe('ddd-patterns/core@main');
    });

    test('should parse full HTTPS URL import', async () => {
        // Arrange
        const input = s`
            import "https://github.com/owner/repo@v1.0.0"
            
            Domain Sales {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const imports = getImports(document);
        expect(imports[0].uri).toBe('https://github.com/owner/repo@v1.0.0');
    });

    test('should parse GitLab URL import', async () => {
        // Arrange
        const input = s`
            import "https://gitlab.com/company/patterns@v2.0.0"
            
            Domain Sales {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const imports = getImports(document);
        expect(imports[0].uri).toBe('https://gitlab.com/company/patterns@v2.0.0');
    });
});

// ============================================================================
// IMPORT ALIASES
// ============================================================================

describe('Import Aliases', () => {
    test('should parse import with alias', async () => {
        // Arrange
        const input = s`
            import "owner/repo@v1.0.0" as Patterns
            
            Domain Sales {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const imports = getImports(document);
        expect(imports[0].alias).toBe('Patterns');
    });

    test('should parse local import with alias', async () => {
        // Arrange
        const input = s`
            import "./shared/types.dlang" as Shared
            
            Domain Sales {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const imports = getImports(document);
        expect(imports[0].alias).toBe('Shared');
    });
});

// ============================================================================
// NAMED IMPORTS
// ============================================================================

describe('Named Imports', () => {
    test('should parse single named import', async () => {
        // Arrange
        const input = s`
            import { OrderContext } from "./contexts.dlang"
            
            Domain Sales {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const imports = getImports(document);
        expect(imports[0].symbols).toHaveLength(1);
        expect(imports[0].symbols[0]).toBe('OrderContext');
    });

    test('should parse multiple named imports', async () => {
        // Arrange
        const input = s`
            import { OrderContext, PaymentContext, InventoryContext } from "./contexts.dlang"
            
            Domain Sales {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const imports = getImports(document);
        expect(imports[0].symbols).toHaveLength(3);
        expect(imports[0].symbols).toContain('OrderContext');
        expect(imports[0].symbols).toContain('PaymentContext');
        expect(imports[0].symbols).toContain('InventoryContext');
    });
});

// ============================================================================
// INTEGRITY CHECKS
// ============================================================================

describe('Import Integrity', () => {
    test('should parse import with integrity hash', async () => {
        // Arrange
        const input = s`
            import "owner/repo@v1.0.0" integrity "sha256-abc123def456"
            
            Domain Sales {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const imports = getImports(document);
        expect(imports[0].integrity).toBe('sha256-abc123def456');
    });

    test('should parse import with alias and integrity', async () => {
        // Arrange
        const input = s`
            import "owner/repo@v1.0.0" integrity "sha512-xyz789" as Patterns
            
            Domain Sales {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const imports = getImports(document);
        expect(imports[0].alias).toBe('Patterns');
        expect(imports[0].integrity).toBe('sha512-xyz789');
    });
});

// ============================================================================
// MULTIPLE IMPORTS
// ============================================================================

describe('Multiple Imports', () => {
    test('should parse multiple import statements', async () => {
        // Arrange
        const input = s`
            import "./types.dlang"
            import "./shared/base.dlang"
            import "owner/repo@v1.0.0" as DDD
            
            Domain Sales {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const imports = getImports(document);
        expect(imports).toHaveLength(3);
    });

    test('should parse mixed import styles', async () => {
        // Arrange
        const input = s`
            import "./local.dlang"
            import { Context1 } from "./contexts.dlang"
            import "github/patterns@v1.0.0" as Patterns
            import "secure/module@v2.0.0" integrity "sha256-secure"
            
            Domain Sales {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const imports = getImports(document);
        expect(imports).toHaveLength(4);
    });
});

// ============================================================================
// IMPORT POSITION
// ============================================================================

describe('Import Position', () => {
    test('should allow imports before any declarations', async () => {
        // Arrange
        const input = s`
            import "./types.dlang"
            
            Classification Core
            Team SalesTeam
            Domain Sales {}
            BC OrderContext for Sales
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should allow multiple imports followed by declarations', async () => {
        // Arrange
        const input = s`
            import "./types.dlang"
            import "./teams.dlang"
            import "patterns/ddd@v1.0.0"
            
            Domain Sales {
                vision: "Sales domain"
            }
            
            BC OrderContext for Sales {
                description: "Order management"
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const imports = getImports(document);
        expect(imports).toHaveLength(3);
    });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Import Edge Cases', () => {
    test('should handle import with single quotes', async () => {
        // Arrange
        const input = s`
            import './types.dlang'
            
            Domain Sales {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should handle import with spaces in path', async () => {
        // Arrange
        const input = s`
            import "./my folder/types.dlang"
            
            Domain Sales {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should handle empty model with only imports', async () => {
        // Arrange
        const input = s`
            import "./types.dlang"
            import "owner/repo@v1.0.0"
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const imports = getImports(document);
        expect(imports).toHaveLength(2);
    });
});
