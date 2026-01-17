/**
 * Terminology and Glossary Tests
 * 
 * Tests for DomainTerm parsing including synonyms, examples, and meaning definitions.
 * Validates the ubiquitous language feature of DDD.
 */

import { describe, test, beforeAll, expect } from 'vitest';
import type { TestServices } from '../test-helpers.js';
import { setupTestSuite, expectValidDocument, getFirstBoundedContext, s } from '../test-helpers.js';

let testServices: TestServices;

beforeAll(() => {
    testServices = setupTestSuite();
});

// ============================================================================
// BASIC TERMINOLOGY PARSING
// ============================================================================

describe('Basic Terminology Parsing', () => {
    test('should parse simple term definition', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                terminology {
                    term Order: "A customer purchase request"
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terms = bc.terminology ?? [];
        
        expect(terms).toBeDefined();
        expect(terms).toHaveLength(1);
        expect(terms[0].name).toBe('Order');
        expect(terms[0].meaning).toBe('A customer purchase request');
    });

    test('should parse term without meaning', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                terminology {
                    term Order
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terms = bc.terminology ?? [];
        
        expect(terms[0].name).toBe('Order');
        expect(terms[0].meaning).toBeUndefined();
    });

    test('should parse multiple terms', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                terminology {
                    term Order: "A customer purchase request"
                    term Customer: "A person who places orders"
                    term Product: "An item available for purchase"
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terms = bc.terminology ?? [];
        
        expect(terms).toHaveLength(3);
        expect(terms.map((t: any) => t.name)).toEqual(['Order', 'Customer', 'Product']);
    });
});

// ============================================================================
// TERM KEYWORD VARIANTS
// ============================================================================

describe('Term Keyword Variants', () => {
    test('should parse Term with capital T', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                terminology {
                    Term Order: "A customer purchase request"
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terms = bc.terminology ?? [];
        expect(terms[0].name).toBe('Order');
    });
});

// ============================================================================
// TERMINOLOGY BLOCK KEYWORD VARIANTS
// ============================================================================

describe('Terminology Block Keyword Variants', () => {
    test('should parse language keyword', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                language {
                    term Order: "A customer purchase request"
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terms = bc.terminology ?? [];
        expect(terms).toBeDefined();
    });

    test('should parse glossary keyword', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                glossary {
                    term Order: "A customer purchase request"
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terms = bc.terminology ?? [];
        expect(terms).toBeDefined();
    });

    test('should parse ubiquitous language keyword', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                ubiquitous language {
                    term Order: "A customer purchase request"
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terms = bc.terminology ?? [];
        expect(terms).toBeDefined();
    });
});

// ============================================================================
// SYNONYMS
// ============================================================================

describe('Term Synonyms', () => {
    test('should parse term with aka keyword', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                terminology {
                    term Customer: "A person who places orders" aka Client
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terms = bc.terminology ?? [];
        
        expect(terms[0].synonyms).toHaveLength(1);
        expect(terms[0].synonyms[0]).toBe('Client');
    });

    test('should parse term with multiple synonyms using aka', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                terminology {
                    term Customer: "A person who places orders" aka Client, Buyer, Purchaser
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terms = bc.terminology ?? [];
        
        expect(terms[0].synonyms).toHaveLength(3);
        expect(terms[0].synonyms).toEqual(['Client', 'Buyer', 'Purchaser']);
    });

    test('should parse term with synonyms keyword', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                terminology {
                    term Product: "An item for sale" synonyms Item, Good, Merchandise
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terms = bc.terminology ?? [];
        
        expect(terms[0].synonyms).toEqual(['Item', 'Good', 'Merchandise']);
    });
});

// ============================================================================
// EXAMPLES
// ============================================================================

describe('Term Examples', () => {
    test('should parse term with examples keyword', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                terminology {
                    term Product: "An item for sale" examples "Laptop", "Mouse"
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terms = bc.terminology ?? [];
        
        expect(terms[0].examples).toHaveLength(2);
        expect(terms[0].examples).toEqual(['Laptop', 'Mouse']);
    });


});

// ============================================================================
// COMPLEX TERM DEFINITIONS
// ============================================================================

describe('Complex Term Definitions', () => {
    test('should parse term with meaning, synonyms, and examples', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                terminology {
                    term Customer: "A person or organization that purchases products" aka Client, Buyer examples "Acme Corp", "John Doe"
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terms = bc.terminology ?? [];
        const term = terms[0];
        
        expect(term.name).toBe('Customer');
        expect(term.meaning).toBe('A person or organization that purchases products');
        expect(term.synonyms).toEqual(['Client', 'Buyer']);
        expect(term.examples).toEqual(['Acme Corp', 'John Doe']);
    });

    test('should parse multiple complex terms', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                terminology {
                    term Order: "Purchase request" aka Purchase examples "ORD-001", "ORD-002"
                    Term LineItem: "Single product in order" synonyms OrderLine
                    Term Discount: "Price reduction" examples "10% off", "Buy one get one"
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terms = bc.terminology ?? [];
        
        expect(terms).toHaveLength(3);
        expect(terms[0].synonyms).toEqual(['Purchase']);
        expect(terms[1].synonyms).toEqual(['OrderLine']);
        expect(terms[2].examples).toHaveLength(2);
    });
});

// ============================================================================
// ASSIGNMENT OPERATOR VARIANTS
// ============================================================================

describe('Term Assignment Operators', () => {
    test('should parse term with colon assignment', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                terminology {
                    term Order: "A purchase request"
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should parse term with is assignment', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                terminology {
                    term Order is "A purchase request"
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    test('should parse term with equals assignment', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                terminology {
                    term Order = "A purchase request"
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
// EDGE CASES
// ============================================================================

describe('Terminology Edge Cases', () => {
    test('should handle empty terminology block', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                terminology { }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terms = bc.terminology ?? [];
        expect(terms).toHaveLength(0);
    });

    test('should parse terms with hyphens in names', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                terminology {
                    term line-item: "A single line in an order"
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terms = bc.terminology ?? [];
        expect(terms[0].name).toBe('line-item');
    });

    test('should parse terms with underscores in names', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                terminology {
                    term order_id: "Unique order identifier"
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terms = bc.terminology ?? [];
        expect(terms[0].name).toBe('order_id');
    });

    test('should handle terms with comma separators', async () => {
        // Arrange
        const input = s`
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                terminology {
                    term Order: "A purchase request",
                    term Customer: "A person placing orders"
                }
            }
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terms = bc.terminology ?? [];
        expect(terms).toHaveLength(2);
    });
});
