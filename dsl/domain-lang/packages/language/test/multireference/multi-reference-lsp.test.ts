/**
 * MultiReference Practical Examples
 * 
 * Demonstrates how multi-target references work in practice.
 * Shows how the same BC name in different contexts resolves to multiple targets.
 */

import { describe, test, expect, beforeAll } from 'vitest';
import type { TestServices } from '../test-helpers.js';
import { setupTestSuite, expectValidDocument, s } from '../test-helpers.js';
import type { ContextMap, BoundedContext } from '../../src/generated/ast.js';
import { isContextMap } from '../../src/generated/ast.js';

let testServices: TestServices;

beforeAll(() => {
    testServices = setupTestSuite();
});

describe('MultiReference Practical Examples', () => {
    test('Multiple BCs with same name resolve to all targets', async () => {
        // Arrange
        const input = s`
            Domain Sales:
            Domain Support:
            
            // Two different BCs with the same name "CustomerManagement"
            // Each serves a different domain with different responsibilities
            BC CustomerManagement:
                for: Sales
                description: "Manages sales leads and opportunities"
            
            BC CustomerManagement:
                for: Support
                description: "Manages support tickets and SLAs"
            
            // The ContextMap references "CustomerManagement"
            // With MultiReference, this resolves to BOTH BCs above!
            ContextMap CustomerServices:
                contains:
                    - CustomerManagement
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const model = document.parseResult.value;
        
        const contextMap = model.children.find((c): c is ContextMap => 
            isContextMap(c) && c.name === 'CustomerServices'
        ) as ContextMap;

        // The map has ONE reference to "CustomerManagement"
        expect(contextMap.boundedContexts.length).toBe(1);
        
        // But that ONE reference resolves to TWO targets!
        const customerMgmtRef = contextMap.boundedContexts[0];
        expect(customerMgmtRef.items.length).toBe(2);
        
        // Both targets have the same name
        const resolvedNames = customerMgmtRef.items.map((item: any) => item.ref?.name);
        expect(resolvedNames).toEqual(['CustomerManagement', 'CustomerManagement']);
        
        // But they belong to different domains
        const resolvedContexts = customerMgmtRef.items.map((item: any) => {
            const bc = item.ref as BoundedContext;
            return bc.domain?.ref?.name;
        });
        expect(resolvedContexts.sort()).toEqual(['Sales', 'Support']);
    });

    test('MultiReference with multiple resolved targets for hover tooltips', async () => {
        // Arrange
        const input = s`
            Domain Marketing:
            Domain Sales:
            
            BC Campaigns:
                for: Marketing
                description: "Marketing campaigns"
            
            BC Campaigns:
                for: Sales
                description: "Sales campaigns"  
            
            ContextMap AllCampaigns:
                contains:
                    - Campaigns
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const model = document.parseResult.value;
        
        const contextMap = model.children.find((c): c is ContextMap => 
            isContextMap(c) && c.name === 'AllCampaigns'
        ) as ContextMap;

        const campaignsRef = contextMap.boundedContexts[0];
        
        // When hovering over "Campaigns" in the ContextMap in VS Code,
        // the LSP hover provider will show information about BOTH BCs
        expect(campaignsRef.items.length).toBe(2);
        
        // Verify the domains
        const domains = campaignsRef.items.map((item: any) => {
            const bc = item.ref as BoundedContext;
            return bc.domain?.ref?.name;
        });
        expect(domains.sort()).toEqual(['Marketing', 'Sales']);
    });

    test('Single BC resolves to single target', async () => {
        // Arrange
        const input = s`
            Domain Sales:
            
            BC OrderContext:
                for: Sales
                description: "Order management"
            
            ContextMap OrdersMap:
                contains:
                    - OrderContext
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const model = document.parseResult.value;
        
        const contextMap = model.children.find(isContextMap) as ContextMap;
        expect(contextMap.boundedContexts.length).toBe(1);
        expect(contextMap.boundedContexts[0].items.length).toBe(1);
        expect(contextMap.boundedContexts[0].items[0].ref?.name).toBe('OrderContext');
    });
});

