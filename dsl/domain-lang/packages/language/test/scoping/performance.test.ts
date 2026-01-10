import { describe, test, beforeAll, expect } from 'vitest';
import type { TestServices } from '../test-helpers.js';
import { setupTestSuite, expectValidDocument, getAllBoundedContexts, s } from '../test-helpers.js';

let testServices: TestServices;

beforeAll(() => {
    testServices = setupTestSuite();
});

describe('Scoping: Performance', () => {
    test('handles large number of elements efficiently', async () => {
        // Arrange
        const domainDefinitions = Array.from({ length: 50 }, (_, i) => 
            `Domain Domain${i}:`
        ).join('\n');
        
        const bcDefinitions = Array.from({ length: 100 }, (_, i) => 
            `BoundedContext BC${i}:\n    for: Domain${i % 50}`
        ).join('\n');
        
        const input = s`
            ${domainDefinitions}
            ${bcDefinitions}
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        
        const boundedContexts = getAllBoundedContexts(document);
        expect(boundedContexts).toHaveLength(100);
        
        boundedContexts.forEach(bc => {
            expect(bc.domain?.ref).toBeDefined();
        });
    });
});
