/**
 * Test to verify enhanced error messages are working
 */

import { describe, test, beforeAll, expect } from 'vitest';
import type { TestServices } from '../test-helpers.js';
import { setupTestSuite, s } from '../test-helpers.js';

let testServices: TestServices;

beforeAll(() => {
    testServices = setupTestSuite();
});

describe('Enhanced Error Messages', () => {
    test('Domain missing vision shows concise message with clickable link', async () => {
        const input = s`Domain Sales {}`;
        const document = await testServices.parse(input);
        
        expect(document.diagnostics).toBeDefined();
        const diagnostics = document.diagnostics ?? [];
        expect(diagnostics.length).toBeGreaterThan(0);
        const visionWarning = diagnostics.find(d => d.message.includes('vision'));
        expect(visionWarning).toBeDefined();
        expect(visionWarning?.message).toContain('missing a vision statement');
        // Check for clickable link via codeDescription
        expect(visionWarning?.codeDescription?.href).toContain('language.md');
    });

    test('BC missing description shows concise message with clickable link', async () => {
        const input = s`
            Domain Sales {}
            bc OrderContext for Sales {}
        `;
        const document = await testServices.parse(input);
        
        const diagnostics = document.diagnostics ?? [];
        const descWarning = diagnostics.find(d => d.message.includes('description'));
        expect(descWarning).toBeDefined();
        expect(descWarning?.message).toContain('missing a description');
        expect(descWarning?.codeDescription?.href).toContain('language.md');
    });

    test('BC missing domain shows concise message with clickable link', async () => {
        const input = s`bc OrderContext`;
        const document = await testServices.parse(input);
        
        const diagnostics = document.diagnostics ?? [];
        const domainWarning = diagnostics.find(d => d.message.includes('belong to a domain'));
        expect(domainWarning).toBeDefined();
        expect(domainWarning?.message).toContain('must belong to a domain');
        expect(domainWarning?.codeDescription?.href).toContain('language.md');
    });

    test('SharedKernel with wrong arrow shows concise message with clickable link', async () => {
        const input = s`
            Domain Sales {}
            bc Context1 for Sales
            bc Context2 for Sales
            
            ContextMap TestMap {
                contains Context1, Context2
                [SK] Context1 -> [SK] Context2
            }
        `;
        const document = await testServices.parse(input);
        
        const diagnostics = document.diagnostics ?? [];
        const skWarning = diagnostics.find(d => d.message.includes('SharedKernel'));
        expect(skWarning).toBeDefined();
        expect(skWarning?.message).toContain('bidirectional');
        expect(skWarning?.message).toContain('<->');
        expect(skWarning?.codeDescription?.href).toContain('integration-patterns');
    });

    test('ACL on wrong side shows concise message with clickable link', async () => {
        const input = s`
            Domain Sales {}
            bc Context1 for Sales
            bc Context2 for Sales
            
            ContextMap TestMap {
                contains Context1, Context2
                [ACL] Context1 -> Context2
            }
        `;
        const document = await testServices.parse(input);
        
        const diagnostics = document.diagnostics ?? [];
        const aclWarning = diagnostics.find(d => d.message.includes('Anti-Corruption Layer'));
        expect(aclWarning).toBeDefined();
        expect(aclWarning?.message).toContain('downstream');
        expect(aclWarning?.codeDescription?.href).toContain('integration-patterns');
    });

    test('Conformist on wrong side shows concise message with clickable link', async () => {
        const input = s`
            Domain Sales {}
            bc Context1 for Sales
            bc Context2 for Sales
            
            ContextMap TestMap {
                contains Context1, Context2
                [CF] Context1 -> Context2
            }
        `;
        const document = await testServices.parse(input);
        
        const diagnostics = document.diagnostics ?? [];
        const cfWarning = diagnostics.find(d => d.message.includes('Conformist'));
        expect(cfWarning).toBeDefined();
        expect(cfWarning?.message).toContain('downstream');
        expect(cfWarning?.codeDescription?.href).toContain('integration-patterns');
    });

    test('Too many patterns shows concise message with clickable link', async () => {
        const input = s`
            Domain Sales {}
            bc Context1 for Sales
            bc Context2 for Sales
            
            ContextMap TestMap {
                contains Context1, Context2
                [OHS, PL, ACL, CF] Context1 -> Context2
            }
        `;
        const document = await testServices.parse(input);
        
        const diagnostics = document.diagnostics ?? [];
        const tooManyWarning = diagnostics.find(d => d.message.includes('Too many'));
        expect(tooManyWarning).toBeDefined();
        expect(tooManyWarning?.message).toContain('1-2 patterns');
        expect(tooManyWarning?.codeDescription?.href).toContain('integration-patterns');
    });
});
