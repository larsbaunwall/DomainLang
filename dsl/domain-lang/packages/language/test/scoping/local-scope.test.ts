import { describe, test, beforeAll, expect } from 'vitest';
import type { TestServices } from '../test-helpers.js';
import { setupTestSuite, expectValidDocument, getFirstBoundedContext, s } from '../test-helpers.js';

let testServices: TestServices;

beforeAll(() => {
    testServices = setupTestSuite();
});

describe('Scoping: Local Scope', () => {
    test('resolves domain reference in bounded context', async () => {
        // Arrange
        const input = s`
            Domain Sales {
                description: "Sales domain"
            }
            
            BoundedContext OrderContext for Sales {
                description: "Order management"
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

    test('resolves team reference in bounded context', async () => {
        // Arrange
        const input = s`
            Team SalesTeam
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                team: SalesTeam
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        
        const bc = getFirstBoundedContext(document);
        const team = bc.team?.[0];
        expect(team?.ref).toBeDefined();
        expect(team?.ref?.name).toBe('SalesTeam');
    });

    test('resolves classification reference', async () => {
        // Arrange
        const input = s`
            Classification Core
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                classification: Core
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        
        const bc = getFirstBoundedContext(document);
        const classification = bc.classification?.[0];
        expect(classification?.ref).toBeDefined();
        expect(classification?.ref?.name).toBe('Core');
    });
});
