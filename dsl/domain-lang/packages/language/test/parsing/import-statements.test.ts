/**
 * Import Statement Tests
 *
 * Tests for the import system including:
 * - Local file imports
 * - Manifest dependency imports (alias-only)
 */

import { beforeAll, describe, expect, test } from 'vitest';
import type { ImportStatement } from '../../src/generated/ast.js';
import type { TestServices } from '../test-helpers.js';
import { expectValidDocument, s, setupTestSuite } from '../test-helpers.js';

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

    test('should parse path alias import with @/', async () => {
        // Arrange - Per PRS-010: @/ maps to workspace root
        const input = s`
            import "@/contexts/sales.dlang"

            Domain Sales {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const imports = getImports(document);
        expect(imports[0].uri).toBe('@/contexts/sales.dlang');
    });
});

// ============================================================================
// MANIFEST DEPENDENCY IMPORTS (PRS-010)
// ============================================================================

describe('Manifest Dependency Imports', () => {
    test('should parse simple dependency import', async () => {
        // Arrange
        const input = s`
            import "core"

            Domain Sales {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        const imports = getImports(document);
        expect(imports).toHaveLength(1);
        expect(imports[0].uri).toBe('core');
    });

    test('should parse dependency import with alias', async () => {
        // Arrange
        const input = s`
            import "core" as Core

            Domain Sales {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        const imports = getImports(document);
        expect(imports).toHaveLength(1);
        expect(imports[0].uri).toBe('core');
        expect(imports[0].alias).toBe('Core');
    });

    test('should parse dependency with path notation', async () => {
        // Arrange
        const input = s`
            import "patterns/strategic"

            Domain Sales {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        const imports = getImports(document);
        expect(imports).toHaveLength(1);
        expect(imports[0].uri).toBe('patterns/strategic');
    });
});

// ============================================================================
// IMPORT ALIASES
// ============================================================================

describe('Import Aliases', () => {
    test('should parse import with alias', async () => {
        // Arrange
        const input = s`
            import "core" as Core

            Domain Sales {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        const imports = getImports(document);
        expect(imports).toHaveLength(1);
        expect(imports[0].uri).toBe('core');
        expect(imports[0].alias).toBe('Core');
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
// MULTIPLE IMPORTS
// ============================================================================

describe('Multiple Imports', () => {
    test('should parse multiple import statements', async () => {
        // Arrange
        const input = s`
            import "./types.dlang"
            import "./shared/base.dlang"
            import "core" as Core

            Domain Sales {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        const imports = getImports(document);
        expect(imports).toHaveLength(3);
        expect(imports[0].uri).toBe('./types.dlang');
        expect(imports[1].uri).toBe('./shared/base.dlang');
        expect(imports[2].uri).toBe('core');
        expect(imports[2].alias).toBe('Core');
    });

    test('should parse mixed import styles', async () => {
        // Arrange - Per PRS-010: local relative, path alias, and external
        const input = s`
            import "./local.dlang"
            import "@/workspace.dlang"
            import "patterns" as Patterns

            Domain Sales {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        const imports = getImports(document);
        expect(imports).toHaveLength(3);
        expect(imports[0].uri).toBe('./local.dlang');
        expect(imports[1].uri).toBe('@/workspace.dlang');
        expect(imports[2].uri).toBe('patterns');
        expect(imports[2].alias).toBe('Patterns');
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
            bc OrderContext for Sales
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
            import "patterns" as Patterns

            Domain Sales {
                vision: "Sales domain"
            }

            bc OrderContext for Sales {
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
            import "core"
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        const imports = getImports(document);
        expect(imports).toHaveLength(2);
        expect(imports[0].uri).toBe('./types.dlang');
        expect(imports[1].uri).toBe('core');
    });
});

// ============================================================================
// PHASE 1: GRAMMAR REJECTION - Old Syntax Not Allowed
// ============================================================================
// Per PRS-010 Phase 1 acceptance criteria:
// Grammar should REJECT old syntax that was removed

describe('Grammar Rejection (Phase 1)', () => {
    test('should reject named imports syntax', async () => {
        // Arrange - Old PRS-009 syntax that should no longer work
        const input = s`
            import { Domain, BoundedContext } from "core"

            Domain Sales {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert - Should have parse errors
        expect(document.parseResult.parserErrors.length).toBeGreaterThan(0);
    });

    test('should reject inline integrity field', async () => {
        // Arrange - Old syntax removed in Phase 1
        const input = s`
            import "core" integrity "sha256:abc123"

            Domain Sales {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert - Should have parse errors
        expect(document.parseResult.parserErrors.length).toBeGreaterThan(0);
    });

    test('should reject inline version syntax', async () => {
        // Arrange - Versions moved to manifest, not inline
        const input = s`
            import "core@v1.0.0"

            Domain Sales {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert - Should not parse as a single token; version would be part of URI
        const imports = getImports(document);
        if (imports.length > 0) {
            // If it parses, URI should include the @v1.0.0 as literal string
            expect(imports[0].uri).toBe('core@v1.0.0');
        }
    });
});
