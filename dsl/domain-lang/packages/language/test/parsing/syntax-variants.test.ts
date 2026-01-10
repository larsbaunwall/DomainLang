/**
 * Syntax Variant Tests
 * 
 * Tests all keyword alternatives and syntactic sugar defined in the grammar.
 * Ensures that all documented syntax variants parse correctly.
 */

import { describe, test, beforeAll, expect } from 'vitest';
import type { TestServices } from '../test-helpers.js';
import { setupTestSuite, expectValidDocument, getFirstBoundedContext, getFirstDomain, s } from '../test-helpers.js';

let testServices: TestServices;

beforeAll(() => {
    testServices = setupTestSuite();
});

// ============================================================================
// DOMAIN KEYWORD VARIANTS
// ============================================================================

describe('Domain Keyword Variants', () => {
    test('should parse Domain with capital D', async () => {
        // Arrange
        const input = s`
            Domain Sales {
                vision: "Sales vision"
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        expect(getFirstDomain(document).name).toBe('Sales');
    });

    test('should parse domain with lowercase d', async () => {
        // Arrange
        const input = s`
            domain Sales {
                vision: "Sales vision"
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        expect(getFirstDomain(document).name).toBe('Sales');
    });
});

// ============================================================================
// BOUNDED CONTEXT KEYWORD VARIANTS
// ============================================================================

describe('BoundedContext Keyword Variants', () => {
    test('should parse BoundedContext keyword', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BoundedContext OrderContext for Sales
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        expect(getFirstBoundedContext(document).name).toBe('OrderContext');
    });

    test('should parse boundedcontext lowercase', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            boundedcontext OrderContext for Sales
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        expect(getFirstBoundedContext(document).name).toBe('OrderContext');
    });

    test('should parse BC shorthand', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        expect(getFirstBoundedContext(document).name).toBe('OrderContext');
    });
});

// ============================================================================
// TEAM KEYWORD VARIANTS
// ============================================================================

describe('Team Keyword Variants', () => {
    test('should parse Team with capital T', async () => {
        // Arrange
        const input = s`
            Team SalesTeam
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should parse team with lowercase t', async () => {
        // Arrange
        const input = s`
            team SalesTeam
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });
});

// ============================================================================
// CLASSIFICATION KEYWORD VARIANTS
// ============================================================================

describe('Classification Keyword Variants', () => {
    test('should parse Classification with capital C', async () => {
        // Arrange
        const input = s`
            Classification Core
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should parse classification with lowercase c', async () => {
        // Arrange
        const input = s`
            classification Core
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });
});

// ============================================================================
// CONTEXT MAP KEYWORD VARIANTS
// ============================================================================

