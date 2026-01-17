/**
 * SDK Resolution Functions Tests
 * 
 * Tests for property resolution functions that provide value beyond direct AST access.
 * Only tests functions with precedence logic or data transformation:
 * - effectiveRole: Array-based precedence (header inline → body)
 * - effectiveTeam: Array-based precedence (header inline → body)
 * - metadataAsMap: Array to Map conversion
 * 
 * Direct AST properties (no resolution needed) are tested in AST augmentation tests.
 */

import { describe, test, expect } from 'vitest';
import { loadModelFromText } from '../../src/sdk/loader.js';
import {
    effectiveRole,
    effectiveTeam,
    metadataAsMap,
} from '../../src/sdk/resolution.js';
import type { BoundedContext, Domain } from '../../src/generated/ast.js';

describe('SDK Resolution Functions', () => {
    
    describe('Direct AST Properties (no resolution needed)', () => {
        
        test('bc.description is a direct property', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
                bc OrderContext for Sales {
                    description: "Manages orders"
                }
            `);
            
            // Act
            const bc = query.bc('OrderContext') as BoundedContext;
            
            // Assert - direct property access, no resolution function needed
            expect(bc.description).toBe('Manages orders');
        });
        
        test('bc.businessModel is a direct reference', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Classification Commercial
                Domain Sales { vision: "v" }
                bc OrderContext for Sales {
                    businessModel: Commercial
                }
            `);
            
            // Act
            const bc = query.bc('OrderContext') as BoundedContext;
            
            // Assert - direct reference access
            expect(bc.businessModel?.ref?.name).toBe('Commercial');
        });
        
        test('bc.lifecycle is a direct reference', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Classification Active
                Domain Sales { vision: "v" }
                bc OrderContext for Sales {
                    lifecycle: Active
                }
            `);
            
            // Act
            const bc = query.bc('OrderContext') as BoundedContext;
            
            // Assert - direct reference access
            expect(bc.lifecycle?.ref?.name).toBe('Active');
        });
        
        test('domain.description is a direct property', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales {
                    description: "Sales domain"
                    vision: "v"
                }
            `);
            
            // Act
            const domain = query.domain('Sales') as Domain;
            
            // Assert - direct property access
            expect(domain.description).toBe('Sales domain');
        });
        
        test('domain.vision is a direct property', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "Handle sales" }
            `);
            
            // Act
            const domain = query.domain('Sales') as Domain;
            
            // Assert - direct property access
            expect(domain.vision).toBe('Handle sales');
        });
        
        test('domain.classification is a direct reference', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Classification Core
                Domain Sales {
                    vision: "v"
                    classification: Core
                }
            `);
            
            // Act
            const domain = query.domain('Sales') as Domain;
            
            // Assert - direct reference access
            expect(domain.classification?.ref?.name).toBe('Core');
        });
    });
    
    describe('effectiveRole()', () => {
        
        test('resolves bounded context role from header', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Classification Core
                Classification Supporting
                Domain Sales { vision: "v" }
                bc OrderContext for Sales as Core
                bc ShippingContext for Sales as Supporting
            `);
            
            // Act
            const orderBc = query.bc('OrderContext') as BoundedContext;
            const shippingBc = query.bc('ShippingContext') as BoundedContext;
            
            // Assert
            expect(effectiveRole(orderBc)?.name).toBe('Core');
            expect(effectiveRole(shippingBc)?.name).toBe('Supporting');
        });
        
        test('returns undefined when role not specified', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
                bc OrderContext for Sales
            `);
            
            // Act
            const bc = query.bc('OrderContext') as BoundedContext;
            const resolved = effectiveRole(bc);
            
            // Assert
            expect(resolved).toBeUndefined();
        });
    });
    
    describe('effectiveTeam()', () => {
        
        test('resolves responsible team from header', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Team SalesTeam
                Team PaymentTeam
                Domain Sales { vision: "v" }
                bc OrderContext for Sales by SalesTeam
                bc PaymentContext for Sales by PaymentTeam
            `);
            
            // Act
            const orderBc = query.bc('OrderContext') as BoundedContext;
            const paymentBc = query.bc('PaymentContext') as BoundedContext;
            
            // Assert
            expect(effectiveTeam(orderBc)?.name).toBe('SalesTeam');
            expect(effectiveTeam(paymentBc)?.name).toBe('PaymentTeam');
        });
        
        test('returns undefined when team not assigned', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
                bc OrderContext for Sales
            `);
            
            // Act
            const bc = query.bc('OrderContext') as BoundedContext;
            const resolved = effectiveTeam(bc);
            
            // Assert
            expect(resolved).toBeUndefined();
        });
    });
    
    describe('metadataAsMap()', () => {
        
        test('resolves metadata key-value pairs', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Metadata tier
                Metadata sla
                Metadata region
                Domain Sales { vision: "v" }
                bc OrderContext for Sales {
                    metadata {
                        tier: "critical"
                        sla: "99.99%"
                        region: "us-east-1"
                    }
                }
            `);
            
            // Act
            const bc = query.bc('OrderContext') as BoundedContext;
            const metadata = metadataAsMap(bc);
            
            // Assert
            expect(metadata.get('tier')).toBe('critical');
            expect(metadata.get('sla')).toBe('99.99%');
            expect(metadata.get('region')).toBe('us-east-1');
        });
        
        test('returns empty map when no metadata block', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
                bc OrderContext for Sales
            `);
            
            // Act
            const bc = query.bc('OrderContext') as BoundedContext;
            const metadata = metadataAsMap(bc);
            
            // Assert
            expect(metadata.size).toBe(0);
        });
        
        test('returns empty map when metadata block is empty', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
                bc OrderContext for Sales {
                    metadata { }
                }
            `);
            
            // Act
            const bc = query.bc('OrderContext') as BoundedContext;
            const metadata = metadataAsMap(bc);
            
            // Assert
            expect(metadata.size).toBe(0);
        });
    });
    
    describe('Metadata with Various Node Structures', () => {
        
        test('resolves metadata with special characters in values', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Metadata pattern
                Domain Sales { vision: "v" }
                bc OrderContext for Sales {
                    metadata {
                        pattern: "[a-zA-Z0-9_]*"
                    }
                }
            `);
            
            // Act
            const bc = query.bc('OrderContext') as BoundedContext;
            const metadata = metadataAsMap(bc);
            
            // Assert
            expect(metadata.get('pattern')).toBe('[a-zA-Z0-9_]*');
        });
        
        test('handles bc without metadata', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
                bc OrderContext for Sales {
                    description: "test"
                }
            `);
            
            // Act
            const bc = query.bc('OrderContext') as BoundedContext;
            const metadata = metadataAsMap(bc);
            
            // Assert
            expect(metadata.size).toBe(0);
        });
    });
});
