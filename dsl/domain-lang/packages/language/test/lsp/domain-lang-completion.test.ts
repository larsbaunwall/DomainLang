/**
 * Tests for DomainLangCompletionProvider.
 *
 * Verifies completion provider integration and behavior:
 * - Provider is properly wired up through LSP services
 * - Completions work in appropriate contexts
 * - Duplicate blocks are not suggested
 * - Contextual completions respect existing properties
 */

import { describe, test, expect, beforeAll } from 'vitest';
import { setupTestSuite, type TestServices } from '../test-helpers.js';
import * as ast from '../../src/generated/ast.js';

describe('DomainLangCompletionProvider', () => {
    let testServices: TestServices;

    beforeAll(() => {
        testServices = setupTestSuite();
    });

    /**
     * Helper to get completions for a given context node.
     * Uses type assertion to access protected method for testing.
     */
    const getCompletions = async (input: string, nodeIndex = 0): Promise<any[]> => {
        const document = await testServices.parse(input);
        const completions: any[] = [];
        
        let node: any = document.parseResult.value;
        if (nodeIndex > 0 && ast.isModel(node)) {
            node = node.children[nodeIndex - 1];
        }

        const context = {
            node,
            tokenOffset: 0,
            tokenEndOffset: 0,
            document,
            textDocument: { uri: 'test.dlang' } as any,
            position: { line: 0, character: 0 }
        };

        (testServices.services.DomainLang.lsp.CompletionProvider as any).completionFor(
            context as any,
            {} as any,
            (_ctx: any, item: any) => completions.push(item)
        );

        return completions;
    };

    test('completion provider is wired up and provides completions', async () => {
        // Arrange - empty document
        const input = '';
        
        // Act - get completions
        const completions = await getCompletions(input);
        
        // Assert - provider exists and returns completions
        expect(testServices.services.DomainLang.lsp.CompletionProvider).toBeDefined();
        expect(completions.length).toBeGreaterThan(0);
    });

    test('provides top-level snippets for empty document', async () => {
        // Arrange - empty document
        const input = '';
        
        // Act - get completions
        const completions = await getCompletions(input);
        
        // Assert - has Domain or BoundedContext snippets
        const hasSnippets = completions.some(c => c.label?.includes('Domain') || c.label?.includes('BoundedContext'));
        expect(hasSnippets).toBe(true);
    });

    describe('contextual completions', () => {
        test('provides completions inside BoundedContext', async () => {
            // Arrange - document with empty BC
            const input = `
                Domain Sales {}
                BoundedContext Test for Sales {}
            `;
            
            // Act - get completions for BC node
            const completions = await getCompletions(input, 2);
            
            // Assert - completions are provided
            expect(completions.length).toBeGreaterThan(0);
        });

        test('provides completions inside Domain', async () => {
            // Arrange - document with empty Domain
            const input = 'Domain Sales {}';
            
            // Act - get completions for Domain node
            const completions = await getCompletions(input, 1);
            
            // Assert - completions are provided
            expect(completions.length).toBeGreaterThan(0);
        });

        test('provides completions inside ContextMap', async () => {
            // Arrange - document with empty ContextMap
            const input = 'ContextMap Sales {}';
            
            // Act - get completions for ContextMap node
            const completions = await getCompletions(input, 1);
            
            // Assert - completions are provided
            expect(completions.length).toBeGreaterThan(0);
        });

        test('provides completions inside relationships block', async () => {
            // Arrange - BC with empty relationships block
            const input = `
                Domain Sales {}
                BoundedContext OrderContext for Sales {
                    relationships {}
                }
            `;
            const document = await testServices.parse(input);
            const bc = (document.parseResult.value as any).children[1];
            const relationships = bc.relationships;
            expect(relationships).toBeDefined();
            
            // Act - get completions for relationships block
            const completions: any[] = [];
            const context = {
                node: bc,
                tokenOffset: 0,
                tokenEndOffset: 0,
                document,
                textDocument: { uri: 'test.dlang' } as any,
                position: { line: 0, character: 0 }
            };
            (testServices.services.DomainLang.lsp.CompletionProvider as any).completionFor(
                context as any,
                {} as any,
                (_ctx: any, item: any) => completions.push(item)
            );

            // Assert - completions are provided
            expect(completions.length).toBeGreaterThan(0);
        });

        test('top-level completions exclude documentation blocks', async () => {
            // Arrange - empty document (Model level)
            const input = '';
            
            // Act - get completions at root level
            const completions = await getCompletions(input, 0);
            const labels = completions.map(c => c.label);
            
            // Assert - only top-level constructs, no documentation blocks
            expect(labels.some(l => l.includes('Domain') || l.includes('BoundedContext'))).toBe(true);
            expect(labels).not.toContain('description');
            expect(labels).not.toContain('team');
            expect(labels).not.toContain('classification');
            expect(labels).not.toContain('vision');
            expect(labels).not.toContain('terminology');
        });

        test('inside BoundedContext body, no top-level snippets appear', async () => {
            // Arrange - BoundedContext with some content, cursor in body
            const input = `
                Team SupportTeam
                BoundedContext SupportPortal for Marketplace {
                    description: "Handles customer support"
                    
                }
            `;
            
            // Act - get completions for BC node (simulating typing inside the body)
            const completions = await getCompletions(input, 2);
            const labels = completions.map(c => c.label);
            
            // Assert - no top-level snippets like Domain, BoundedContext, Team
            expect(labels).not.toContain('Domain (simple)');
            expect(labels).not.toContain('Domain (detailed)');
            expect(labels).not.toContain('BoundedContext (simple)');
            expect(labels).not.toContain('BoundedContext (detailed)');
            expect(labels).not.toContain('Team');
            expect(labels).not.toContain('Classification');
        });

        test('inside Domain body, no top-level snippets appear', async () => {
            // Arrange - Domain with some content
            const input = `
                Domain Sales {
                    vision: "Be the best"
                    
                }
            `;
            
            // Act - get completions for Domain node
            const completions = await getCompletions(input, 1);
            const labels = completions.map(c => c.label);
            
            // Assert - no top-level snippets
            expect(labels).not.toContain('Domain (simple)');
            expect(labels).not.toContain('BoundedContext (simple)');
            expect(labels).not.toContain('Team');
        });
    });

    describe('duplicate prevention', () => {
        test('does not suggest documentation blocks that already exist in BoundedContext', async () => {
            // Arrange - BC with description and team already defined
            const input = `
                Domain Sales {}
                Team TestTeam
                BoundedContext Test for Sales {
                    description: "Test context"
                    team: TestTeam
                }
            `;
            
            // Act - get completions
            const completions = await getCompletions(input, 3);
            
            // Assert - existing blocks are not suggested
            const labels = completions.map(c => c.label);
            expect(labels).not.toContain('description');
            expect(labels).not.toContain('team');
        });

        test('does not suggest documentation blocks that already exist in Domain', async () => {
            // Arrange - Domain with vision and description already defined
            const input = `
                Domain Sales {
                    vision: "Be the best"
                    description: "Sales domain"
                }
            `;
            
            // Act - get completions
            const completions = await getCompletions(input, 1);
            
            // Assert - existing blocks are not suggested
            const labels = completions.map(c => c.label);
            expect(labels).not.toContain('vision');
            expect(labels).not.toContain('description');
        });
    });

    describe('respects shorthand syntax', () => {
        test('does not suggest team when set via "by" clause', async () => {
            // Arrange - BC with team set via "by" clause
            const input = `
                Domain Sales {}
                Team MyTeam
                BoundedContext Test for Sales by MyTeam {}
            `;
            
            // Act - get completions
            const completions = await getCompletions(input, 3);
            
            // Assert - team is not suggested
            const labels = completions.map(c => c.label);
            expect(labels).not.toContain('team');
        });

        test('does not suggest classification when set via "as" clause', async () => {
            // Arrange - BC with classification set via "as" clause
            const input = `
                Domain Sales {}
                Classification Core
                BoundedContext Test for Sales as Core {}
            `;
            
            // Act - get completions
            const completions = await getCompletions(input, 3);
            
            // Assert - classification is not suggested
            const labels = completions.map(c => c.label);
            expect(labels).not.toContain('classification');
        });
    });

    describe('context-specific completions', () => {
        test('Domain completions exclude BoundedContext-only blocks', async () => {
            // Arrange - empty Domain
            const input = 'Domain Sales {}';
            
            // Act - get completions
            const completions = await getCompletions(input, 1);
            const labels = completions.map(c => c.label);

            // Assert - Domain blocks present, BC blocks absent
            expect(labels.some(l => l.includes('vision'))).toBe(true);
            expect(labels).not.toContain('team');
            expect(labels).not.toContain('terminology');
            expect(labels).not.toContain('relationships');
        });

        test('BoundedContext completions exclude Domain-only blocks', async () => {
            // Arrange - empty BoundedContext
            const input = `
                Domain Sales {}
                BoundedContext Test for Sales {}
            `;
            
            // Act - get completions
            const completions = await getCompletions(input, 2);
            const labels = completions.map(c => c.label);

            // Assert - Domain-only blocks are not present
            expect(labels).not.toContain('vision');
            expect(labels).not.toContain('classification');
        });
    });
});
