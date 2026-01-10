import { describe, test, beforeAll, expect } from 'vitest';
import type { TestServices } from '../test-helpers.js';
import { setupTestSuite, expectValidDocument, s } from '../test-helpers.js';
import { isContextMap } from '../../src/generated/ast.js';

let testServices: TestServices;

beforeAll(() => {
    testServices = setupTestSuite();
});

describe('Scoping: Multi-Target References', () => {
    test('resolves multiple bounded contexts with same name', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            Domain Support {}
            
            BoundedContext CustomerManagement for Sales {
                description: "Sales customer management"
            }
            
            BoundedContext CustomerManagement for Support {
                description: "Support customer management"
            }
            
            ContextMap AllCustomerContexts {
                contains CustomerManagement
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        
        const contextMap = document.parseResult.value.children.find(child => isContextMap(child));
        expect(contextMap).toBeDefined();
        
        if (contextMap && isContextMap(contextMap)) {
            // ContextMap uses boundedContexts property
            expect(contextMap.boundedContexts).toHaveLength(1);
            const contextRef = contextMap.boundedContexts[0];
            expect(contextRef.items).toBeDefined();
            expect(contextRef.items.length).toBeGreaterThan(0);
        }
    });

    test('handles same-named contexts in different domains', async () => {
        // Arrange
        const input = s`
            Domain Marketing {}
            Domain Sales {}
            
            BoundedContext Campaigns for Marketing {
                description: "Marketing campaigns"
            }
            
            BoundedContext Campaigns for Sales {
                description: "Sales campaigns"
            }
            
            ContextMap AllCampaigns {
                contains Campaigns
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        
        const contextMap = document.parseResult.value.children.find(child => isContextMap(child));
        expect(contextMap).toBeDefined();
        
        if (contextMap && isContextMap(contextMap)) {
            expect(contextMap.boundedContexts).toHaveLength(1);
            const contextRef = contextMap.boundedContexts[0];
            expect(contextRef.items).toBeDefined();
            expect(contextRef.items.length).toBeGreaterThan(0);
        }
    });
});
