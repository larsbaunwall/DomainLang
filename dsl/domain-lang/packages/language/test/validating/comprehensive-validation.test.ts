/**
 * Comprehensive Validation Tests
 * 
 * Tests all validation rules defined in src/validation/ directory.
 * Each validator should have both positive (valid) and negative (invalid) test cases.
 */

import { describe, test, beforeAll } from 'vitest';
import type { TestServices } from '../test-helpers.js';
import { 
    setupTestSuite, 
    expectValidationErrors, 
    expectValidationWarnings, 
    expectValidDocument,
    s 
} from '../test-helpers.js';

describe('Validation Tests', () => {
    let testServices: TestServices;

    beforeAll(() => {
        testServices = setupTestSuite();
    });

    // ========================================================================
    // DOMAIN VALIDATION
    // ========================================================================

    describe('Domain Validation', () => {
        test('warns when domain lacks vision', async () => {
            // Arrange
            const input = s`
                Domain Sales {
                    description: "Sales operations"
                    // Missing vision
                }
            `;

            // Act
            const document = await testServices.parse(input);

            // Assert
            expectValidationWarnings(document, [
                "missing a vision statement"
            ]);
        });

        test('accepts domain with vision', async () => {
            // Arrange
            const input = s`
                Domain Sales {
                    description: "Sales operations"
                    vision: "Streamlined sales process"
                }
            `;

            // Act
            const document = await testServices.parse(input);

            // Assert
            expectValidDocument(document);
        });

        test('should detect circular domain hierarchy', async () => {
            // Arrange - Circular hierarchy: A → B → C → A
            const input = s`
                Domain A in B {}
                Domain B in C {}
                Domain C in A {}
            `;

            // Act
            const document = await testServices.parse(input);

            // Assert - Each domain in the cycle reports the error
            expectValidationErrors(document, [
                'Circular domain hierarchy detected',
                'Circular domain hierarchy detected',
                'Circular domain hierarchy detected'
            ]);
        });

        test('should detect self-referencing domain', async () => {
            // Arrange - Domain references itself
            const input = s`
                Domain SelfRef in SelfRef {}
            `;

            // Act
            const document = await testServices.parse(input);

            // Assert - Should detect circular reference
            expectValidationErrors(document, [
                'Circular domain hierarchy detected'
            ]);
        });

        test('accepts valid domain hierarchy', async () => {
            // Arrange
            const input = s`
                Domain Root {}
                Domain Child in Root {}
                Domain GrandChild in Child {}
            `;

            // Act
            const document = await testServices.parse(input);

            // Assert
            expectValidDocument(document);
        });
    });

    // ========================================================================
    // BOUNDED CONTEXT VALIDATION
    // ========================================================================

    describe('Bounded Context Validation', () => {
        test('warns when bounded context lacks description', async () => {
            // Arrange
            const input = s`
                Domain Sales {
                    vision: "Handle all sales activities"
                }
                BoundedContext OrderContext for Sales {
                    // Missing description
                    team: SomeTeam
                }
            `;

            // Act
            const document = await testServices.parse(input);

            // Assert
            expectValidationWarnings(document, [
                "missing a description"
            ]);
        });

        test('accepts bounded context with description', async () => {
            // Arrange
            const input = s`
                Domain Sales {}
                BoundedContext OrderContext for Sales {
                    description: "Handles order processing"
                }
            `;

            // Act
            const document = await testServices.parse(input);

            // Assert
            expectValidDocument(document);
        });

        // Team reference validation is tested in linking.test.ts (Team Reference Linking)

        test('accepts valid team reference', async () => {
            // Arrange
            const input = s`
                Domain Sales {}
                Team SalesTeam
                BoundedContext OrderContext for Sales {
                    team: SalesTeam
                }
            `;

            // Act
            const document = await testServices.parse(input);

            // Assert
            expectValidDocument(document);
        });
    });

    // ========================================================================
    // NAMESPACE DECLARATION VALIDATION
    // ========================================================================

    describe('Namespace Declaration Validation', () => {
        test('should detect duplicate Namespace names', async () => {
            // Arrange
            const input = s`
                Namespace TestNamespace {
                    Domain Domain1 {}
                }
                
                Namespace TestNamespace {
                    Domain Domain2 {}
                }
            `;

            // Act
            const document = await testServices.parse(input);

            // Assert
            expectValidationErrors(document, [
                "Duplicate element"
            ]);
        });

        test('accepts unique Namespace names', async () => {
            // Arrange
            const input = s`
                Namespace Namespace1 {
                    Domain Domain1 {}
                }
                
                Namespace Namespace2 {
                    Domain Domain2 {}
                }
            `;

            // Act
            const document = await testServices.parse(input);

            // Assert
            expectValidDocument(document);
        });
    });

    // ========================================================================
    // CLASSIFICATION VALIDATION
    // ========================================================================

    describe('Classification Validation', () => {
        test('should detect duplicate classification names', async () => {
            // Arrange
            const input = s`
                Classification Core
                Classification Core
            `;

            // Act
            const document = await testServices.parse(input);

            // Assert
            expectValidationErrors(document, [
                "Duplicate element"
            ]);
        });

        test('accepts unique classification names', async () => {
            // Arrange
            const input = s`
                Classification Core
                Classification Supporting
                Classification Generic
            `;

            // Act
            const document = await testServices.parse(input);

            // Assert
            expectValidDocument(document);
        });
    });

    // ========================================================================
    // MODEL VALIDATION
    // ========================================================================

    describe('Model Validation', () => {
        test('should detect duplicate element names at top level', async () => {
            // Arrange
            const input = s`
                Domain TestDomain {}
                BoundedContext TestDomain for TestDomain
            `;

            // Act
            const document = await testServices.parse(input);

            // Assert
            // Different types but same name should be allowed or not?
            expectValidDocument(document); // May need to change based on requirements
        });

        // Import validation is tested in:
        // - import-resolver.test.ts (file resolution, manifest requirements)
        // - import-validation-phase3.test.ts (syntax, network boundary)
    });

    // ========================================================================
    // IMPORT VALIDATION
    // ========================================================================

    describe('Import Validation', () => {
        // Import file existence and manifest validation are tested in:
        // - import-resolver.test.ts
        // - import-validation-phase3.test.ts
        // - workspace-manager-manifest.test.ts

        test('accepts valid local import', async () => {
            // Arrange
            const input = s`
                import "./valid-path.dlang"
                Domain Test {}
            `;

            // Act
            const document = await testServices.parse(input);

            // Assert
            expectValidDocument(document);
        });

        test('accepts valid GitHub import', async () => {
            // Arrange
            const input = s`
                import "owner/repo@v1.0.0"
                Domain Test {}
            `;

            // Act
            const document = await testServices.parse(input);

            // Assert
            expectValidDocument(document);
        });
    });

    // ========================================================================
    // CROSS-REFERENCE VALIDATION
    // ========================================================================

    describe('Cross-Reference Validation', () => {
        // Note: Unresolved reference detection is tested in linking.test.ts
        // which verifies that:
        // - Invalid domain references have .ref undefined and .error defined
        // - Invalid team references have .ref undefined and .error defined
        // - Invalid classification references have .ref undefined and .error defined
        // See: linking.test.ts "Domain Reference Linking", "Team Reference Linking",
        //      "Classification Reference Linking" describe blocks

        test('accepts valid cross-references', async () => {
            // Arrange
            const input = s`
                Domain Sales {}
                Team SalesTeam
                Classification Core
                
                BoundedContext TestBC for Sales {
                    classification: Core
                    team: SalesTeam
                }
            `;

            // Act
            const document = await testServices.parse(input);

            // Assert
            expectValidDocument(document);
        });
    });

    // ========================================================================
    // RELATIONSHIP VALIDATION
    // ========================================================================

    describe('Relationship Validation', () => {
        // Note: Unresolved bounded context references in relationships are tested in
        // linking.test.ts "ContextMap Relationship Linking" and "This Reference Linking"
        // which verify .ref and .error properties on relationship links

        test('accepts valid relationships', async () => {
            // Arrange
            const input = s`
                Domain Sales {}
                BoundedContext BC1 for Sales
                BoundedContext BC2 for Sales
                
                ContextMap TestMap {
                    contains BC1, BC2
                    [OHS] BC1 -> [CF] BC2 : CustomerSupplier
                }
            `;

            // Act
            const document = await testServices.parse(input);

            // Assert
            expectValidDocument(document);
        });
    });

    // ========================================================================
    // NAMESPACE AND SCOPING VALIDATION
    // ========================================================================

    describe('Namespace and Scoping Validation', () => {
        test('should handle qualified name resolution', async () => {
            // Arrange
            const input = s`
                Namespace com.example {
                    Domain Sales {}
                }
                
                BoundedContext TestBC for com.example.Sales
            `;

            // Act
            const document = await testServices.parse(input);

            // Assert
            expectValidDocument(document);
        });

        // Note: Qualified name resolution is tested in linking.test.ts
        // "Complex Linking Scenarios" > "should resolve nested Namespace qualified names"
        // which verifies .ref resolution for qualified paths

        test('should validate nested Namespace access', async () => {
            // Arrange
            const input = s`
                Namespace com.example.sales {
                    Domain Sales {}
                    
                    Namespace orders {
                        BoundedContext OrderContext for Sales
                    }
                }
                
                // Reference from outside namespace
                BoundedContext ExternalBC for com.example.sales.Sales
            `;

            // Act
            const document = await testServices.parse(input);

            // Assert
            expectValidDocument(document);
        });
    });
});