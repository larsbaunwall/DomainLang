/**
 * Advanced Syntax Features Tests
 * 
 * This test suite validates modern syntax features:
 * - BC shorthand syntax
 * - Inline role/team/domain assignments
 * - Flattened classifiers
 * - Categorized decisions
 * - Namespace declaration
 * - ContextGroup
 * - Enhanced imports
 * - Relationship arrow shorthands (U/D, C/S)
 */

import { beforeAll, describe, expect, test } from 'vitest';
import type { TestServices } from '../test-helpers.js';
import { setupTestSuite, expectValidDocument, s } from '../test-helpers.js';
import { isBoundedContext, isContextGroup, isNamespaceDeclaration } from '../../src/generated/ast.js';

describe('Advanced Syntax Features', () => {
    let testServices: TestServices;

    beforeAll(() => {
        testServices = setupTestSuite();
    });

    test('should parse BC shorthand with inline assignments', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            Team ProductTeam
            Classification Core
            
            BC OrderContext for Sales as Core by ProductTeam
        `;
        
        // Act
        const document = await testServices.parse(input);
        expectValidDocument(document);
        const model = document.parseResult.value;
        const bc = model.children.find(c => isBoundedContext(c));
        
        // Assert
        expect(bc).toBeDefined();
        expect(bc!.name).toBe('OrderContext');
        expect(bc!.domain?.ref?.name).toBe('Sales');
    });

    test('should parse multiple role assignments', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            Team ProductTeam
            Classification Core
            Classification Supporting
            
            BC OrderContext for Sales as Core by ProductTeam
            BC PaymentContext for Sales as Supporting by ProductTeam
        `;
        
        // Act
        const document = await testServices.parse(input);
        expectValidDocument(document);
        const model = document.parseResult.value;
        const contexts = model.children.filter(c => isBoundedContext(c));
        
        // Assert
        expect(contexts).toHaveLength(2);
        expect(contexts[0].name).toBe('OrderContext');
        expect(contexts[1].name).toBe('PaymentContext');
    });

    test('should parse namespace declarations', async () => {
        // Arrange
        const input = s`
            namespace com.example.sales {
                Domain Sales {}
                Team SalesTeam
            }
        `;
        
        // Act
            const document = await testServices.parse(input);
            expectValidDocument(document);
            const model = document.parseResult.value;
            const ns = model.children.find(isNamespaceDeclaration);
        
            // Assert
            expect(ns).toBeDefined();
            expect(ns?.name).toBe('com.example.sales');
    });

    test('should parse context groups', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            
            BC OrderContext for Sales
            BC PaymentContext for Sales
            
            ContextGroup CoreServices for Sales {
                role: Core
                contains OrderContext, PaymentContext
            }
        `;
        
        // Act
        const document = await testServices.parse(input);
        expectValidDocument(document);
        const model = document.parseResult.value;
        const group = model.children.find(c => isContextGroup(c));
        
        // Assert
        expect(group).toBeDefined();
        expect(group!.name).toBe('CoreServices');
        expect(group!.contexts).toHaveLength(2);
    });

    test('should parse categorized decisions', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                decisions {
                    decision [architectural] EventSourcing: "Use event sourcing"
                    policy [business] RefundPolicy: "30-day return policy"
                    rule [technical] UniqueIds: "All orders need unique IDs"
                }
            }
        `;
        
        // Act
        const document = await testServices.parse(input);
        expectValidDocument(document);
        
        // Assert - document should parse without errors
        expect(document.parseResult.value).toBeDefined();
    });

    test('should parse relationship arrows', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            Domain Payment {}
            
            BC OrderContext for Sales
            BC PaymentContext for Payment
            
            ContextMap ECommerceMap {
                contains OrderContext, PaymentContext
                OrderContext U/D PaymentContext
                OrderContext <-> PaymentContext
            }
        `;
        
        // Act
        const document = await testServices.parse(input);
        expectValidDocument(document);
        
        // Assert - document should parse without errors
        expect(document.parseResult.value).toBeDefined();
    });

    test('should parse enhanced imports', async () => {
        // Arrange
        const input = s`
            import "./shared/types.dlang"
            import "owner/repo@v1.0.0" as DDD
                import "./definitions.dlang"
            
            Domain Sales {}
        `;
        
        // Act
        const document = await testServices.parse(input);
        expectValidDocument(document);
        
        // Assert - document should parse without errors
        expect(document.parseResult.value).toBeDefined();
    });

    test('should parse complex nested namespace structure', async () => {
        // Arrange
        const input = s`
            namespace com.company.ecommerce {
                Team SalesTeam
                Classification Core
                
                Domain Commerce {
                    description: "Main commerce domain"
                    vision: "Complete e-commerce platform"
                }
                
                BC OrderManagement for Commerce as Core by SalesTeam {
                    description: "Order processing and management"
                    
                    terminology {
                        term Order: "Customer purchase request"
                        term Customer: "Person placing orders"
                    }
                    
                    decisions {
                        decision [architectural] EventSourcing: "Use event sourcing"
                        policy [business] Returns: "30-day return policy"
                    }
                }
            }
        `;
        
        // Act
        const document = await testServices.parse(input);
        expectValidDocument(document);
        
        // Assert - document should parse without errors
        expect(document.parseResult.value).toBeDefined();
    });
});
