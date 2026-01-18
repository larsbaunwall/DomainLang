/**
 * Test suite for SDK AST augmentation features.
 * 
 * Tests the module augmentation pattern that adds native SDK properties
 * to BoundedContext, Domain, and Relationship AST nodes.
 */

/* eslint-disable @typescript-eslint/no-non-null-assertion -- Test assertions use ! to verify expected values exist */

import { describe, test, expect } from 'vitest';
import { loadModelFromText, Pattern, matchesPattern } from '../../src/sdk/index.js';
import type { BoundedContext, Domain, Relationship } from '../../src/generated/ast.js';
import { isBoundedContext, isDomain, isContextMap } from '../../src/generated/ast.js';
import { AstUtils } from 'langium';

// Import the augmentation module to enable TypeScript type extensions
import '../../src/sdk/ast-augmentation.js';

describe('SDK AST Augmentation', () => {
    
    describe('BoundedContext augmented properties', () => {
        
        test('description returns first description block', async () => {
            const { model } = await loadModelFromText(`
                Domain Sales { vision: "Handle sales" }
                bc OrderContext for Sales {
                    description: "Handles order processing"
                }
            `);
            
            const bc = findFirst<BoundedContext>(model, isBoundedContext);
            expect(bc).toBeDefined();
            expect(bc!.description).toBe('Handles order processing');
        });
        
        test('effectiveClassification returns classification from header inline', async () => {
            const { model } = await loadModelFromText(`
                Classification Core
                Domain Sales { vision: "v" }
                bc OrderContext for Sales as Core
            `);
            
            const bc = findFirst<BoundedContext>(model, isBoundedContext);
            expect(bc).toBeDefined();
            expect(bc!.effectiveClassification?.name).toBe('Core');
        });
        
        test('effectiveTeam returns team from header inline', async () => {
            const { model } = await loadModelFromText(`
                Team SalesTeam
                Domain Sales { vision: "v" }
                bc OrderContext for Sales by SalesTeam
            `);
            
            const bc = findFirst<BoundedContext>(model, isBoundedContext);
            expect(bc).toBeDefined();
            expect(bc!.effectiveTeam?.name).toBe('SalesTeam');
        });
        
        test('hasClassification() checks classification by name', async () => {
            const { model } = await loadModelFromText(`
                Classification Core
                Domain Sales { vision: "v" }
                bc OrderContext for Sales as Core
            `);
            
            const bc = findFirst<BoundedContext>(model, isBoundedContext);
            expect(bc).toBeDefined();
            expect(bc!.hasClassification('Core')).toBe(true);
            expect(bc!.hasClassification('Supporting')).toBe(false);
        });
        
        test('hasTeam() checks team by name', async () => {
            const { model } = await loadModelFromText(`
                Team SalesTeam
                Domain Sales { vision: "v" }
                bc OrderContext for Sales by SalesTeam
            `);
            
            const bc = findFirst<BoundedContext>(model, isBoundedContext);
            expect(bc).toBeDefined();
            expect(bc!.hasTeam('SalesTeam')).toBe(true);
            expect(bc!.hasTeam('OtherTeam')).toBe(false);
        });
        
        test('hasMetadata() checks metadata key and value', async () => {
            const { model } = await loadModelFromText(`
                Metadata status
                Domain Sales { vision: "v" }
                bc OrderContext for Sales {
                    metadata {
                        status: "active"
                    }
                }
            `);
            
            const bc = findFirst<BoundedContext>(model, isBoundedContext);
            expect(bc).toBeDefined();
            expect(bc!.hasMetadata('status')).toBe(true);
            expect(bc!.hasMetadata('status', 'active')).toBe(true);
            expect(bc!.hasMetadata('status', 'inactive')).toBe(false);
            expect(bc!.hasMetadata('unknown')).toBe(false);
        });
        
        test('fqn returns fully qualified name', async () => {
            const { model } = await loadModelFromText(`
                Namespace acme.sales {
                    Domain Sales { vision: "v" }
                    bc OrderContext for Sales
                }
            `);
            
            const bc = findFirst<BoundedContext>(model, isBoundedContext);
            expect(bc).toBeDefined();
            expect(bc!.fqn).toBe('acme.sales.OrderContext');
        });
    });
    
    describe('Domain augmented properties', () => {
        
        test('vision returns first vision block', async () => {
            const { model } = await loadModelFromText(`
                Domain Sales { vision: "Drive sales growth" }
            `);
            
            const domain = findFirst<Domain>(model, isDomain);
            expect(domain).toBeDefined();
            expect(domain!.vision).toBe('Drive sales growth');
        });
        
        test('description returns first description block', async () => {
            const { model } = await loadModelFromText(`
                Domain Sales {
                    description: "Sales domain description"
                    vision: "Sales domain vision"
                }
            `);
            
            const domain = findFirst<Domain>(model, isDomain);
            expect(domain).toBeDefined();
            expect(domain!.description).toBe('Sales domain description');
        });
        
        test('hasType() checks domain type', async () => {
            const { model } = await loadModelFromText(`
                Classification CoreDomain
                Domain Sales {
                    description: "d"
                    vision: "v"
                    type: CoreDomain
                }
            `);
            
            const domain = findFirst<Domain>(model, isDomain);
            expect(domain).toBeDefined();
            expect(domain!.hasType('CoreDomain')).toBe(true);
            expect(domain!.hasType('Supporting')).toBe(false);
        });
        
        test('fqn returns fully qualified name for domain', async () => {
            const { model } = await loadModelFromText(`
                Namespace enterprise.retail {
                    Domain Sales { vision: "v" }
                }
            `);
            
            const domain = findFirst<Domain>(model, isDomain);
            expect(domain).toBeDefined();
            expect(domain!.fqn).toBe('enterprise.retail.Sales');
        });
        
        test('handles null/undefined gracefully in helper methods', async () => {
            const { model } = await loadModelFromText(`
                Classification Core
                Domain Sales { vision: "v" }
                bc OrderContext for Sales
            `);
            
            const bc = findFirst<BoundedContext>(model, isBoundedContext);
            expect(bc).toBeDefined();
            
            // Test with undefined Classification object
            expect(bc!.hasClassification(undefined as any)).toBe(false);
            
            // Test when BC has no classification set
            expect(bc!.hasClassification('Core')).toBe(false);
            
            // Test when BC has no team set
            expect(bc!.hasTeam('AnyTeam')).toBe(false);
            expect(bc!.hasTeam(undefined as any)).toBe(false);
        });
    });
    
    describe('Relationship augmented properties', () => {
        
        test('hasPattern() checks for pattern on either side', async () => {
            const { model } = await loadModelFromText(`
                Domain Sales { vision: "v" }
                bc OrderContext for Sales {
                    relationships {
                        [OHS] this -> [CF] PaymentContext
                    }
                }
                bc PaymentContext for Sales
            `);
            
            const rel = findFirstRelationship(model);
            expect(rel).toBeDefined();
            expect(rel!.hasPattern('OHS')).toBe(true);
            expect(rel!.hasPattern('CF')).toBe(true);
            expect(rel!.hasPattern('ACL')).toBe(false);
        });
        
        test('hasLeftPattern() and hasRightPattern() check specific sides', async () => {
            const { model } = await loadModelFromText(`
                Domain Sales { vision: "v" }
                bc OrderContext for Sales {
                    relationships {
                        [OHS, PL] this -> [CF, ACL] PaymentContext
                    }
                }
                bc PaymentContext for Sales
            `);
            
            const rel = findFirstRelationship(model);
            expect(rel).toBeDefined();
            expect(rel!.hasLeftPattern('OHS')).toBe(true);
            expect(rel!.hasLeftPattern('PL')).toBe(true);
            expect(rel!.hasLeftPattern('CF')).toBe(false);
            expect(rel!.hasRightPattern('CF')).toBe(true);
            expect(rel!.hasRightPattern('ACL')).toBe(true);
            expect(rel!.hasRightPattern('OHS')).toBe(false);
        });
        
        test('isBidirectional checks arrow type', async () => {
            const { model } = await loadModelFromText(`
                Domain Sales { vision: "v" }
                bc OrderContext for Sales {
                    relationships {
                        [SK] this <-> PaymentContext
                    }
                }
                bc PaymentContext for Sales
            `);
            
            const rel = findFirstRelationship(model);
            expect(rel).toBeDefined();
            expect(rel!.isBidirectional).toBe(true);
        });
        
        test('isUpstream and isDownstream check pattern roles', async () => {
            const { model } = await loadModelFromText(`
                Domain Sales { vision: "v" }
                bc OrderContext for Sales {
                    relationships {
                        [OHS] this -> [CF] PaymentContext
                    }
                }
                bc PaymentContext for Sales
            `);
            
            const rel = findFirstRelationship(model);
            expect(rel).toBeDefined();
            expect(rel!.isUpstream('left')).toBe(true);
            expect(rel!.isDownstream('right')).toBe(true);
            expect(rel!.isUpstream('right')).toBe(false);
            expect(rel!.isDownstream('left')).toBe(false);
        });
        
        test('leftContextName and rightContextName resolve names', async () => {
            const { model } = await loadModelFromText(`
                Domain Sales { vision: "v" }
                bc OrderContext for Sales {
                    relationships {
                        this -> PaymentContext
                    }
                }
                bc PaymentContext for Sales
            `);
            
            const rel = findFirstRelationship(model);
            expect(rel).toBeDefined();
            expect(rel!.leftContextName).toBe('OrderContext');
            expect(rel!.rightContextName).toBe('PaymentContext');
        });
    });
    
    describe('Pattern matching utilities', () => {
        
        test('Pattern constants are available', () => {
            expect(Pattern.OHS).toBe('OHS');
            expect(Pattern.CF).toBe('CF');
            expect(Pattern.ACL).toBe('ACL');
            expect(Pattern.SK).toBe('SK');
            expect(Pattern.PL).toBe('PL');
            expect(Pattern.P).toBe('P');
        });
        
        test('matchesPattern handles abbreviations and full names', () => {
            expect(matchesPattern('OHS', 'OHS')).toBe(true);
            expect(matchesPattern('OpenHostService', 'OHS')).toBe(true);
            expect(matchesPattern('OHS', 'OpenHostService')).toBe(true);
            expect(matchesPattern('SK', 'SharedKernel')).toBe(true);
            expect(matchesPattern('SharedKernel', 'SK')).toBe(true);
        });
        
        test('matchesPattern is case-insensitive', () => {
            expect(matchesPattern('ohs', 'OHS')).toBe(true);
            expect(matchesPattern('OHS', 'ohs')).toBe(true);
            expect(matchesPattern('sharedkernel', 'SK')).toBe(true);
        });
    });
});

// Helper functions

function findFirst<T>(model: unknown, guard: (node: unknown) => node is T): T | undefined {
    for (const node of AstUtils.streamAllContents(model as import('langium').AstNode)) {
        if (guard(node)) {
            return node;
        }
    }
    return undefined;
}

function findFirstRelationship(model: unknown): Relationship | undefined {
    for (const node of AstUtils.streamAllContents(model as import('langium').AstNode)) {
        if (isBoundedContext(node) && node.relationships.length > 0) {
            return node.relationships[0];
        }
        if (isContextMap(node) && node.relationships.length > 0) {
            return node.relationships[0];
        }
    }
    return undefined;
}
