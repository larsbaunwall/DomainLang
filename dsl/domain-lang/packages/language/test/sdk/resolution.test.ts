/**
 * SDK Resolution Functions Tests
 * 
 * Comprehensive tests for property resolution with precedence rules.
 * Validates correct property extraction from AST nodes.
 */

import { describe, test, expect } from 'vitest';
import { loadModelFromText } from '../../src/sdk/loader.js';
import {
    resolveBcDescription,
    resolveBcRole,
    resolveBcTeam,
    resolveBcMetadata,
    resolveDomainDescription,
    resolveDomainVision,
    resolveDomainClassification
} from '../../src/sdk/resolution.js';
import type { BoundedContext, Domain } from '../../src/generated/ast.js';

describe('SDK Resolution Functions', () => {
    
    describe('resolveBcDescription()', () => {
        
        test('resolves description from documentation block', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
                bc OrderContext for Sales {
                    description: "Manages orders"
                }
            `);
            
            // Act
            const bc = query.bc('OrderContext') as BoundedContext;
            const resolved = resolveBcDescription(bc);
            
            // Assert
            expect(resolved).toBe('Manages orders');
        });
        
        test('returns undefined when no description provided', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
                bc OrderContext for Sales
            `);
            
            // Act
            const bc = query.bc('OrderContext') as BoundedContext;
            const resolved = resolveBcDescription(bc);
            
            // Assert
            expect(resolved).toBeUndefined();
        });
        
        test('handles multiple documentation blocks by returning first description', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
                bc OrderContext for Sales {
                    description: "first description"
                    terminology {
                        term Order: "an order"
                    }
                }
            `);
            
            // Act
            const bc = query.bc('OrderContext') as BoundedContext;
            const resolved = resolveBcDescription(bc);
            
            // Assert
            expect(resolved).toBe('first description');
        });
    });
    
    describe('resolveBcRole()', () => {
        
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
            expect(resolveBcRole(orderBc)?.name).toBe('Core');
            expect(resolveBcRole(shippingBc)?.name).toBe('Supporting');
        });
        
        test('returns undefined when role not specified', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
                bc OrderContext for Sales
            `);
            
            // Act
            const bc = query.bc('OrderContext') as BoundedContext;
            const resolved = resolveBcRole(bc);
            
            // Assert
            expect(resolved).toBeUndefined();
        });
    });
    
    describe('resolveBcTeam()', () => {
        
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
            expect(resolveBcTeam(orderBc)?.name).toBe('SalesTeam');
            expect(resolveBcTeam(paymentBc)?.name).toBe('PaymentTeam');
        });
        
        test('returns undefined when team not assigned', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
                bc OrderContext for Sales
            `);
            
            // Act
            const bc = query.bc('OrderContext') as BoundedContext;
            const resolved = resolveBcTeam(bc);
            
            // Assert
            expect(resolved).toBeUndefined();
        });
    });
    
    describe('resolveBcMetadata()', () => {
        
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
            const metadata = resolveBcMetadata(bc);
            
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
            const metadata = resolveBcMetadata(bc);
            
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
            const metadata = resolveBcMetadata(bc);
            
            // Assert
            expect(metadata.size).toBe(0);
        });
    });
    
    describe('resolveDomainDescription()', () => {
        
        test('resolves domain description from documentation block', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales {
                    description: "Manages sales operations"
                    vision: "v"
                }
            `);
            
            // Act
            const domain = query.domain('Sales') as Domain;
            const resolved = resolveDomainDescription(domain);
            
            // Assert
            expect(resolved).toBe('Manages sales operations');
        });
        
        test('returns undefined when no description', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
            `);
            
            // Act
            const domain = query.domain('Sales') as Domain;
            const resolved = resolveDomainDescription(domain);
            
            // Assert
            expect(resolved).toBeUndefined();
        });
    });
    
    describe('resolveDomainVision()', () => {
        
        test('resolves domain vision statement', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales {
                    vision: "Provide world-class sales capabilities"
                }
            `);
            
            // Act
            const domain = query.domain('Sales') as Domain;
            const resolved = resolveDomainVision(domain);
            
            // Assert
            expect(resolved).toBe('Provide world-class sales capabilities');
        });
        
        test('returns undefined when vision not specified', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { }
            `);
            
            // Act
            const domain = query.domain('Sales') as Domain;
            const resolved = resolveDomainVision(domain);
            
            // Assert
            expect(resolved).toBeUndefined();
        });
        
        test('handles empty vision string', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "" }
            `);
            
            // Act
            const domain = query.domain('Sales') as Domain;
            const resolved = resolveDomainVision(domain);
            
            // Assert
            expect(resolved).toBe('');
        });
    });
    
    describe('resolveDomainClassification()', () => {
        
        test('resolves domain classification', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Classification Core
                Classification Supporting
                Domain Sales {
                    vision: "v"
                    classification: Core
                }
                Domain Inventory {
                    vision: "v"
                    classification: Supporting
                }
            `);
            
            // Act
            const salesDomain = query.domain('Sales') as Domain;
            const inventoryDomain = query.domain('Inventory') as Domain;
            
            // Assert
            expect(resolveDomainClassification(salesDomain)?.name).toBe('Core');
            expect(resolveDomainClassification(inventoryDomain)?.name).toBe('Supporting');
        });
        
        test('returns undefined when classification not specified', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
            `);
            
            // Act
            const domain = query.domain('Sales') as Domain;
            const resolved = resolveDomainClassification(domain);
            
            // Assert
            expect(resolved).toBeUndefined();
        });
    });
    
    describe('Resolution with Various Node Structures', () => {
        
        test('resolves from deeply nested documentation blocks', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
                bc OrderContext for Sales {
                    description: "main description"
                    terminology {
                        term Order: "document"
                    }
                }
            `);
            
            // Act
            const bc = query.bc('OrderContext') as BoundedContext;
            const resolved = resolveBcDescription(bc);
            
            // Assert
            expect(resolved).toBe('main description');
        });
        
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
            const metadata = resolveBcMetadata(bc);
            
            // Assert
            expect(metadata.get('pattern')).toBe('[a-zA-Z0-9_]*');
        });
    });
    
    describe('Edge Cases and Error Conditions', () => {
        
        test('handles missing referenced classification gracefully', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Classification Core
                Domain Sales {
                    vision: "v"
                }
            `);
            
            // Act
            const domain = query.domain('Sales') as Domain;
            const resolved = resolveDomainClassification(domain);
            
            // Assert
            expect(resolved).toBeUndefined();
        });
        
        test('handles domain without any documentation blocks', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { }
            `);
            
            // Act
            const domain = query.domain('Sales') as Domain;
            
            // Assert
            expect(resolveDomainDescription(domain)).toBeUndefined();
            expect(resolveDomainVision(domain)).toBeUndefined();
            expect(resolveDomainClassification(domain)).toBeUndefined();
        });
    });
});
