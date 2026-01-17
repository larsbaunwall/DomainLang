/**
 * SDK BcQueryBuilder Tests
 * 
 * Comprehensive tests for BcQueryBuilder specialized filtering methods
 * (inDomain, withTeam, withMetadata) and combinations.
 */

import { describe, test, expect } from 'vitest';
import { loadModelFromText } from '../../src/sdk/loader.js';

describe('SDK BcQueryBuilder', () => {
    
    describe('inDomain() - Domain-based Filtering', () => {
        
        test('filters bounded contexts by domain reference', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
                Domain Finance { vision: "v" }
                bc OrderContext for Sales
                bc ShippingContext for Sales
                bc PaymentContext for Finance
            `);
            
            // Act
            const salesContexts = [...query.boundedContexts().inDomain('Sales')];
            
            // Assert
            expect(salesContexts.length).toBe(2);
            expect(salesContexts.map(bc => bc.name)).toEqual(expect.arrayContaining(['OrderContext', 'ShippingContext']));
        });
        
        test('returns empty when domain has no bounded contexts', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
                Domain Finance { vision: "v" }
                bc OrderContext for Sales
            `);
            
            // Act
            const financeContexts = [...query.boundedContexts().inDomain('Finance')];
            
            // Assert
            expect(financeContexts.length).toBe(0);
        });
    });
    
    describe('withTeam() - Team-based Filtering', () => {
        
        test('filters bounded contexts by responsible team', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Team SalesTeam
                Team FinanceTeam
                Domain Sales { vision: "v" }
                bc OrderContext for Sales by SalesTeam
                bc ShippingContext for Sales by SalesTeam
                bc PaymentContext for Sales by FinanceTeam
            `);
            
            // Act
            const salesTeamContexts = [...query.boundedContexts().withTeam('SalesTeam')];
            
            // Assert
            expect(salesTeamContexts.length).toBe(2);
            expect(salesTeamContexts.map(bc => bc.name)).toEqual(expect.arrayContaining(['OrderContext', 'ShippingContext']));
        });
        
        test('returns empty when team has no bounded contexts', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Team SalesTeam
                Team UnusedTeam
                Domain Sales { vision: "v" }
                bc OrderContext for Sales by SalesTeam
            `);
            
            // Act
            const results = [...query.boundedContexts().withTeam('UnusedTeam')];
            
            // Assert
            expect(results.length).toBe(0);
        });
    });
    
    describe('withMetadata() - Metadata-based Filtering', () => {
        
        test('filters bounded contexts by metadata key presence', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Metadata tier
                Metadata sla
                Domain Sales { vision: "v" }
                bc OrderContext for Sales {
                    metadata {
                        tier: "critical"
                        sla: "99.9%"
                    }
                }
                bc ShippingContext for Sales {
                    metadata {
                        tier: "important"
                    }
                }
                bc NotificationContext for Sales
            `);
            
            // Act
            const contextsWithSla = [...query.boundedContexts().withMetadata('sla')];
            const contextsWithTier = [...query.boundedContexts().withMetadata('tier')];
            
            // Assert
            expect(contextsWithSla.length).toBe(1);
            expect(contextsWithSla[0].name).toBe('OrderContext');
            expect(contextsWithTier.length).toBe(2);
        });
        
        test('returns empty when metadata key not found', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
                bc OrderContext for Sales {
                    metadata {
                        tier: "critical"
                    }
                }
            `);
            
            // Act
            const results = [...query.boundedContexts().withMetadata('nonexistent')];
            
            // Assert
            expect(results.length).toBe(0);
        });
    });
    
    describe('Chained BcQueryBuilder Filters', () => {
        
        test('combines inDomain() with withTeam()', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Team SalesTeam
                Team FinanceTeam
                Domain Sales { vision: "v" }
                Domain Finance { vision: "v" }
                bc OrderContext for Sales by SalesTeam
                bc ShippingContext for Sales by SalesTeam
                bc PaymentContext for Sales by FinanceTeam
                bc ReportingContext for Finance by FinanceTeam
            `);
            
            // Act
            const results = [
                ...query.boundedContexts()
                    .inDomain('Sales')
                    .withTeam('SalesTeam')
            ];
            
            // Assert
            expect(results.length).toBe(2);
            expect(results.map(bc => bc.name)).toEqual(expect.arrayContaining(['OrderContext', 'ShippingContext']));
        });
    });
    
    describe('BcQueryBuilder with Generic QueryBuilder Methods', () => {
        
        test('BcQueryBuilder supports where() filtering', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
                bc OrderContext for Sales
                bc ShippingContext for Sales
                bc PaymentContext for Sales
            `);
            
            // Act
            const results = [
                ...query.boundedContexts()
                    .where(bc => bc.name.includes('ing'))
            ];
            
            // Assert
            expect(results.length).toBe(1);
            expect(results[0].name).toBe('ShippingContext');
        });
        
        test('BcQueryBuilder supports withName() filtering', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
                bc OrderContext for Sales
                bc ShippingContext for Sales
            `);
            
            // Act
            const result = query.boundedContexts().withName('OrderContext').first();
            
            // Assert
            expect(result?.name).toBe('OrderContext');
        });
        
        test('BcQueryBuilder supports first() terminal operation', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Team SalesTeam
                Domain Sales { vision: "v" }
                bc OrderContext for Sales by SalesTeam
                bc ShippingContext for Sales by SalesTeam
            `);
            
            // Act
            const result = query.boundedContexts().withTeam('SalesTeam').first();
            
            // Assert
            expect(result?.name).toBe('OrderContext');
        });
        
        test('BcQueryBuilder supports count() terminal operation', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Team SalesTeam
                Domain Sales { vision: "v" }
                bc OrderContext for Sales by SalesTeam
                bc ShippingContext for Sales by SalesTeam
                bc PaymentContext for Sales
            `);
            
            // Act
            const count = query.boundedContexts().withTeam('SalesTeam').count();
            
            // Assert
            expect(count).toBe(2);
        });
    });
    
    describe('Edge Cases', () => {
        
        test('handles missing domain in filter gracefully', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
                bc OrderContext for Sales
            `);
            
            // Act
            const results = [...query.boundedContexts().inDomain('NonExistent')];
            
            // Assert
            expect(results.length).toBe(0);
        });
        
        test('handles missing team in filter gracefully', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Team SalesTeam
                Domain Sales { vision: "v" }
                bc OrderContext for Sales by SalesTeam
            `);
            
            // Act
            const results = [...query.boundedContexts().withTeam('NonExistent')];
            
            // Assert
            expect(results.length).toBe(0);
        });
        
        test('returns empty when metadata key not found', async () => {
            // Arrange
            const { query } = await loadModelFromText(`
                Domain Sales { vision: "v" }
                bc OrderContext for Sales
                bc ShippingContext for Sales
            `);
            
            // Act
            const results = [...query.boundedContexts().withMetadata('NonExistent')];
            
            // Assert
            expect(results.length).toBe(0);
        });
    });
});
