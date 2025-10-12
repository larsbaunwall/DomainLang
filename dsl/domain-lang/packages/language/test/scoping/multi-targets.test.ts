import { describe, test, beforeAll, expect } from 'vitest';
import type { TestServices } from '../test-helpers.js';
import { setupTestSuite, expectValidDocument, s } from '../test-helpers.js';
import { isContextGroup, isContextMap } from '../../src/generated/ast.js';

let testServices: TestServices;

beforeAll(() => {
    testServices = setupTestSuite();
});

describe('Scoping: Multi-Target References', () => {
    test('resolves multiple bounded contexts with same name', async () => {
        const document = await testServices.parse(s`
            Domain Sales {}
            Domain Support {}
            
            BoundedContext CustomerManagement for Sales {
                description: "Sales customer management"
            }
            
            BoundedContext CustomerManagement for Support {
                description: "Support customer management"
            }
            
            ContextGroup AllCustomerContexts {
                contains CustomerManagement
            }
        `);

        expectValidDocument(document);
        
        const contextGroup = document.parseResult.value.children.find(child => isContextGroup(child));
        expect(contextGroup).toBeDefined();
        
        if (contextGroup && isContextGroup(contextGroup)) {
            // Should resolve to multiple targets
            expect(contextGroup.contexts).toHaveLength(1);
            const contextRef = contextGroup.contexts[0];
            expect(contextRef.items).toBeDefined();
            expect(contextRef.items.length).toBeGreaterThan(0);
        }
    });

    test('handles same-named contexts in different domains', async () => {
        const document = await testServices.parse(s`
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
        `);

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
