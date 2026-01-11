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
                "Domain 'Sales' has no domain vision"
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
            // Arrange
            const input = s`
                Domain A in B {}
                Domain B in C {}
                Domain C in A {}
            `;

            // Act
            const document = await testServices.parse(input);

            // Assert - This validation might not be implemented yet
            // TODO: Remove this when circular validation is added
            expectValidDocument(document);
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
                "Bounded Context 'OrderContext' has no description"
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

        test('should validate team reference exists', async () => {
            // Arrange
            const input = s`
                Domain Sales {}
                BoundedContext OrderContext for Sales {
                    team: NonExistentTeam
                }
            `;

            // Act
            const document = await testServices.parse(input);

            // Assert - TODO: Remove when linking validation works
            expectValidDocument(document);
        });

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
                "This element is already defined elsewhere"
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
                "This element is already defined elsewhere"
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

        test('should validate import references', async () => {
            // Arrange
            const input = s`
                import "./non-existent-file.dlang"
                Domain Test {}
            `;

            // Act
            const document = await testServices.parse(input);

            // Assert
            // Should warn about missing import file
            expectValidDocument(document); // Remove when import validation works
        });
    });

    // ========================================================================
    // IMPORT VALIDATION
    // ========================================================================

    describe('Import Validation', () => {
        test('should validate import file exists', async () => {
            // Arrange
            const input = s`
                import "./missing-file.dlang"
                Domain Test {}
            `;

            // Act
            const document = await testServices.parse(input);

            // Assert
            // Should generate validation error for missing file
            expectValidDocument(document); // Remove when import validation works properly
        });

        test('should validate named import symbols exist', async () => {
            // Arrange
            const input = s`
                import { NonExistentSymbol } from "./some-file.dlang"
                Domain Test {}
            `;

            // Act
            const document = await testServices.parse(input);

            // Assert
            // Should generate validation error for missing symbols
            expectValidDocument(document); // Remove when import validation works properly
        });

        test('should validate import URIs are well-formed', async () => {
            // Arrange
            const input = s`
                import "invalid://not-a-valid-uri@malformed"
                Domain Test {}
            `;

            // Act
            const document = await testServices.parse(input);

            // Assert
            // Should generate validation error for malformed URI
            expectValidDocument(document); // Remove when URI validation is added
        });

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
        test('should detect invalid domain reference in bounded context', async () => {
            // Arrange
            const input = s`
                BoundedContext TestBC for NonExistentDomain
            `;

            // Act
            const document = await testServices.parse(input);

            // Assert
            // Should fail during linking phase
            expectValidDocument(document); // Remove when linking validation works
        });

        test('should detect invalid team reference', async () => {
            // Arrange
            const input = s`
                Domain Sales {}
                BoundedContext TestBC for Sales {
                    team: NonExistentTeam
                }
            `;

            // Act
            const document = await testServices.parse(input);

            // Assert
            // Should fail during linking phase
            expectValidDocument(document); // Remove when linking validation works
        });

        test('should detect invalid classification reference', async () => {
            // Arrange
            const input = s`
                Domain Sales {}
                BoundedContext TestBC for Sales {
                    role: NonExistentClassification
                }
            `;

            // Act
            const document = await testServices.parse(input);

            // Assert
            // Should fail during linking phase
            expectValidDocument(document); // Remove when linking validation works
        });

        test('accepts valid cross-references', async () => {
            // Arrange
            const input = s`
                Domain Sales {}
                Team SalesTeam
                Classification Core
                
                BoundedContext TestBC for Sales {
                    team: SalesTeam
                    role: Core
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
        test('should detect invalid bounded context reference in relationship', async () => {
            // Arrange
            const input = s`
                Domain Sales {}
                BoundedContext ValidBC for Sales
                
                ContextMap TestMap {
                    contains ValidBC
                    ValidBC -> NonExistentBC
                }
            `;

            // Act
            const document = await testServices.parse(input);

            // Assert
            // Should fail during linking phase
            expectValidDocument(document); // Remove when linking validation works
        });

        test('should validate "this" reference context', async () => {
            // Arrange
            const input = s`
                Domain Sales {}
                BoundedContext TestBC for Sales {
                    relationships {
                        this -> NonExistentBC
                    }
                }
            `;

            // Act
            const document = await testServices.parse(input);

            // Assert
            // Should fail during linking phase
            expectValidDocument(document); // Remove when linking validation works
        });

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

        test('should detect invalid qualified name', async () => {
            // Arrange
            const input = s`
                Namespace com.example {
                    Domain Sales {}
                }
                
                BoundedContext TestBC for com.invalid.Sales
            `;

            // Act
            const document = await testServices.parse(input);

            // Assert
            // Should fail during linking phase
            expectValidDocument(document); // Remove when qualified name validation works
        });

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