import { describe, test, beforeAll, expect } from 'vitest';
import type { TestServices } from '../test-helpers.js';
import { setupTestSuite, expectValidDocument, s } from '../test-helpers.js';
import { isContextMap, isDomain } from '../../src/generated/ast.js';

let testServices: TestServices;

beforeAll(() => {
    testServices = setupTestSuite();
});

describe('Scoping: References', () => {
    test('resolves bounded context references in relationships', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BoundedContext OrderContext for Sales
            BoundedContext PaymentContext for Sales
            
            ContextMap SalesMap {
                contains OrderContext, PaymentContext
                [OHS] OrderContext -> [CF] PaymentContext : CustomerSupplier
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        
        const contextMap = document.parseResult.value.children.find(isContextMap);
        expect(contextMap).toBeDefined();
        if (!contextMap) {
            return;
        }

        expect(contextMap.boundedContexts).toHaveLength(2);
        expect(contextMap.relationships).toHaveLength(1);
        
        const relationship = contextMap.relationships[0];
        expect(relationship.left.link?.ref?.name).toBe('OrderContext');
        expect(relationship.right.link?.ref?.name).toBe('PaymentContext');
    });

    test('resolves domain hierarchy parent reference', async () => {
        // Arrange
        const input = s`
            Domain Commerce {
                description: "Main commerce domain"
            }
            
            Domain Sales in Commerce {
                description: "Sales subdomain"
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        
        const salesDomain = document.parseResult.value.children
            .filter(isDomain)
            .find(domain => domain.name === 'Sales');

        expect(salesDomain).toBeDefined();
        if (!salesDomain) {
            return;
        }
        expect(salesDomain.parent?.ref).toBeDefined();
        expect(salesDomain.parent?.ref?.name).toBe('Commerce');
    });
});
