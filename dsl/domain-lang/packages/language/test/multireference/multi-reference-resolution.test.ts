import { describe, test, expect, beforeAll } from 'vitest';
import type { TestServices } from '../test-helpers.js';
import { setupTestSuite, expectValidDocument, s } from '../test-helpers.js';
import type { BoundedContext, ContextMap, DomainMap } from '../../src/generated/ast.js';
import { isBoundedContext, isContextMap, isDomainMap } from '../../src/generated/ast.js';

describe('Multi-Target References', () => {
    let testServices: TestServices;

    beforeAll(() => {
        testServices = setupTestSuite();
    });

    test('BoundedContext belongs to single domain (DDD compliance)', async () => {
        // Arrange
        const input = s`
            Domain Sales {
                description: "Sales operations"
            }
            
            Domain Marketing {
                description: "Marketing operations"
            }
            
            // BC belongs to exactly ONE domain per DDD principles
            BC CustomerExperience for Sales {
                description: "Sales experience"
            }
    `;

    // Act
        const document = await testServices.parse(input);
    expectValidDocument(document);
        const model = document.parseResult.value;
    const bc = model.children.find(c => isBoundedContext(c) && c.name === 'CustomerExperience') as BoundedContext;

    // Assert
        expect(bc).toBeDefined();
        expect(bc.domain).toBeDefined();
        // Single reference - a BC can only belong to ONE domain
        expect(bc.domain!.ref?.name).toBe('Sales');
    });

    test('ContextMap can reference multiple BoundedContexts with same name from different files', async () => {
        const input = `
            Domain Sales {}
            Domain Billing {}
            
            BC Orders for Sales {
                description: "Sales orders"
            }
            
            BC Orders for Billing {
                description: "Billing orders"  
            }
            
            ContextMap AllOrders {
                contains Orders
            }
        `;

        const document = await testServices.parse(input);
            expectValidDocument(document);

        const model = document.parseResult.value;
        const contextMap = model.children.find(c => isContextMap(c) && c.name === 'AllOrders') as ContextMap;

        expect(contextMap).toBeDefined();
        expect(contextMap.boundedContexts).toBeDefined();
        expect(contextMap.boundedContexts.length).toBe(1);
        
        // Single reference that resolves to multiple targets with the same name
        const ordersRef = contextMap.boundedContexts[0];
        expect(ordersRef.items.length).toBe(2);
        expect(ordersRef.items.every((item) => item.ref?.name === 'Orders')).toBe(true);
    });

    test('DomainMap references each domain once via MultiReference', async () => {
        const input = `
            Domain Sales {
                description: "Sales domain"
            }
            
            Domain Marketing {
                description: "Marketing domain"
            }
            
            Domain Support {
                description: "Support domain"
            }
            
            DomainMap CorporatePortfolio {
                contains Sales, Marketing, Support
            }
        `;

        const document = await testServices.parse(input);
            expectValidDocument(document);

        const model = document.parseResult.value;
        const domainMap = model.children.find(c => isDomainMap(c) && c.name === 'CorporatePortfolio') as DomainMap;

        expect(domainMap).toBeDefined();
        // Three separate multi-references, each with 1 item
        expect(domainMap.domains.length).toBe(3);
        
        const domainNames = domainMap.domains.map((d) => 
            d.items[0]?.ref?.name
        ).filter(Boolean).sort();
        
        expect(domainNames).toEqual(['Marketing', 'Sales', 'Support']);
    });

    test('ContextMap references each BoundedContext via MultiReference', async () => {
        const input = `
            Domain Sales {}
            
            BC Orders for Sales {
                description: "Order management"
            }
            
            BC Pricing for Sales {
                description: "Pricing engine"
            }
            
            BC Catalog for Sales {
                description: "Product catalog"
            }
            
            ContextMap CoreSystems {
                contains Orders, Pricing, Catalog
            }
        `;

        const document = await testServices.parse(input);
            expectValidDocument(document);

        const model = document.parseResult.value;
        const contextMap = model.children.find(c => isContextMap(c) && c.name === 'CoreSystems') as ContextMap;

        expect(contextMap).toBeDefined();
        // Three separate multi-references
        expect(contextMap.boundedContexts.length).toBe(3);
        
        const contextNames = contextMap.boundedContexts.map((c) => 
            c.items[0]?.ref?.name
        ).filter(Boolean).sort();
        
        expect(contextNames).toEqual(['Catalog', 'Orders', 'Pricing']);
    });

    // MultiReference resolution: missing targets are simply left without a ref; existing targets still resolve
    test('MultiReference resolves existing targets even when some are missing', async () => {
        const input = `
            Domain Sales {}
            
            BC Orders for Sales {}
            
            ContextMap PortfolioContexts {
                contains Orders, __MissingBC__
            }
        `;

        const document = await testServices.parse(input);
        const model = document.parseResult.value;
        const contextMap = model.children.find(c => isContextMap(c) && c.name === 'PortfolioContexts') as ContextMap;
        expect(contextMap).toBeDefined();
        expect(contextMap.boundedContexts.length).toBe(2);

        const items = contextMap.boundedContexts.flatMap(d => d.items);
        const resolved = items.filter(i => i.ref?.name).map(i => i.ref!.name).sort();

        // At least one resolves to Orders; all resolved names are Orders
        expect(resolved.length).toBeGreaterThan(0);
        const unique = Array.from(new Set(resolved));
        expect(unique).toEqual(['Orders']);
    });

    // TODO: Namespace scoping not fully supported with EmptyFileSystem in tests.
    // Acceptance criteria to unskip:
    //  - ScopeProvider supports qualified name resolution across namespaces for MultiReference
    //  - Workspace fixture or virtual FS provides namespace-aware symbol exposure
    test.skip('MultiReference works with qualified names in namespaces', async () => {
        const input = `
            namespace acme.sales {
                Domain Sales {}
                BC Orders for Sales {}
            }
            
            namespace acme.marketing {
                Domain Marketing {}
                BC Campaigns for Marketing {}
            }
            
            ContextMap Corporate {
                contains acme.sales.Orders, acme.marketing.Campaigns
            }
        `;

        const document = await testServices.parse(input);
            expectValidDocument(document);

        const model = document.parseResult.value;
        const contextMap = model.children.find(c => isContextMap(c) && c.name === 'Corporate') as ContextMap;

        expect(contextMap).toBeDefined();
        // Two separate multi-references
        expect(contextMap.boundedContexts.length).toBe(2);
        
        const bcNames = contextMap.boundedContexts.map((bc) => 
            bc.items[0]?.ref?.name
        ).filter(Boolean).sort();
        
        expect(bcNames).toEqual(['Campaigns', 'Orders']);
    });

    test('MultiReference allows partial definitions across contexts', async () => {
        const input = `
            Domain Sales {}
            Domain CRM {}
            
            // Same BC name, but for different domains (like partial definitions from different files)
            BC CustomerManagement for Sales {
                description: "Sales perspective on customers"
            }
            
            BC CustomerManagement for CRM {
                description: "CRM perspective on customers"
            }
            
            ContextMap CustomerServices {
                contains CustomerManagement
            }
        `;

        const document = await testServices.parse(input);
            expectValidDocument(document);

        const model = document.parseResult.value;
        const contextMap = model.children.find(c => isContextMap(c) && c.name === 'CustomerServices') as ContextMap;

        expect(contextMap).toBeDefined();
        expect(contextMap.boundedContexts.length).toBe(1);
        
        // Single reference resolves to both BC definitions
        const customerMgmtRef = contextMap.boundedContexts[0];
        expect(customerMgmtRef.items.length).toBe(2);
        expect(customerMgmtRef.items.every((item: any) => item.ref?.name === 'CustomerManagement')).toBe(true);
    });
});

