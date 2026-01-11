import { beforeAll, describe, expect, test } from 'vitest';
import { setupTestSuite, s } from '../test-helpers.js';

let testServices: ReturnType<typeof setupTestSuite>;

beforeAll(() => {
    testServices = setupTestSuite();
});

describe('FR-2.3: Inline/Block Conflict Validation', () => {
    test('Inline "as" conflicts with block "role"', async () => {
        const doc = await testServices.parse(s`
            Domain Sales {}
            Classification Core
            Classification Supporting
            Team SalesTeam
            
            BoundedContext OrderManagement for Sales as Core by SalesTeam {
                role: Supporting
            }
        `);
        // Expect a warning for role conflict among all warnings
        const warnings = doc.diagnostics?.filter(d => d.severity === 2) ?? [];
        expect(warnings.some(w => w.message.includes('Role specified both inline'))).toBe(true);
    });

    test('Inline "by" conflicts with block "team"', async () => {
        const doc = await testServices.parse(s`
            Domain Sales {}
            Classification Core
            Team SalesTeam
            Team PlatformTeam
            
            BoundedContext Billing for Sales as Core by SalesTeam {
                team: PlatformTeam
            }
        `);
        // Expect a warning for team conflict among all warnings
        const warnings = doc.diagnostics?.filter(d => d.severity === 2) ?? [];
        expect(warnings.some(w => w.message.includes('Team specified both inline'))).toBe(true);
    });

    test('Multiple conflicts simultaneously (role and team)', async () => {
        const doc = await testServices.parse(s`
            Domain Sales {}
            Classification Core
            Classification Supporting
            Team SalesTeam
            Team PlatformTeam
            
            BoundedContext Payments for Sales as Core by SalesTeam {
                role: Supporting
                team: PlatformTeam
            }
        `);
        // Expect both role and team conflict warnings among all warnings
        const warnings = doc.diagnostics?.filter(d => d.severity === 2) ?? [];
        expect(warnings.some(w => w.message.includes('Role specified both inline'))).toBe(true);
        expect(warnings.some(w => w.message.includes('Team specified both inline'))).toBe(true);
    });

    test('No conflict when only one form used', async () => {
        const doc = await testServices.parse(s`
            Domain Sales {}
            Classification Core
            Team SalesTeam
            
            BoundedContext Shipping for Sales as Core {
                description: "Handles shipping operations"
            }
            
            BoundedContext Support for Sales by SalesTeam {
                description: "Handles support operations"
            }
            
            BoundedContext Inventory for Sales {
                role: Core
                team: SalesTeam
                description: "Handles inventory operations"
            }
        `);
        // Ensure no conflict warnings appear
        const warnings = doc.diagnostics?.filter(d => d.severity === 2) ?? [];
        expect(warnings.some(w => w.message.includes('Role specified both inline'))).toBe(false);
        expect(warnings.some(w => w.message.includes('Team specified both inline'))).toBe(false);
        // Also ensure document parsed successfully
        expect(doc.parseResult.parserErrors.length).toBe(0);
    });
});
