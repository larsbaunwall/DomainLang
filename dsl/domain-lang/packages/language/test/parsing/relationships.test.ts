/**
 * Relationship Tests
 * 
 * Tests for relationship definitions including:
 * - Arrow types (directional, bidirectional)
 * - DDD patterns (OHS, CF, ACL, PL, P, SK, BBoM)
 * - Relationship types (Partnership, SharedKernel, etc.)
 * - Multiple roles on relationships
 */

import { describe, test, beforeAll, expect } from 'vitest';
import type { TestServices } from '../test-helpers.js';
import { setupTestSuite, expectValidDocument, s } from '../test-helpers.js';
import type { ContextMap, Relationship } from '../../src/generated/ast.js';
import { isContextMap } from '../../src/generated/ast.js';

let testServices: TestServices;

beforeAll(() => {
    testServices = setupTestSuite();
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getRelationships(document: any): Relationship[] {
    const contextMap = document.parseResult.value.children.find(isContextMap) as ContextMap;
    return contextMap?.relationships ?? [];
}

// ============================================================================
// ARROW TYPES
// ============================================================================

describe('Relationship Arrow Types', () => {
    test('should parse downstream arrow (->) ', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales
            
            ContextMap TestMap {
                contains OrderContext, PaymentContext
                OrderContext -> PaymentContext
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const relationships = getRelationships(document);
        expect(relationships[0].arrow).toBe('->');
    });

    test('should parse upstream arrow (<-)', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales
            
            ContextMap TestMap {
                contains OrderContext, PaymentContext
                OrderContext <- PaymentContext
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const relationships = getRelationships(document);
        expect(relationships[0].arrow).toBe('<-');
    });

    test('should parse bidirectional arrow (<->)', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales
            
            ContextMap TestMap {
                contains OrderContext, PaymentContext
                OrderContext <-> PaymentContext
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const relationships = getRelationships(document);
        expect(relationships[0].arrow).toBe('<->');
    });

    test('should parse mutual dependency arrow (><)', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales
            
            ContextMap TestMap {
                contains OrderContext, PaymentContext
                OrderContext >< PaymentContext
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const relationships = getRelationships(document);
        expect(relationships[0].arrow).toBe('><');
    });

    // NOTE: U/D, u/d, C/S, c/s arrow aliases removed - use symbolic arrows (-> <- <-> ><) with explicit type
});

// ============================================================================
// DDD PATTERNS (ROLES)
// ============================================================================

describe('DDD Pattern Annotations', () => {
    test('should parse Open Host Service [OHS]', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales
            
            ContextMap TestMap {
                contains OrderContext, PaymentContext
                [OHS] OrderContext -> PaymentContext
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const relationships = getRelationships(document);
        expect(relationships[0].leftPatterns).toContain('OHS');
    });

    test('should parse Conformist [CF]', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales
            
            ContextMap TestMap {
                contains OrderContext, PaymentContext
                OrderContext -> [CF] PaymentContext
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const relationships = getRelationships(document);
        expect(relationships[0].rightPatterns).toContain('CF');
    });

    test('should parse Anti-Corruption Layer [ACL]', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales
            
            ContextMap TestMap {
                contains OrderContext, PaymentContext
                [ACL] OrderContext -> PaymentContext
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const relationships = getRelationships(document);
        expect(relationships[0].leftPatterns).toContain('ACL');
    });

    test('should parse Published Language [PL]', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales
            
            ContextMap TestMap {
                contains OrderContext, PaymentContext
                [PL] OrderContext -> PaymentContext
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const relationships = getRelationships(document);
        expect(relationships[0].leftPatterns).toContain('PL');
    });

    test('should parse Partnership [P]', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales
            
            ContextMap TestMap {
                contains OrderContext, PaymentContext
                [P] OrderContext <-> PaymentContext
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const relationships = getRelationships(document);
        expect(relationships[0].leftPatterns).toContain('P');
    });

    test('should parse Shared Kernel [SK]', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales
            
            ContextMap TestMap {
                contains OrderContext, PaymentContext
                [SK] OrderContext <-> PaymentContext
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const relationships = getRelationships(document);
        expect(relationships[0].leftPatterns).toContain('SK');
    });

    test('should parse Big Ball of Mud [BBoM]', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales
            
            ContextMap TestMap {
                contains OrderContext, PaymentContext
                [BBoM] OrderContext -> PaymentContext
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const relationships = getRelationships(document);
        expect(relationships[0].leftPatterns).toContain('BBoM');
    });

    test('should parse patterns on both sides', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales
            
            ContextMap TestMap {
                contains OrderContext, PaymentContext
                [OHS] OrderContext -> [CF] PaymentContext
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const relationships = getRelationships(document);
        expect(relationships[0].leftPatterns).toContain('OHS');
        expect(relationships[0].rightPatterns).toContain('CF');
    });

    test('should parse multiple patterns on one side', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales
            
            ContextMap TestMap {
                contains OrderContext, PaymentContext
                [OHS, PL] OrderContext -> [CF, ACL] PaymentContext
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const relationships = getRelationships(document);
        expect(relationships[0].leftPatterns).toContain('OHS');
        expect(relationships[0].leftPatterns).toContain('PL');
        expect(relationships[0].rightPatterns).toContain('CF');
        expect(relationships[0].rightPatterns).toContain('ACL');
    });
});

// ============================================================================
// DDD PATTERNS - LONG-FORM ALIASES
// ============================================================================

describe('DDD Pattern Annotations - Long-form Aliases', () => {
    test('should parse [PublishedLanguage] (long-form of PL)', async () => {
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales
            
            ContextMap TestMap {
                contains OrderContext, PaymentContext
                [PublishedLanguage] OrderContext -> PaymentContext
            }
        `;
        const document = await testServices.parse(input);
        expectValidDocument(document);
        const relationships = getRelationships(document);
        expect(relationships[0].leftPatterns).toContain('PublishedLanguage');
    });

    test('should parse [OpenHostService] (long-form of OHS)', async () => {
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales
            
            ContextMap TestMap {
                contains OrderContext, PaymentContext
                [OpenHostService] OrderContext -> PaymentContext
            }
        `;
        const document = await testServices.parse(input);
        expectValidDocument(document);
        const relationships = getRelationships(document);
        expect(relationships[0].leftPatterns).toContain('OpenHostService');
    });

    test('should parse [Conformist] (long-form of CF)', async () => {
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales
            
            ContextMap TestMap {
                contains OrderContext, PaymentContext
                OrderContext -> [Conformist] PaymentContext
            }
        `;
        const document = await testServices.parse(input);
        expectValidDocument(document);
        const relationships = getRelationships(document);
        expect(relationships[0].rightPatterns).toContain('Conformist');
    });

    test('should parse [AntiCorruptionLayer] (long-form of ACL)', async () => {
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales
            
            ContextMap TestMap {
                contains OrderContext, PaymentContext
                OrderContext -> [AntiCorruptionLayer] PaymentContext
            }
        `;
        const document = await testServices.parse(input);
        expectValidDocument(document);
        const relationships = getRelationships(document);
        expect(relationships[0].rightPatterns).toContain('AntiCorruptionLayer');
    });

    test('should parse [Partnership] (long-form of P)', async () => {
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales
            
            ContextMap TestMap {
                contains OrderContext, PaymentContext
                [Partnership] OrderContext <-> PaymentContext
            }
        `;
        const document = await testServices.parse(input);
        expectValidDocument(document);
        const relationships = getRelationships(document);
        expect(relationships[0].leftPatterns).toContain('Partnership');
    });

    test('should parse [SharedKernel] (long-form of SK)', async () => {
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales
            
            ContextMap TestMap {
                contains OrderContext, PaymentContext
                [SharedKernel] OrderContext <-> PaymentContext
            }
        `;
        const document = await testServices.parse(input);
        expectValidDocument(document);
        const relationships = getRelationships(document);
        expect(relationships[0].leftPatterns).toContain('SharedKernel');
    });

    test('should parse [BigBallOfMud] (long-form of BBoM)', async () => {
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales
            
            ContextMap TestMap {
                contains OrderContext, PaymentContext
                [BigBallOfMud] OrderContext -> PaymentContext
            }
        `;
        const document = await testServices.parse(input);
        expectValidDocument(document);
        const relationships = getRelationships(document);
        expect(relationships[0].leftPatterns).toContain('BigBallOfMud');
    });

    test('should parse mixed short and long-form patterns', async () => {
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales
            
            ContextMap TestMap {
                contains OrderContext, PaymentContext
                [OpenHostService, PL] OrderContext -> [Conformist, ACL] PaymentContext
            }
        `;
        const document = await testServices.parse(input);
        expectValidDocument(document);
        const relationships = getRelationships(document);
        expect(relationships[0].leftPatterns).toContain('OpenHostService');
        expect(relationships[0].leftPatterns).toContain('PL');
        expect(relationships[0].rightPatterns).toContain('Conformist');
        expect(relationships[0].rightPatterns).toContain('ACL');
    });
});

// ============================================================================
// RELATIONSHIP TYPES
// ============================================================================

describe('Relationship Types', () => {
    test('should parse Partnership type', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales
            
            ContextMap TestMap {
                contains OrderContext, PaymentContext
                OrderContext <-> PaymentContext : Partnership
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const relationships = getRelationships(document);
        expect(relationships[0].type).toBe('Partnership');
    });

    test('should parse SharedKernel type', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales
            
            ContextMap TestMap {
                contains OrderContext, PaymentContext
                OrderContext <-> PaymentContext : SharedKernel
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const relationships = getRelationships(document);
        expect(relationships[0].type).toBe('SharedKernel');
    });

    test('should parse CustomerSupplier type', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales
            
            ContextMap TestMap {
                contains OrderContext, PaymentContext
                OrderContext -> PaymentContext : CustomerSupplier
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const relationships = getRelationships(document);
        expect(relationships[0].type).toBe('CustomerSupplier');
    });

    test('should parse UpstreamDownstream type', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales
            
            ContextMap TestMap {
                contains OrderContext, PaymentContext
                OrderContext -> PaymentContext : UpstreamDownstream
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const relationships = getRelationships(document);
        expect(relationships[0].type).toBe('UpstreamDownstream');
    });

    test('should parse SeparateWays type', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales
            
            ContextMap TestMap {
                contains OrderContext, PaymentContext
                OrderContext >< PaymentContext : SeparateWays
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const relationships = getRelationships(document);
        expect(relationships[0].type).toBe('SeparateWays');
    });
});

// ============================================================================
// COMBINED PATTERNS AND TYPES
// ============================================================================

describe('Combined Patterns and Types', () => {
    test('should parse patterns with relationship type', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales
            
            ContextMap TestMap {
                contains OrderContext, PaymentContext
                [OHS] OrderContext -> [CF] PaymentContext : CustomerSupplier
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const relationships = getRelationships(document);
        expect(relationships[0].leftPatterns).toContain('OHS');
        expect(relationships[0].rightPatterns).toContain('CF');
        expect(relationships[0].type).toBe('CustomerSupplier');
    });

    test('should parse multiple relationships in one context map', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales
            BC InventoryContext for Sales
            
            ContextMap TestMap {
                contains OrderContext, PaymentContext, InventoryContext
                [OHS] OrderContext -> [CF] PaymentContext : CustomerSupplier
                OrderContext <-> InventoryContext : Partnership
                [ACL] PaymentContext <- InventoryContext
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const relationships = getRelationships(document);
        expect(relationships).toHaveLength(3);
    });
});

// ============================================================================
// BC INTERNAL RELATIONSHIPS
// ============================================================================

describe('BC Internal Relationships', () => {
    test('should parse this reference on left side', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales {
                relationships {
                    this -> OrderContext
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should parse this reference with patterns', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales {
                relationships {
                    [OHS] this -> [CF] OrderContext : CustomerSupplier
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should parse multiple relationships in BC', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC InventoryContext for Sales
            BC PaymentContext for Sales {
                relationships {
                    this -> OrderContext
                    this <-> InventoryContext
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should parse relationships with commas', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales
            
            ContextMap TestMap {
                contains OrderContext, PaymentContext
                OrderContext -> PaymentContext,
                PaymentContext <- OrderContext
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const relationships = getRelationships(document);
        expect(relationships).toHaveLength(2);
    });
});
