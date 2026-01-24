/**
 * Advanced Syntax Features Tests
 * 
 * This test suite validates modern syntax features:
 * - bc shorthand syntax
 * - Inline classification/team/domain assignments
 * - Flattened classifiers
 * - Categorized decisions
 * - Namespace declaration
 * - ContextGroup
 * - Enhanced imports
 * - Relationship arrow shorthands (U/D, C/S)
 */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { beforeAll, describe, expect, test } from 'vitest';
import type { TestServices } from '../test-helpers.js';
import { setupTestSuite, expectValidDocument, s } from '../test-helpers.js';
import type { BoundedContext, ContextMap } from '../../src/generated/ast.js';
import { isBoundedContext, isNamespaceDeclaration } from '../../src/generated/ast.js';

describe('Advanced Syntax Features', () => {
    let testServices: TestServices;

    beforeAll(() => {
        testServices = setupTestSuite();
    });

    test('should parse bc shorthand with inline assignments', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            Team ProductTeam
            Classification Core
            
            bc OrderContext for Sales as Core by ProductTeam
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

    test('should parse multiple classification assignments', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            Team ProductTeam
            Classification Core
            Classification Supporting
            
            bc OrderContext for Sales as Core by ProductTeam
            bc PaymentContext for Sales as Supporting by ProductTeam
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

    test('should parse Namespace declarations', async () => {
        // Arrange
        const input = s`
            Namespace com.example.sales {
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

    test('should parse bounded contexts', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            
            bc OrderContext for Sales
            bc PaymentContext for Sales
        `;
        
        // Act
        const document = await testServices.parse(input);
        expectValidDocument(document);
        const model = document.parseResult.value;
        const bcs = model.children.filter(c => isBoundedContext(c));
        
        // Assert
        expect(bcs).toHaveLength(2);
        expect(bcs[0].name).toBe('OrderContext');
        expect(bcs[1].name).toBe('PaymentContext');
        expect(bcs[0].domain?.ref?.name).toBe('Sales');
    });

    test('should parse categorized decisions', async () => {
        // Arrange
        const input = s`
            Classification Architectural
            Classification Business
            Classification Technical
            
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                decisions {
                    decision [Architectural] EventSourcing: "Use event sourcing"
                    policy [Business] RefundPolicy: "30-day return policy"
                    rule [Technical] UniqueIds: "All orders need unique IDs"
                }
            }
        `;
        
        // Act
        const document = await testServices.parse(input);
        expectValidDocument(document);
        const model = document.parseResult.value;
        const bc = model.children.find(c => isBoundedContext(c)) as BoundedContext;
        
        // Assert - verify decisions are parsed with correct categories
        expect(bc).toBeDefined();
        expect(bc.decisions).toHaveLength(3);
        expect(bc.decisions[0].name).toBe('EventSourcing');
        expect(bc.decisions[0].classification?.ref?.name).toBe('Architectural');
        expect(bc.decisions[1].name).toBe('RefundPolicy');
        expect(bc.decisions[1].classification?.ref?.name).toBe('Business');
        expect(bc.decisions[2].name).toBe('UniqueIds');
        expect(bc.decisions[2].classification?.ref?.name).toBe('Technical');
    });

    test('should parse relationship arrows', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            Domain Payment {}
            
            bc OrderContext for Sales
            bc PaymentContext for Payment
            
            ContextMap ECommerceMap {
                contains OrderContext, PaymentContext
                OrderContext -> PaymentContext : UpstreamDownstream
                OrderContext <-> PaymentContext
            }
        `;
        
        // Act
        const document = await testServices.parse(input);
        expectValidDocument(document);
        const model = document.parseResult.value;
        const contextMap = model.children.find(c => c.$type === 'ContextMap') as ContextMap | undefined;
        
        // Assert - verify relationships are parsed with correct arrow types
        expect(contextMap).toBeDefined();
        expect(contextMap!.relationships).toHaveLength(2);
        expect(contextMap!.relationships[0].arrow).toBe('->'); // Unidirectional
        expect(contextMap!.relationships[0].type).toBe('UpstreamDownstream');
        expect(contextMap!.relationships[1].arrow).toBe('<->'); // Bidirectional
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
        const model = document.parseResult.value;
        
        // Assert - verify imports are parsed correctly
        expect(model.imports).toHaveLength(3);
        expect(model.imports[0].uri).toBe('./shared/types.dlang');
        expect(model.imports[1].uri).toBe('owner/repo@v1.0.0');
        expect(model.imports[1].alias).toBe('DDD');
        expect(model.imports[2].uri).toBe('./definitions.dlang');
    });

    test('should parse complex nested Namespace structure', async () => {
        // Arrange
        const input = s`
            Namespace com.company.ecommerce {
                Team SalesTeam
                Classification Core
                Classification Architectural
                Classification Business
                
                Domain Commerce {
                    description: "Main commerce domain"
                    vision: "Complete e-commerce platform"
                }
                
                bc OrderManagement for Commerce as Core by SalesTeam {
                    description: "Order processing and management"
                    
                    terminology {
                        term Order: "Customer purchase request"
                        term Customer: "Person placing orders"
                    }
                    
                    decisions {
                        decision [Architectural] EventSourcing: "Use event sourcing"
                        policy [Business] Returns: "30-day return policy"
                    }
                }
            }
        `;
        
        // Act
        const document = await testServices.parse(input);
        expectValidDocument(document);
        const model = document.parseResult.value;
        const ns = model.children.find(c => isNamespaceDeclaration(c));
        
        // Assert - verify namespace structure is parsed correctly
        expect(ns).toBeDefined();
        expect(ns!.name).toBe('com.company.ecommerce');
        expect(ns!.children.length).toBeGreaterThanOrEqual(5); // Team, Classifications, Domain, BC
        
        // Verify nested domain and BC exist
        const nestedDomain = ns!.children.find(c => c.$type === 'Domain');
        expect(nestedDomain).toBeDefined();
        expect(nestedDomain!.name).toBe('Commerce');
        
        const nestedBC = ns!.children.find(c => isBoundedContext(c)) as BoundedContext;
        expect(nestedBC).toBeDefined();
        expect(nestedBC!.name).toBe('OrderManagement');
        expect(nestedBC!.terminology).toHaveLength(2);
        expect(nestedBC!.decisions).toHaveLength(2);
    });
});
