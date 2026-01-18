/**
 * Linking Tests
 * 
 * Tests cross-reference resolution and linking behavior across the grammar.
 * Covers domain references, team references, classification references,
 * and relationship link resolution.
 */

import { describe, test, beforeAll, expect } from 'vitest';
import type { TestServices } from '../test-helpers.js';
import { setupTestSuite, expectValidDocument, getFirstBoundedContext, s } from '../test-helpers.js';
import type { ContextMap, DomainMap, StructureElement, BoundedContext, Domain } from '../../src/generated/ast.js';
import { isContextMap, isDomainMap, isNamespaceDeclaration, isBoundedContext, isDomain } from '../../src/generated/ast.js';

let testServices: TestServices;

beforeAll(() => {
    testServices = setupTestSuite();
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function extractContextMaps(elements: StructureElement[]): ContextMap[] {
    const collected: ContextMap[] = [];
    for (const element of elements) {
        if (isContextMap(element)) {
            collected.push(element);
        } else if (isNamespaceDeclaration(element)) {
            collected.push(...extractContextMaps(element.children));
        }
    }
    return collected;
}

// ============================================================================
// CONTEXT MAP RELATIONSHIP LINKING
// ============================================================================

describe('ContextMap Relationship Linking', () => {
    test('should report unresolved references in ContextMap', async () => {
        // Arrange
        const input = s`
            ContextMap FaultyMap {
                PaymentBC <- OrdersBC
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const ctxMap = document.parseResult.value.children.find(isContextMap);
        expect(ctxMap).toBeDefined();
        if (!ctxMap) return;

        const rel = ctxMap.relationships[0];
        expect(ctxMap.relationships).toHaveLength(1);
        expect(rel.left.link?.ref).toBeUndefined();
        expect(rel.left.link?.error).toBeDefined();
        expect(rel.right.link?.ref).toBeUndefined();
        expect(rel.right.link?.error).toBeDefined();
    });

    test('should resolve references in ContextMap when present', async () => {
        // Arrange
        const input = s`
            Namespace TestNamespace {
                ContextMap CorrectMap {
                    OtherNamespace.PaymentBC <- OrdersBC
                }
                BoundedContext OrdersBC {}
            }
            Namespace OtherNamespace {
                BoundedContext PaymentBC {}
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const model = document.parseResult.value;
        const ctxMap = extractContextMaps(model.children)[0];
        expect(ctxMap).toBeDefined();
        if (!ctxMap) return;

        const rel = ctxMap.relationships[0];
        expect(ctxMap.relationships).toHaveLength(1);
        expect(rel.left.link?.ref).toBeDefined();
        expect(rel.left.link?.error).toBeUndefined();
        expect(rel.right.link?.ref).toBeDefined();
        expect(rel.right.link?.error).toBeUndefined();
    });

    test('should resolve all DDD pattern annotations', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            bc OrderContext for Sales
            bc PaymentContext for Sales
            
            ContextMap PatternMap {
                contains OrderContext, PaymentContext
                [OHS] OrderContext -> [CF] PaymentContext
                [ACL] PaymentContext <- [PL] OrderContext
                [SK] OrderContext <-> PaymentContext
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const ctxMap = document.parseResult.value.children.find(isContextMap) as ContextMap;
        expect(ctxMap.relationships).toHaveLength(3);
        
        ctxMap.relationships.forEach(rel => {
            expect(rel.left.link?.ref).toBeDefined();
            expect(rel.right.link?.ref).toBeDefined();
        });
    });

    test('should resolve relationship type annotations', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            bc OrderContext for Sales
            bc PaymentContext for Sales
            
            ContextMap TypedMap {
                contains OrderContext, PaymentContext
                OrderContext -> PaymentContext : Partnership
                OrderContext <- PaymentContext : SharedKernel
                OrderContext <-> PaymentContext : CustomerSupplier
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const ctxMap = document.parseResult.value.children.find(isContextMap) as ContextMap;
        expect(ctxMap.relationships).toHaveLength(3);
        expect(ctxMap.relationships[0].type).toBe('Partnership');
        expect(ctxMap.relationships[1].type).toBe('SharedKernel');
        expect(ctxMap.relationships[2].type).toBe('CustomerSupplier');
    });
});

// ============================================================================
// DOMAIN REFERENCE LINKING
// ============================================================================

describe('Domain Reference Linking', () => {
    test('should resolve domain reference in bounded context', async () => {
        // Arrange
        const input = s`
            Domain Sales {
                vision: "Sales domain"
            }
            
            BoundedContext OrderContext for Sales
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        expect(bc.domain?.ref).toBeDefined();
        expect(bc.domain?.ref?.name).toBe('Sales');
    });

    test('should resolve parent domain in subdomain hierarchy', async () => {
        // Arrange
        const input = s`
            Domain Commerce {
                vision: "Root commerce domain"
            }
            
            Domain Sales in Commerce {
                vision: "Sales subdomain"
            }
            
            Domain RetailSales in Sales {
                vision: "Retail sales subdomain"
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const model = document.parseResult.value;
        const salesDomain = model.children.find(n => isDomain(n) && n.name === 'Sales') as Domain;
        const retailDomain = model.children.find(n => isDomain(n) && n.name === 'RetailSales') as Domain;

        expect(salesDomain.parent?.ref?.name).toBe('Commerce');
        expect(retailDomain.parent?.ref?.name).toBe('Sales');
    });

    test('should handle forward references', async () => {
        // Arrange
        const input = s`
            BoundedContext OrderContext for Sales {
                description: "References domain defined later"
            }
            
            Domain Sales {
                vision: "Defined after BC"
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        expect(bc.domain?.ref).toBeDefined();
        expect(bc.domain?.ref?.name).toBe('Sales');
    });

    test('should report unresolved domain reference', async () => {
        // Arrange
        const input = s`
            BoundedContext OrderContext for NonExistentDomain
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        expect(bc.domain?.ref).toBeUndefined();
        expect(bc.domain?.error).toBeDefined();
    });
});

// ============================================================================
// TEAM REFERENCE LINKING
// ============================================================================

describe('Team Reference Linking', () => {
    test('should resolve team reference in BC inline syntax', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            Team SalesTeam
            
            bc OrderContext for Sales by SalesTeam
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        expect(bc.team?.[0]?.ref).toBeDefined();
        expect(bc.team?.[0]?.ref?.name).toBe('SalesTeam');
    });

    test('should resolve team reference in BC documentation block', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            Team ProductTeam
            
            BoundedContext OrderContext for Sales {
                team: ProductTeam
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const team = bc.team?.[0];
        expect(team?.ref?.name).toBe('ProductTeam');
    });

    test('should resolve qualified team reference', async () => {
        // Arrange
        const input = s`
            Namespace company.teams {
                Team EngineeringTeam
            }
            
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                team: company.teams.EngineeringTeam
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const team = bc.team?.[0];
        expect(team?.ref?.name).toBe('EngineeringTeam');
    });
});

// ============================================================================
// CLASSIFICATION REFERENCE LINKING
// ============================================================================

describe('Classification Reference Linking', () => {
    test('should resolve classification reference in BC inline syntax', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            Classification Core
            
            bc OrderContext for Sales as Core
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        expect(bc.classification?.[0]?.ref).toBeDefined();
        expect(bc.classification?.[0]?.ref?.name).toBe('Core');
    });

    test('should resolve type in domain type block', async () => {
        // Arrange
        const input = s`
            Classification Strategic
            
            Domain Sales {
                vision: "Core sales"
                type: Strategic
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const model = document.parseResult.value;
        const domain = model.children.find(c => c.$type === 'Domain') as any;
        expect(domain.type?.ref?.name).toBe('Strategic');
    });

    test('should resolve classification in decision bracket syntax', async () => {
        // Arrange
        const input = s`
            Classification Architectural
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                decisions {
                    decision [Architectural] UseEvents: "Use event sourcing"
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const decisions = bc.decisions ?? [];
        expect(decisions[0]?.classification?.ref?.name).toBe('Architectural');
    });

    test('should resolve qualified classification reference', async () => {
        // Arrange
        const input = s`
            Namespace governance {
                Classification Technical
            }
            
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                decisions {
                    decision [governance.Technical] Database: "Use PostgreSQL"
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const decisions = bc.decisions ?? [];
        expect(decisions[0]?.classification?.ref?.name).toBe('Technical');
    });
});

// ============================================================================
// DOMAIN MAP LINKING
// ============================================================================

describe('DomainMap Linking', () => {
    test('should resolve domain references in DomainMap', async () => {
        // Arrange
        const input = s`
            Domain Sales {
                vision: "Sales domain"
            }
            Domain Marketing {
                vision: "Marketing domain"
            }
            
            DomainMap BusinessDomains {
                contains Sales, Marketing
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const domainMap = document.parseResult.value.children.find(isDomainMap) as DomainMap;
        expect(domainMap).toBeDefined();
        expect(domainMap.domains).toHaveLength(2);
        
        const domainNames = domainMap.domains.map(d => d.items[0]?.ref?.name).sort();
        expect(domainNames).toEqual(['Marketing', 'Sales']);
    });

    test('should resolve qualified domain references in DomainMap', async () => {
        // Arrange
        const input = s`
            Namespace company {
                Domain Sales {
                    vision: "Company sales"
                }
            }
            
            DomainMap Portfolio {
                contains company.Sales
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const domainMap = document.parseResult.value.children.find(isDomainMap) as DomainMap;
        expect(domainMap.domains[0].items[0]?.ref?.name).toBe('Sales');
    });

    test('should handle unresolved domain references in DomainMap', async () => {
        // Arrange
        const input = s`
            DomainMap EmptyMap {
                contains NonExistentDomain
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const domainMap = document.parseResult.value.children.find(isDomainMap) as DomainMap;
        expect(domainMap.domains[0].items[0]?.ref).toBeUndefined();
    });
});

// ============================================================================
// THIS REFERENCE IN RELATIONSHIPS
// ============================================================================

describe('This Reference Linking', () => {
    test('should resolve this reference in BC relationships block', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BoundedContext OrderContext for Sales
            BoundedContext PaymentContext for Sales
            
            BoundedContext OrderContext for Sales {
                description: "Self-referencing context"
                relationships {
                    [OHS] this -> [CF] PaymentContext
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bcs = document.parseResult.value.children.filter(isBoundedContext) as BoundedContext[];
        const bcWithRelationships = bcs.find(bc => bc.relationships.length > 0);
        
        expect(bcWithRelationships).toBeDefined();
        if (bcWithRelationships) {
            const rel = bcWithRelationships.relationships[0];
            // 'this' is represented by ThisRef type, not a link
            expect(rel.left.$type).toBe('ThisRef');
            expect(rel.right.link?.ref?.name).toBe('PaymentContext');
        }
    });
});

// ============================================================================
// COMPLEX LINKING SCENARIOS
// ============================================================================

describe('Complex Linking Scenarios', () => {
    test('should resolve cross-Namespace references', async () => {
        // Arrange
        const input = s`
            Namespace sales {
                Domain Sales {
                    vision: "Sales domain"
                }
                Team SalesTeam
            }
            
            Namespace billing {
                Domain Billing {
                    vision: "Billing domain"
                }
                
                BoundedContext PaymentContext for Billing {
                    team: sales.SalesTeam
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        // Verify cross-Namespace team reference resolved
        const billingNs = document.parseResult.value.children.find(
            c => isNamespaceDeclaration(c) && c.name === 'billing'
        ) as any;
        const paymentBC = billingNs?.children.find(isBoundedContext) as BoundedContext;
        const team = paymentBC?.team?.[0];
        expect(team?.ref?.name).toBe('SalesTeam');
    });

    test('should resolve nested Namespace qualified names', async () => {
        // Arrange
        const input = s`
            Namespace com.company {
                Namespace sales {
                    Domain Sales {
                        vision: "Nested sales domain"
                    }
                }
            }
            
            BoundedContext OrderContext for com.company.sales.Sales
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        expect(bc.domain?.ref?.name).toBe('Sales');
    });
})
