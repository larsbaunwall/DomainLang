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
        const teamBlock = bc.documentation?.find(d => 'team' in d);
        expect(teamBlock).toBeDefined();
        if (teamBlock && 'team' in teamBlock) {
            expect(teamBlock.team?.ref).toBeDefined();
            expect(teamBlock.team?.ref?.name).toBe('SalesTeam');
        }
    });

    test('resolves classification reference', async () => {
        // Arrange
        const input = s`
            Classification Core
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                role: Core
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        
        const bc = getFirstBoundedContext(document);
        const roleBlock = bc.documentation?.find(d => 'role' in d);
        expect(roleBlock).toBeDefined();
        if (roleBlock && 'role' in roleBlock) {
            expect(roleBlock.role?.ref).toBeDefined();
            expect(roleBlock.role?.ref?.name).toBe('Core');
        }
    });
});