describe('ContextMap Keyword Variants', () => {
    test('should parse ContextMap with capital letters', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            
            ContextMap SalesMap {
                contains OrderContext
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should parse contextmap lowercase', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            
            contextmap SalesMap {
                contains OrderContext
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });
});

// ============================================================================
// DOMAIN MAP KEYWORD VARIANTS
// ============================================================================

describe('DomainMap Keyword Variants', () => {
    test('should parse DomainMap with capital letters', async () => {
        // Arrange
        const input = s`
            Domain Sales {
                vision: "Sales domain"
            }
            
            DomainMap BusinessMap {
                contains Sales
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should parse domainmap lowercase', async () => {
        // Arrange
        const input = s`
            Domain Sales {
                vision: "Sales domain"
            }
            
            domainmap BusinessMap {
                contains Sales
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });
});

// ============================================================================
// NAMESPACE KEYWORD VARIANTS
// ============================================================================

describe('Namespace Keyword Variants', () => {
    test('should parse namespace with lowercase', async () => {
        // Arrange
        const input = s`
            namespace sales {
                Domain Sales {
                    vision: "Sales domain"
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should parse Namespace with capital N', async () => {
        // Arrange
        const input = s`
            Namespace sales {
                Domain Sales {
                    vision: "Sales domain"
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });
});

// ============================================================================
// INLINE BC ASSIGNMENT VARIANTS
// ============================================================================

describe('BC Inline Assignment Variants', () => {
    test('should parse as keyword for role', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            Classification Core
            BC OrderContext for Sales as Core
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        expect(bc.role?.ref?.name).toBe('Core');
    });

    test('should parse by keyword for team', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            Team SalesTeam
            BC OrderContext for Sales by SalesTeam
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        expect(bc.team?.ref?.name).toBe('SalesTeam');
    });
});

// ============================================================================
// BC DOCUMENTATION BLOCK VARIANTS
// ============================================================================

describe('BC Documentation Block Variants', () => {
    test('should parse team: keyword', async () => {
        // Arrange
        const input = s`
            Team SalesTeam
            Domain Sales {}
            BC OrderContext for Sales {
                team: SalesTeam
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should parse role keyword', async () => {
        // Arrange
        const input = s`
            Classification Core
            Domain Sales {}
            BC OrderContext for Sales {
                role: Core
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should parse businessModel keyword', async () => {
        // Arrange
        const input = s`
            Classification SaaS
            Domain Sales {}
            BC OrderContext for Sales {
                businessModel: SaaS
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should parse business model keywords', async () => {
        // Arrange
        const input = s`
            Classification SaaS
            Domain Sales {}
            BC OrderContext for Sales {
                business model: SaaS
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should parse evolution keyword', async () => {
        // Arrange
        const input = s`
            Classification Mature
            Domain Sales {}
            BC OrderContext for Sales {
                evolution: Mature
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should parse maturity keyword', async () => {
        // Arrange
        const input = s`
            Classification Mature
            Domain Sales {}
            BC OrderContext for Sales {
                maturity: Mature
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });
});

// ============================================================================
// RELATIONSHIPS BLOCK VARIANTS
// ============================================================================

describe('Relationships Block Variants', () => {
    test('should parse relationships keyword', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales
            BC InventoryContext for Sales {
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

    test('should parse integrations keyword', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales
            BC InventoryContext for Sales {
                integrations {
                    this -> OrderContext
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should parse connections keyword', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales
            BC PaymentContext for Sales
            BC InventoryContext for Sales {
                connections {
                    this -> OrderContext
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });
});

// ============================================================================
// DECISIONS BLOCK VARIANTS
// ============================================================================

describe('Decisions Block Variants', () => {
    test('should parse decisions keyword', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales {
                decisions {
                    decision EventSourcing: "Use event sourcing"
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should parse constraints keyword', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales {
                constraints {
                    decision EventSourcing: "Use event sourcing"
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should parse rules keyword', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales {
                rules {
                    decision EventSourcing: "Use event sourcing"
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should parse policies keyword', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales {
                policies {
                    decision EventSourcing: "Use event sourcing"
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });
});

// ============================================================================
// DECISION TYPE VARIANTS
// ============================================================================

describe('Decision Type Variants', () => {
    test('should parse decision keyword', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales {
                decisions {
                    decision EventSourcing: "Use event sourcing"
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should parse Decision with capital D', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales {
                decisions {
                    Decision EventSourcing: "Use event sourcing"
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should parse policy keyword', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales {
                decisions {
                    policy RefundPolicy: "30-day refunds"
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should parse Policy with capital P', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales {
                decisions {
                    Policy RefundPolicy: "30-day refunds"
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should parse rule keyword', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales {
                decisions {
                    rule UniqueIds: "All IDs must be unique"
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should parse Rule with capital R', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            BC OrderContext for Sales {
                decisions {
                    Rule UniqueIds: "All IDs must be unique"
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });
});

// ============================================================================
// ASSIGNMENT OPERATOR VARIANTS
// ============================================================================

describe('Assignment Operator Variants', () => {
    test('should parse colon assignment', async () => {
        // Arrange
        const input = s`
            Domain Sales {
                vision: "Sales vision"
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should parse is keyword assignment', async () => {
        // Arrange
        const input = s`
            Domain Sales {
                vision is "Sales vision"
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should parse equals assignment', async () => {
        // Arrange
        const input = s`
            Domain Sales {
                vision = "Sales vision"
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });
});
