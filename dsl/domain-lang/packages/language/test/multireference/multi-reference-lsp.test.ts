import { describe, test, expect, beforeAll } from 'vitest';
import type { TestServices } from '../test-helpers.js';
import { setupTestSuite, expectValidDocument, s } from '../test-helpers.js';
import type { ContextMap, BoundedContext } from '../../src/generated/ast.js';
import { isContextMap } from '../../src/generated/ast.js';

/**
 * This test demonstrates the practical use of multi-target references.
 * It shows how the same BC name in different contexts resolves to multiple targets.
 */
describe('MultiReference Practical Example', () => {
    let testServices: TestServices;

    beforeAll(() => {
        testServices = setupTestSuite();
    });

    test('Demonstrates how multiple BCs with same name are referenced', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            Domain Support {}
            
            // Two different BCs with the same name "CustomerManagement"
            // Each serves a different domain with different responsibilities
            BC CustomerManagement for Sales {
                description: "Manages sales leads and opportunities"
            }
            
            BC CustomerManagement for Support {
                description: "Manages support tickets and SLAs"
            }
            
            // The ContextMap references "CustomerManagement"
            // With MultiReference, this resolves to BOTH BCs above!
            ContextMap CustomerServices {
                contains CustomerManagement
            }
        `;

        // Act
        const document = await testServices.parse(input);
        expectValidDocument(document);
        const model = document.parseResult.value;
        
        // Assert
        // Find the ContextMap
        const contextMap = model.children.find((c): c is ContextMap => 
            isContextMap(c) && c.name === 'CustomerServices'
        ) as ContextMap;

        // The map has ONE reference to "CustomerManagement"
        expect(contextMap.boundedContexts.length).toBe(1);
        console.log(`Number of references: ${contextMap.boundedContexts.length}`);
        
        // But that ONE reference resolves to TWO targets!
        const customerMgmtRef = contextMap.boundedContexts[0];
        expect(customerMgmtRef.items.length).toBe(2);
        console.log(`Number of resolved targets: ${customerMgmtRef.items.length}`);
        
        // Both targets have the same name
        const resolvedNames = customerMgmtRef.items.map((item: any) => item.ref?.name);
        console.log(`Resolved BC names: ${resolvedNames.join(', ')}`);
        expect(resolvedNames).toEqual(['CustomerManagement', 'CustomerManagement']);
        
        // But they belong to different domains
        const resolvedContexts = customerMgmtRef.items.map((item: any) => {
            const bc = item.ref as BoundedContext;
            return bc.domain?.ref?.name;  // Single reference now
        });
        console.log(`Domains: ${resolvedContexts.join(', ')}`);
        expect(resolvedContexts.sort()).toEqual(['Sales', 'Support']);
        
        // What this means in practice:
        console.log('\n Practical Outcome:');
        console.log('   - Writing "contains CustomerManagement" once');
        console.log('   - Includes BOTH the Sales and Support perspectives');
        console.log('   - Enables unified views across team boundaries');
        console.log('   - Supports modular, distributed domain modeling');
    });

    test('Shows how hover tooltips display multiple resolved targets', async () => {
        // Arrange  
        const input = s`
            Domain Marketing {}
            Domain Sales {}
            
            BC Campaigns for Marketing {
                description: "Marketing campaigns"
            }
            
            BC Campaigns for Sales {
                description: "Sales campaigns"  
            }
            
            ContextMap AllCampaigns {
                contains Campaigns
            }
        `;

        // Act
        const document = await testServices.parse(input);
        expectValidDocument(document);
        const model = document.parseResult.value;
        
        // Assert
        const contextMap = model.children.find((c): c is ContextMap => 
            isContextMap(c) && c.name === 'AllCampaigns'
        ) as ContextMap;

        const campaignsRef = contextMap.boundedContexts[0];
        
        // When you hover over "Campaigns" in the ContextMap in VS Code,
        // the LSP hover provider will show information about BOTH BCs
        console.log('\n  Hover tooltip would show information about:');
        campaignsRef.items.forEach((item: any, idx: number) => {
            const bc = item.ref as BoundedContext;
            const domain = bc.domain?.ref?.name;
            console.log(`   ${idx + 1}. ${bc.name} (${domain})`);
        });
        
        // This provides rich context about all matching BCs
        expect(campaignsRef.items.length).toBe(2);
    });
});

