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
            Domain Sales:
            
            BoundedContext OrderContext:
                for: Sales
                terminology:
                    - Order: "A customer purchase request"
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terminologyBlock = bc.documentation?.find(d => 'terms' in d) as any;
        
        expect(terminologyBlock).toBeDefined();
        expect(terminologyBlock.terms).toHaveLength(1);
        expect(terminologyBlock.terms[0].name).toBe('Order');
        expect(terminologyBlock.terms[0].meaning).toBe('A customer purchase request');
    });

    test('should parse term without meaning', async () => {
        // Arrange
        const input = s`
            Domain Sales:
            
            BoundedContext OrderContext:
                for: Sales
                terminology:
                    - Order
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terminologyBlock = bc.documentation?.find(d => 'terms' in d) as any;
        
        expect(terminologyBlock.terms[0].name).toBe('Order');
        expect(terminologyBlock.terms[0].meaning).toBeUndefined();
    });

    test('should parse multiple terms', async () => {
        // Arrange
        const input = s`
            Domain Sales:
            
            BoundedContext OrderContext:
                for: Sales
                terminology:
                    - Order: "A customer purchase request"
                    - Customer: "A person who places orders"
                    - Product: "An item available for purchase"
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terminologyBlock = bc.documentation?.find(d => 'terms' in d) as any;
        
        expect(terminologyBlock.terms).toHaveLength(3);
        expect(terminologyBlock.terms.map((t: any) => t.name)).toEqual(['Order', 'Customer', 'Product']);
    });
});

// ============================================================================
// TERM KEYWORD VARIANTS
// ============================================================================

describe('Term Keyword Variants', () => {
    test('should parse Term with capital T', async () => {
        // Arrange
        const input = s`
            Domain Sales:
            
            BoundedContext OrderContext:
                for: Sales
                terminology:
                    - Order: "A customer purchase request"
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terminologyBlock = bc.documentation?.find(d => 'terms' in d) as any;
        expect(terminologyBlock.terms[0].name).toBe('Order');
    });
});

// ============================================================================
// TERMINOLOGY BLOCK KEYWORD VARIANTS
// ============================================================================

describe('Terminology Block Keyword Variants', () => {
    test('should parse language keyword', async () => {
        // Arrange
        const input = s`
            Domain Sales:
            
            BoundedContext OrderContext:
                for: Sales
                language:
                    - Order: "A customer purchase request"
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terminologyBlock = bc.documentation?.find(d => 'terms' in d) as any;
        expect(terminologyBlock).toBeDefined();
    });

    test('should parse glossary keyword', async () => {
        // Arrange
        const input = s`
            Domain Sales:
            
            BoundedContext OrderContext:
                for: Sales
                glossary:
                    - Order: "A customer purchase request"
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terminologyBlock = bc.documentation?.find(d => 'terms' in d) as any;
        expect(terminologyBlock).toBeDefined();
    });

    test('should parse ubiquitous language keyword', async () => {
        // Arrange
        const input = s`
            Domain Sales:
            
            BoundedContext OrderContext:
                for: Sales
                ubiquitous language:
                    - Order: "A customer purchase request"
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terminologyBlock = bc.documentation?.find(d => 'terms' in d) as any;
        expect(terminologyBlock).toBeDefined();
    });
});

// ============================================================================
// SYNONYMS
// ============================================================================

