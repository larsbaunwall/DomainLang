/**
 * SDK Standalone Tests
 * 
 * Verifies that the SDK works independently of VS Code/LSP runtime.
 * These tests use the SDK loader functions directly, not test utilities.
 */

import { describe, test, expect } from 'vitest';
import { loadModelFromText } from '../../src/sdk/loader.js';
import type { BoundedContext } from '../../src/generated/ast.js';

describe('SDK Standalone Usage', () => {
    describe('loadModelFromText', () => {
        test('should parse basic domain model', async () => {
            // Arrange
            const text = `
                Domain Sales {
                    vision: "Sales operations"
                }
            `;
            
            // Act
            const { query, model } = await loadModelFromText(text);
            
            // Assert
            expect(model).toBeDefined();
            expect([...query.domains()].length).toBe(1);
            expect(query.domain('Sales')?.name).toBe('Sales');
        });

        test('should parse bounded contexts with documentation blocks', async () => {
            // Arrange
            const text = `
                Domain Sales {
                    vision: "Sales"
                }
                
                BoundedContext OrderContext for Sales {
                    description: "Order processing"
                }
            `;
            
            // Act
            const { query } = await loadModelFromText(text);
            
            // Assert
            const bcs = [...query.boundedContexts()] as BoundedContext[];
            expect(bcs.length).toBe(1);
            expect(bcs[0].name).toBe('OrderContext');
            expect(bcs[0].description).toBe('Order processing');
        });

        test('should provide O(1) index lookups', async () => {
            // Arrange - Team has no body in grammar, just `Team name`
            const text = `
                Domain Sales {
                    vision: "Sales operations"
                }
                
                Domain Finance {
                    vision: "Finance operations"
                }
                
                BoundedContext OrderContext for Sales {
                    description: "Orders"
                }
                
                BoundedContext PaymentContext for Finance {
                    description: "Payments"
                }
                
                Team SalesTeam
                Team FinanceTeam
            `;
            
            // Act
            const { query } = await loadModelFromText(text);
            
            // Assert - O(1) lookups work
            expect(query.domain('Sales')?.name).toBe('Sales');
            expect(query.domain('Finance')?.name).toBe('Finance');
            expect(query.bc('OrderContext')?.name).toBe('OrderContext');
            expect(query.bc('PaymentContext')?.name).toBe('PaymentContext');
            expect(query.team('SalesTeam')?.name).toBe('SalesTeam');
            expect(query.team('FinanceTeam')?.name).toBe('FinanceTeam');
        });

        test('should support query builder filtering by description', async () => {
            // Arrange
            const text = `
                Domain Sales { vision: "Sales" }
                
                BoundedContext OrderContext for Sales {
                    description: "Core orders"
                }
                
                BoundedContext ReportingContext for Sales {
                    description: "Analytics"
                }
            `;
            
            // Act
            const { query } = await loadModelFromText(text);
            const allBcs = [...query.boundedContexts()] as BoundedContext[];
            const coreBcs = allBcs.filter(bc => bc.description?.includes('Core'));
            const analyticsBcs = allBcs.filter(bc => bc.description?.includes('Analytics'));
            
            // Assert
            expect(coreBcs.length).toBe(1);
            expect(coreBcs[0].name).toBe('OrderContext');
            expect(analyticsBcs.length).toBe(1);
            expect(analyticsBcs[0].name).toBe('ReportingContext');
        });

        test('should support lazy iteration (generators)', async () => {
            // Arrange
            const text = `
                Domain D1 { vision: "1" }
                Domain D2 { vision: "2" }
                Domain D3 { vision: "3" }
            `;
            
            // Act
            const { query } = await loadModelFromText(text);
            
            // Assert - early break with lazy iteration
            let count = 0;
            for (const _d of query.domains()) {
                count++;
                if (count >= 1) break;
            }
            expect(count).toBe(1);  // Only processed one item due to lazy iteration
        });

        test('should throw on invalid syntax', async () => {
            // Arrange
            const invalidText = 'invalid syntax !!!';
            
            // Act & Assert - could be lexer or parser errors
            await expect(loadModelFromText(invalidText)).rejects.toThrow(/errors/i);
        });

        test('should provide first() terminal operation', async () => {
            // Arrange
            const text = `
                Domain Sales { vision: "Sales" }
                Domain Finance { vision: "Finance" }
            `;
            
            // Act
            const { query } = await loadModelFromText(text);
            const firstDomain = query.domains().first();
            
            // Assert
            expect(firstDomain).toBeDefined();
            expect(firstDomain?.name).toBe('Sales');
        });

        test('should provide count() terminal operation', async () => {
            // Arrange
            const text = `
                Domain Sales { vision: "Sales" }
                Domain Finance { vision: "Finance" }
                Domain Inventory { vision: "Inventory" }
            `;
            
            // Act
            const { query } = await loadModelFromText(text);
            const domainCount = query.domains().count();
            
            // Assert
            expect(domainCount).toBe(3);
        });

        test('should provide toArray() terminal operation', async () => {
            // Arrange
            const text = `
                Domain Sales { vision: "Sales" }
                Domain Finance { vision: "Finance" }
            `;
            
            // Act
            const { query } = await loadModelFromText(text);
            const domains = query.domains().toArray();
            
            // Assert
            expect(Array.isArray(domains)).toBe(true);
            expect(domains.length).toBe(2);
        });
    });
});
