/**
 * Import Validation Tests
 *
 * Tests for import statement validation including:
 * - Manifest discovery and dependency resolution
 * - Lock file validation
 * - Path sandboxing
 *
 * Per PRS-010 Phase 2, these tests cover:
 * - Parsing of simplified import syntax (uri + optional alias)
 * - Manifest-based dependency resolution
 * - Validation of path sandboxing
 *
 * Note: These tests validate parsing behavior since the validation system
 * runs against an EmptyFileSystem in tests. See workspace-manager-manifest.test.ts
 * for filesystem-level manifest validation tests.
 */

import { beforeAll, describe, expect, test } from 'vitest';
import type { TestServices } from '../test-helpers.js';
import { s, setupTestSuite } from '../test-helpers.js';

let testServices: TestServices;

beforeAll(() => {
    testServices = setupTestSuite();
});

describe('Import Validation (Phase 2)', () => {
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
        expect(document.parseResult.value).toBeDefined();
    });

    // ========================================================================
    // PRS-010 Phase 2: Manifest-based External Dependency Resolution
    // ========================================================================

    test('should parse external import with alias syntax', async () => {
        // Arrange - Per PRS Phase 2: external deps use "specifier as Alias" syntax
        const input = s`
            import "core" as Core

            Domain TestDomain {
                vision: "Test"
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        const imports = document.parseResult.value.imports ?? [];
        expect(imports).toHaveLength(1);
        expect(imports[0].uri).toBe('core');
        expect(imports[0].alias).toBe('Core');
    });

    test('should parse external import without alias (implicit alias)', async () => {
        // Arrange - Per PRS Phase 2: alias is optional, defaults to specifier
        const input = s`
            import "patterns"

            Domain TestDomain {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        const imports = document.parseResult.value.imports ?? [];
        expect(imports).toHaveLength(1);
        expect(imports[0].uri).toBe('patterns');
        expect(imports[0].alias).toBeUndefined();
    });

    test('should parse nested dependency imports', async () => {
        // Arrange - Per PRS Phase 2: dependencies can use path notation (patterns/strategic)
        const input = s`
            import "patterns/strategic"
            import "shared/lib"

            Domain TestDomain {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        const imports = document.parseResult.value.imports ?? [];
        expect(imports).toHaveLength(2);
        expect(imports[0].uri).toBe('patterns/strategic');
        expect(imports[1].uri).toBe('shared/lib');
    });

    // ========================================================================
    // PRS-010 Phase 2: Local Import Resolution
    // ========================================================================

    test('should parse relative and path alias imports without manifest', async () => {
        // Arrange - Per PRS-010: local paths and path aliases resolve locally
        const input = s`
            import "./types.dlang"
            import "../shared/common.dlang"
            import "@/lib/utils.dlang"

            Domain TestDomain {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        const imports = document.parseResult.value.imports ?? [];
        expect(imports).toHaveLength(3);
        expect(imports[0].uri).toBe('./types.dlang');
        expect(imports[1].uri).toBe('../shared/common.dlang');
        expect(imports[2].uri).toBe('@/lib/utils.dlang');
    });

    // ========================================================================
    // PRS-010 Phase 2: Validation of Alias Format
    // ========================================================================

    test('should accept uppercase alias names', async () => {
        // Arrange - Per conventions, aliases are typically capitalized
        const input = s`
            import "domainlang/core" as DomainLang
            import "patterns" as DDDPatterns

            Domain TestDomain {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        const imports = document.parseResult.value.imports ?? [];
        expect(imports).toHaveLength(2);
        expect(imports[0].alias).toBe('DomainLang');
        expect(imports[1].alias).toBe('DDDPatterns');
    });

    test('should accept lowercase alias names', async () => {
        // Arrange - Aliases can also be lowercase
        const input = s`
            import "core" as core
            import "shared" as shared

            Domain TestDomain {}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        const imports = document.parseResult.value.imports ?? [];
        expect(imports).toHaveLength(2);
        expect(imports[0].alias).toBe('core');
        expect(imports[1].alias).toBe('shared');
    });
});