describe('Term Synonyms', () => {
    test('should parse term with aka keyword', async () => {
        // Arrange
        const input = s`
            Domain Sales:
            
            BoundedContext OrderContext:
                for: Sales
                terminology:
                    - Customer: "A person who places orders" aka: Client
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terminologyBlock = bc.documentation?.find(d => 'terms' in d) as any;
        
        expect(terminologyBlock.terms[0].synonyms).toHaveLength(1);
        expect(terminologyBlock.terms[0].synonyms[0]).toBe('Client');
    });

    test('should parse term with multiple synonyms using aka', async () => {
        // Arrange
        const input = s`
            Domain Sales:
            
            BoundedContext OrderContext:
                for: Sales
                terminology:
                    - Customer: "A person who places orders" aka: Client, Buyer, Purchaser
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terminologyBlock = bc.documentation?.find(d => 'terms' in d) as any;
        
        expect(terminologyBlock.terms[0].synonyms).toHaveLength(3);
        expect(terminologyBlock.terms[0].synonyms).toEqual(['Client', 'Buyer', 'Purchaser']);
    });

    test('should parse term with synonyms keyword', async () => {
        // Arrange
        const input = s`
            Domain Sales:
            
            BoundedContext OrderContext:
                for: Sales
                terminology:
                    - Product: "An item for sale" synonyms: Item, Good, Merchandise
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terminologyBlock = bc.documentation?.find(d => 'terms' in d) as any;
        
        expect(terminologyBlock.terms[0].synonyms).toEqual(['Item', 'Good', 'Merchandise']);
    });
});

// ============================================================================
// EXAMPLES
// ============================================================================

describe('Term Examples', () => {
    test('should parse term with examples keyword', async () => {
        // Arrange
        const input = s`
            Domain Sales:
            
            BoundedContext OrderContext:
                for: Sales
                terminology:
                    - Product: "An item for sale" examples: "Laptop", "Mouse"
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terminologyBlock = bc.documentation?.find(d => 'terms' in d) as any;
        
        expect(terminologyBlock.terms[0].examples).toHaveLength(2);
        expect(terminologyBlock.terms[0].examples).toEqual(['Laptop', 'Mouse']);
    });

    test('should parse term with e.g. keyword', async () => {
        // Arrange
        const input = s`
            Domain Sales:
            
            BoundedContext OrderContext:
                for: Sales
                terminology:
                    - PaymentMethod: "Way to pay" e.g.: "Credit Card", "PayPal", "Bank Transfer"
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terminologyBlock = bc.documentation?.find(d => 'terms' in d) as any;
        
        expect(terminologyBlock.terms[0].examples).toHaveLength(3);
    });
});

// ============================================================================
// COMPLEX TERM DEFINITIONS
// ============================================================================

describe('Complex Term Definitions', () => {
    test('should parse term with meaning, synonyms, and examples', async () => {
        // Arrange
        const input = s`
            Domain Sales:
            
            BoundedContext OrderContext:
                for: Sales
                terminology:
                    - Customer: "A person or organization that purchases products" aka: Client, Buyer examples: "Acme Corp", "John Doe"
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terminologyBlock = bc.documentation?.find(d => 'terms' in d) as any;
        const term = terminologyBlock.terms[0];
        
        expect(term.name).toBe('Customer');
        expect(term.meaning).toBe('A person or organization that purchases products');
        expect(term.synonyms).toEqual(['Client', 'Buyer']);
        expect(term.examples).toEqual(['Acme Corp', 'John Doe']);
    });

    test('should parse multiple complex terms', async () => {
        // Arrange
        const input = s`
            Domain Sales:
            
            BoundedContext OrderContext:
                for: Sales
                terminology:
                    - Order: "Purchase request" aka: Purchase examples: "ORD-001", "ORD-002"
                    - LineItem: "Single product in order" synonyms: OrderLine
                    - Discount: "Price reduction" e.g.: "10% off", "Buy one get one"
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terminologyBlock = bc.documentation?.find(d => 'terms' in d) as any;
        
        expect(terminologyBlock.terms).toHaveLength(3);
        expect(terminologyBlock.terms[0].synonyms).toEqual(['Purchase']);
        expect(terminologyBlock.terms[1].synonyms).toEqual(['OrderLine']);
        expect(terminologyBlock.terms[2].examples).toHaveLength(2);
    });
});

// ============================================================================
// ASSIGNMENT OPERATOR VARIANTS
// ============================================================================

describe('Term Assignment Operators', () => {
    test('should parse term with colon assignment', async () => {
        // Arrange
        const input = s`
            Domain Sales:
            
            BoundedContext OrderContext:
                for: Sales
                terminology:
                    - Order: "A purchase request"
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
    });

    // Note: 'is' and '=' assignment operators were removed in YAML-like syntax
    // Only colon ':' is now supported
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Terminology Edge Cases', () => {
    test('should handle empty terminology block', async () => {
        // Arrange
        const input = s`
            Domain Sales:
            
            BoundedContext OrderContext:
                for: Sales
                terminology:
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terminologyBlock = bc.documentation?.find(d => 'terms' in d) as any;
        expect(terminologyBlock.terms).toHaveLength(0);
    });

    test('should parse terms with hyphens in names', async () => {
        // Arrange
        const input = s`
            Domain Sales:
            
            BoundedContext OrderContext:
                for: Sales
                terminology:
                    - line-item: "A single line in an order"
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terminologyBlock = bc.documentation?.find(d => 'terms' in d) as any;
        expect(terminologyBlock.terms[0].name).toBe('line-item');
    });

    test('should parse terms with underscores in names', async () => {
        // Arrange
        const input = s`
            Domain Sales:
            
            BoundedContext OrderContext:
                for: Sales
                terminology:
                    - order_id: "Unique order identifier"
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terminologyBlock = bc.documentation?.find(d => 'terms' in d) as any;
        expect(terminologyBlock.terms[0].name).toBe('order_id');
    });

    test('should handle terms with multiple list items', async () => {
        // Arrange
        const input = s`
            Domain Sales:
            
            BoundedContext OrderContext:
                for: Sales
                terminology:
                    - Order: "A purchase request"
                    - Customer: "A person placing orders"
        `;

        // Act
        const document = await testServices.parse(input);

        // Assert
        expectValidDocument(document);
        const bc = getFirstBoundedContext(document);
        const terminologyBlock = bc.documentation?.find(d => 'terms' in d) as any;
        expect(terminologyBlock.terms).toHaveLength(2);
    });
});
