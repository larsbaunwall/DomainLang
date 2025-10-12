import { describe, test, beforeAll, expect } from 'vitest';
import type { TestServices } from '../test-helpers.js';
import { setupTestSuite, expectValidDocument, getAllBoundedContexts, s } from '../test-helpers.js';

let testServices: TestServices;

beforeAll(() => {
    testServices = setupTestSuite();
});

describe('Scoping: Performance', () => {
    test('handles large number of elements efficiently', async () => {
        const domainDefinitions = Array.from({ length: 50 }, (_, i) => 
            `Domain Domain${i} {}`
        ).join('\n');
        
        const bcDefinitions = Array.from({ length: 100 }, (_, i) => 
            `BoundedContext BC${i} for Domain${i % 50}`
        ).join('\n');
        
        const document = await testServices.parse(s`
            ${domainDefinitions}
            ${bcDefinitions}
        `);

        expectValidDocument(document);
        
        const boundedContexts = getAllBoundedContexts(document);
        expect(boundedContexts).toHaveLength(100);
        
        boundedContexts.forEach(bc => {
            expect(bc.domain?.ref).toBeDefined();
        });
    });
});
