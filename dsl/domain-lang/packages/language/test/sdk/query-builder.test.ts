/**
 * SDK QueryBuilder Tests
 * 
 * Comprehensive tests for QueryBuilder chaining, filtering, and iteration behavior.
 * Validates lazy evaluation and filter combinations.
 */

import { describe, test, expect } from 'vitest';
import { loadModelFromText } from '../../src/sdk/loader.js';

describe('SDK QueryBuilder', () => {
    
    describe('where() - Custom Predicate Filtering', () => {
        
        test('filters items using custom predicate', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
                Domain VeryLongNameDomain { vision: "v" }
                Domain X { vision: "v" }
            `);
            
            // Act
            const longNameDomains = query.domains().where(d => d.name.length > 6);
            const results = [...longNameDomains];
            
            // Assert
            expect(results.length).toBe(1);
            expect(results[0].name).toBe('VeryLongNameDomain');
        });
        
        test('supports chaining multiple where() calls', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "Sales vision" }
                Domain Finance { vision: "Finance vision" }
                Domain SalesFinance { vision: "Combined" }
            `);
            
            // Act
            const results = [
                ...query.domains()
                    .where(d => d.name.includes('Sales'))
                    .where(d => d.name.length > 5)
            ];
            
            // Assert
            expect(results.length).toBe(1);
            expect(results[0].name).toBe('SalesFinance');
        });
        
        test('returns empty iterator when predicate matches nothing', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain A { vision: "v" }
                Domain B { vision: "v" }
            `);
            
            // Act
            const results = [...query.domains().where(d => d.name === 'NonExistent')];
            
            // Assert
            expect(results.length).toBe(0);
        });
        
        test('preserves lazy evaluation until terminal operation', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain A { vision: "v" }
                Domain B { vision: "v" }
                Domain C { vision: "v" }
            `);
            let callCount = 0;
            
            // Act - Create filter but don't consume
            const builder = query.domains().where(() => {
                callCount++;
                return true;
            });
            expect(callCount).toBe(0); // Not called yet
            
            // Now consume one item with first()
            builder.first();
            
            // Assert - Predicate called only once (for first item)
            expect(callCount).toBe(1);
        });
    });
    
    describe('withName() - Name-based Filtering', () => {
        
        test('filters items by exact name match (case-sensitive)', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
                Domain sales { vision: "v" }
                Domain Finance { vision: "v" }
            `);
            
            // Act
            const results = [...query.domains().withName('Sales')];
            
            // Assert
            expect(results.length).toBe(1);
            expect(results[0].name).toBe('Sales');
        });
        
        test('returns empty when name not found', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
            `);
            
            // Act
            const results = [...query.domains().withName('NonExistent')];
            
            // Assert
            expect(results.length).toBe(0);
        });
        
        test('can chain withName() multiple times', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
                Domain Finance { vision: "v" }
                Domain Inventory { vision: "v" }
            `);
            
            // Act
            const allResults = [
                ...[
                    ...query.domains().withName('Sales')
                ]
                    .concat([...query.domains().withName('Finance')])
            ];
            
            // Assert
            expect(allResults.length).toBe(2);
        });
    });
    
    describe('withFqn() - FQN-based Filtering', () => {
        
        test('filters items by fully qualified name', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Namespace acme.sales {
                    Domain Orders { vision: "v" }
                }
                Namespace acme.finance {
                    Domain Orders { vision: "v" }
                }
            `);
            
            // Act
            const results = [...query.domains().withFqn('acme.sales.Orders')];
            
            // Assert
            expect(results.length).toBe(1);
            expect(results[0].name).toBe('Orders');
        });
        
        test('returns empty when FQN not found', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
            `);
            
            // Act
            const results = [...query.domains().withFqn('NonExistent.Domain')];
            
            // Assert
            expect(results.length).toBe(0);
        });
    });
    
    describe('first() - Terminal Operation', () => {
        
        test('returns first item from iterator', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
                Domain Finance { vision: "v" }
                Domain Inventory { vision: "v" }
            `);
            
            // Act
            const first = query.domains().first();
            
            // Assert
            expect(first).toBeDefined();
            expect(first?.name).toBe('Sales');
        });
        
        test('returns undefined when iterator is empty', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
            `);
            
            // Act
            const result = query.domains().where(d => d.name === 'NonExistent').first();
            
            // Assert
            expect(result).toBeUndefined();
        });
        
        test('short-circuits iteration (lazy evaluation)', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain A { vision: "v" }
                Domain B { vision: "v" }
                Domain C { vision: "v" }
            `);
            let iterationCount = 0;
            
            // Act - Consume with first() after tracking iterations
            const builder = query.domains().where(() => {
                iterationCount++;
                return true;
            });
            builder.first();
            
            // Assert - Only iterated once despite 3 items available
            expect(iterationCount).toBe(1);
        });
        
        test('respects filter when finding first match', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
                Domain Finance { vision: "v" }
                Domain Inventory { vision: "v" }
            `);
            
            // Act
            const result = query.domains()
                .where(d => d.name.includes('n'))
                .first();
            
            // Assert
            expect(result?.name).toBe('Finance');
        });
    });
    
    describe('count() - Terminal Operation', () => {
        
        test('returns total count of items', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
                Domain Finance { vision: "v" }
                Domain Inventory { vision: "v" }
            `);
            
            // Act
            const count = query.domains().count();
            
            // Assert
            expect(count).toBe(3);
        });
        
        test('returns zero for empty result set', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
            `);
            
            // Act
            const count = query.domains().where(d => d.name === 'NonExistent').count();
            
            // Assert
            expect(count).toBe(0);
        });
        
        test('counts items after filtering', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain A { vision: "v" }
                Domain VeryLongName { vision: "v" }
                Domain B { vision: "v" }
                Domain LongNameDomain { vision: "v" }
            `);
            
            // Act
            const count = query.domains()
                .where(d => d.name.length > 6)
                .count();
            
            // Assert
            expect(count).toBe(2);
        });
    });
    
    describe('toArray() - Terminal Operation', () => {
        
        test('materializes iterator into array', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
                Domain Finance { vision: "v" }
            `);
            
            // Act
            const array = query.domains().toArray();
            
            // Assert
            expect(Array.isArray(array)).toBe(true);
            expect(array.length).toBe(2);
            expect(array[0].name).toBe('Sales');
            expect(array[1].name).toBe('Finance');
        });
        
        test('returns empty array when no results', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
            `);
            
            // Act
            const array = query.domains().where(d => d.name === 'NonExistent').toArray();
            
            // Assert
            expect(Array.isArray(array)).toBe(true);
            expect(array.length).toBe(0);
        });
        
        test('maintains item order in array', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Alpha { vision: "v" }
                Domain Beta { vision: "v" }
                Domain Gamma { vision: "v" }
            `);
            
            // Act
            const array = query.domains().toArray();
            
            // Assert
            expect(array.map(d => d.name)).toEqual(['Alpha', 'Beta', 'Gamma']);
        });
    });
    
    describe('Complex Filtering Chains', () => {
        
        test('combines where() with withName() filters', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain SalesOrders { vision: "v" }
                Domain FinanceOrders { vision: "v" }
                Domain Sales { vision: "v" }
            `);
            
            // Act
            const results = [
                ...query.domains()
                    .where(d => d.name.includes('Orders'))
                    .where(d => d.name.startsWith('Sales'))
            ];
            
            // Assert
            expect(results.length).toBe(1);
            expect(results[0].name).toBe('SalesOrders');
        });
    });
    
    describe('Lazy Evaluation Behavior', () => {
        
        test('QueryBuilder does not execute until consumed', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
                Domain Finance { vision: "v" }
            `);
            let executionCount = 0;
            
            // Act - Create builder with side-effect tracking
            const builder = query.domains().where(() => {
                executionCount++;
                return true;
            });
            
            // Assert - No execution yet
            expect(executionCount).toBe(0);
            
            // Act - Consume with count()
            const count = builder.count();
            
            // Assert - Now executed
            expect(executionCount).toBe(2);
            expect(count).toBe(2);
        });
    });
    
    describe('Edge Cases', () => {
        
        test('handles empty model gracefully', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Team SampleTeam
            `);
            
            // Act
            const results = [...query.domains()];
            
            // Assert
            expect(results.length).toBe(0);
        });
    });
});
