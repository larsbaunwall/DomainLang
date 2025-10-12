import { describe, test, beforeAll, expect } from 'vitest';
import type { TestServices } from '../test-helpers.js';
import { setupTestSuite, expectValidDocument, getFirstBoundedContext, s } from '../test-helpers.js';

let testServices: TestServices;

beforeAll(() => {
    testServices = setupTestSuite();
});

describe('Scoping: Local Scope', () => {
    test('resolves domain reference in bounded context', async () => {
        const document = await testServices.parse(s`
            Domain Sales {
                description: "Sales domain"
            }
            
            BoundedContext OrderContext for Sales {
                description: "Order management"
            }
        `);

        expectValidDocument(document);
        
        const bc = getFirstBoundedContext(document);
        expect(bc.domain?.ref).toBeDefined();
        expect(bc.domain?.ref?.name).toBe('Sales');
    });

    test('resolves team reference in bounded context', async () => {
        const document = await testServices.parse(s`
            Team SalesTeam
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                team: SalesTeam
            }
        `);

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
        const document = await testServices.parse(s`
            Classification Core
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                role: Core
            }
        `);

        expectValidDocument(document);
        
        const bc = getFirstBoundedContext(document);
        const roleBlock = bc.documentation?.find(d => 'roleClassifier' in d);
        expect(roleBlock).toBeDefined();
        if (roleBlock && 'roleClassifier' in roleBlock) {
            expect(roleBlock.roleClassifier?.ref).toBeDefined();
            expect(roleBlock.roleClassifier?.ref?.name).toBe('Core');
        }
    });
});
