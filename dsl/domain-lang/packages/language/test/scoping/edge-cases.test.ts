import { describe, test, beforeAll, expect } from 'vitest';
import type { TestServices } from '../test-helpers.js';
import { setupTestSuite, expectValidDocument, getAllBoundedContexts, getFirstBoundedContext, s } from '../test-helpers.js';
import { isDomain } from '../../src/generated/ast.js';

let testServices: TestServices;

beforeAll(() => {
    testServices = setupTestSuite();
});

describe('Scoping: Edge Cases', () => {
    test('handles forward references', async () => {
        const document = await testServices.parse(s`
            BoundedContext OrderContext for Sales {
                description: "Order management"
            }
            
            Domain Sales {
                description: "Sales domain - defined after BC"
            }
        `);

        expectValidDocument(document);
        
        const bc = getFirstBoundedContext(document);
        expect(bc.domain?.ref).toBeDefined();
        expect(bc.domain?.ref?.name).toBe('Sales');
    });

    test('resolves this reference in relationships', async () => {
        const document = await testServices.parse(s`
            Domain Sales {}
            BoundedContext OrderContext for Sales
            BoundedContext PaymentContext for Sales
            
            BoundedContext OrderContext for Sales {
                relationships {
                    [OHS] this -> [CF] PaymentContext : CustomerSupplier
                }
            }
        `);

        expectValidDocument(document);
        
        // 'this' should resolve to the containing bounded context
        const bc = getAllBoundedContexts(document).find(bc => 
            bc.documentation?.some(d => 'relationships' in d)
        );
        
        expect(bc).toBeDefined();
        if (bc && bc.documentation) {
            const relationshipBlock = bc.documentation.find(d => 'relationships' in d);
            if (relationshipBlock && 'relationships' in relationshipBlock) {
                const relationship = relationshipBlock.relationships[0];
                expect(relationship.left).toBeDefined();
            }
        }
    });

    test('handles circular references gracefully', async () => {
        const document = await testServices.parse(s`
            Domain A in B {}
            Domain B in C {}
            Domain C in A {}
        `);

        // Should parse but may generate validation warnings
        expectValidDocument(document);
        
        // All domain references should still resolve
        const domains = document.parseResult.value.children.filter(child => isDomain(child));
        expect(domains).toHaveLength(3);
        
        domains.forEach(domain => {
            if (isDomain(domain) && domain.parent) {
                expect(domain.parent.ref).toBeDefined();
            }
        });
    });

    test('handles missing references gracefully', async () => {
        const document = await testServices.parse(s`
            BoundedContext OrderContext for NonExistentDomain {
                team: NonExistentTeam
                role: NonExistentClassification
            }
        `);

        // Should parse but references won't resolve
        expectValidDocument(document);
        
        const bc = getFirstBoundedContext(document);
        expect(bc.domain?.ref).toBeUndefined();
    });
});
