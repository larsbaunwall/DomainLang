/**
 * Shared test utilities and fixtures for DomainLang testing.
 * 
 * This module provides:
 * - Reusable parsing helpers
 * - Common test fixtures
 * - Validation utilities
 * - AST assertion helpers
 */

import { afterEach, expect } from 'vitest';
import { EmptyFileSystem, type LangiumDocument } from 'langium';
import { expandToString as s } from 'langium/generate';
import { parseHelper, clearDocuments } from 'langium/test';
import type { Diagnostic } from 'vscode-languageserver-types';
import { createDomainLangServices } from '../src/domain-lang-module.js';
import type { Model, Domain, BoundedContext } from '../src/generated/ast.js';
import { isModel, isDomain, isBoundedContext } from '../src/generated/ast.js';

// ============================================================================
// TEST SETUP HELPERS
// ============================================================================

export interface TestServices {
    services: ReturnType<typeof createDomainLangServices>;
    parse: ReturnType<typeof parseHelper<Model>>;
}

/**
 * Creates a standard test setup for parsing tests.
 * Use this in beforeAll() to set up services and parsing helpers.
 */
export function createTestServices(): TestServices {
    const services = createDomainLangServices(EmptyFileSystem);
    const doParse = parseHelper<Model>(services.DomainLang);
    const parse = (input: string) => doParse(input, { validation: true });
    
    return { services, parse };
}

/**
 * Standard setup function for test suites that need document parsing.
 * Call this in beforeAll() and store the result.
 */
export function setupTestSuite(): TestServices {
    const testServices = createTestServices();
    
    // Clear documents after each test to avoid state leakage
    afterEach(() => {
        clearDocuments(testServices.services.shared, []);
    });
    
    return testServices;
}

// ============================================================================
// DOCUMENT VALIDATION HELPERS
// ============================================================================

/**
 * Checks if a document parsed successfully without errors.
 */
export function hasNoParsingErrors(document: LangiumDocument): boolean {
    return document.parseResult.parserErrors.length === 0 &&
           document.parseResult.lexerErrors.length === 0;
}

/**
 * Checks if a document is valid (no parsing or validation errors).
 */
export function isDocumentValid(document: LangiumDocument): boolean {
    return hasNoParsingErrors(document) && 
           document.parseResult.value !== undefined &&
           isModel(document.parseResult.value);
}

/**
 * Returns a detailed error message if document is invalid, undefined if valid.
 */
export function getDocumentErrors(document: LangiumDocument): string | undefined {
    if (document.parseResult.lexerErrors.length > 0) {
        return `Lexer errors:\n  ${document.parseResult.lexerErrors.map(e => e.message).join('\n  ')}`;
    }
    
    if (document.parseResult.parserErrors.length > 0) {
        return `Parser errors:\n  ${document.parseResult.parserErrors.map(e => e.message).join('\n  ')}`;
    }
    
    if (document.parseResult.value === undefined) {
        return `ParseResult value is undefined`;
    }
    
    if (!isModel(document.parseResult.value)) {
        return `Root AST object is a ${document.parseResult.value?.$type}, expected a Model`;
    }
    
    return undefined;
}

/**
 * Asserts that a document parsed successfully.
 */
export function expectValidDocument(document: LangiumDocument): void {
    const errors = getDocumentErrors(document);
    if (errors) {
        throw new Error(errors);
    }
}

/**
 * Extracts diagnostics of a specific severity level.
 */
export function getDiagnosticsBySeverity(
    document: LangiumDocument, 
    severity: 1 | 2 | 3 | 4 // Error | Warning | Info | Hint
): Diagnostic[] {
    return document.diagnostics?.filter(d => d.severity === severity) ?? [];
}

/**
 * Expects specific validation errors.
 */
export function expectValidationErrors(
    document: LangiumDocument,
    expectedMessages: string[]
): void {
    const errors = getDiagnosticsBySeverity(document, 1); // Error severity
    expect(errors).toHaveLength(expectedMessages.length);
    
    expectedMessages.forEach((message, index) => {
        expect(errors[index].message).toContain(message);
    });
}

/**
 * Expects specific validation warnings.
 */
export function expectValidationWarnings(
    document: LangiumDocument,
    expectedMessages: string[]
): void {
    const warnings = getDiagnosticsBySeverity(document, 2); // Warning severity
    expect(warnings).toHaveLength(expectedMessages.length);
    
    expectedMessages.forEach((message, index) => {
        expect(warnings[index].message).toContain(message);
    });
}

// ============================================================================
// AST EXTRACTION HELPERS
// ============================================================================

/**
 * Safely extracts the first domain from a model.
 */
export function getFirstDomain(document: LangiumDocument<Model>): Domain {
    expectValidDocument(document);
    const domain = document.parseResult.value.children.find(child => isDomain(child)) as Domain;
    expect(domain).toBeDefined();
    return domain;
}

/**
 * Safely extracts the first bounded context from a model.
 */
export function getFirstBoundedContext(document: LangiumDocument<Model>): BoundedContext {
    expectValidDocument(document);
    const bc = document.parseResult.value.children.find(child => isBoundedContext(child)) as BoundedContext;
    expect(bc).toBeDefined();
    return bc;
}

/**
 * Extracts all domains from a model.
 */
export function getAllDomains(document: LangiumDocument<Model>): Domain[] {
    expectValidDocument(document);
    return document.parseResult.value.children.filter(child => isDomain(child)) as Domain[];
}

/**
 * Extracts all bounded contexts from a model.
 */
export function getAllBoundedContexts(document: LangiumDocument<Model>): BoundedContext[] {
    expectValidDocument(document);
    return document.parseResult.value.children.filter(child => isBoundedContext(child)) as BoundedContext[];
}

// ============================================================================
// COMMON TEST FIXTURES
// ============================================================================

export const TestFixtures = {
    /**
     * Basic domain with description and vision.
     */
    basicDomain: () => s`
        Domain Sales {
            description: "Handles all sales operations"
            vision: "Streamlined sales process"
        }
    `,

    /**
     * Domain hierarchy with parent-child relationship.
     */
    domainHierarchy: () => s`
        Domain Commerce {
            description: "Main commerce domain"
            vision: "Complete e-commerce solution"
        }
        
        Domain Sales in Commerce {
            description: "Sales subdomain"
            vision: "Efficient sales management"
        }
        
        Domain Orders in Sales {
            description: "Order processing"
            vision: "Seamless order fulfillment"
        }
    `,

    /**
     * Bounded context with full documentation.
     */
    fullBoundedContext: () => s`
        Domain Sales {}
        Team SalesTeam
        Classification Core
        
        BoundedContext OrderManagement for Sales {
            description: "Manages customer orders"
            team: SalesTeam
            role: Core
            
            terminology {
                term Order: "A customer request for products"
                term Customer: "Person placing orders"
            }
            
            decisions {
                decision [architectural] EventSourcing: "Use event sourcing for order tracking"
                policy [business] RefundPolicy: "30-day return policy"
                rule [technical] UniqueOrderIds: "All orders must have unique identifiers"
            }
        }
    `,

    /**
     * Context map with relationships.
     */
    contextMapWithRelationships: () => s`
        Domain Sales {}
        Domain Payment {}
        
        BoundedContext OrderContext for Sales
        BoundedContext PaymentContext for Payment
        
        ContextMap ECommerceMap {
            contains OrderContext, PaymentContext
            
            [OHS] OrderContext -> [CF] PaymentContext : CustomerSupplier
            OrderContext <-> PaymentContext : Partnership
        }
    `,

    /**
     * Namespace declaration with nested elements.
     */
    namespaceDeclaration: () => s`
        Namespace com.example.sales {
            Domain Sales {
                description: "Sales domain in namespace"
            }
            
            BoundedContext OrderContext for Sales
        }
    `,

    /**
     * Import statements with various formats.
     */
    importStatements: () => s`
        import "./shared/types.dlang"
        import "owner/repo@v1.0.0" as DDD
        import { OrderContext, PaymentContext } from "./contexts.dlang"
        
        Domain Sales {}
    `,

    /**
     * Complex example with all major features.
     */
    complexExample: () => s`
        import "./shared.dlang" as Shared
        
        Namespace com.company.ecommerce {
            Team SalesTeam
            Team PaymentTeam
            Classification Core
            Classification Supporting
            
            Domain Commerce {
                description: "Main commerce domain"
                vision: "Complete e-commerce platform"
                classifier: Core
            }
            
            Domain Sales in Commerce {
                description: "Sales operations"
                vision: "Efficient sales management"
            }
            
            BoundedContext OrderManagement for Sales as Core by SalesTeam {
                description: "Order processing and management"
                
                relationships {
                    [OHS] this -> [CF] PaymentProcessing : CustomerSupplier
                }
                
                terminology {
                    term Order: "Customer purchase request"
                    define Customer: "Person placing orders" aka Client, Buyer
                    term Product: "Item for sale" examples "Laptop", "Mouse"
                }
                
                decisions {
                    decision [architectural] EventSourcing: "Use event sourcing"
                    policy [business] Returns: "30-day return policy"
                    rule [technical] Validation: "Validate all inputs"
                }
            }
            
            bc PaymentProcessing for Commerce as Supporting by PaymentTeam {
                description: "Payment processing"
            }
            
            ContextMap CommerceMap {
                contains OrderManagement, PaymentProcessing
                OrderManagement U/D PaymentProcessing
            }
            
            DomainMap BusinessMap {
                contains Commerce, Sales
            }
        }
    `
};

// ============================================================================
// GRAMMAR RULE TESTING HELPERS
// ============================================================================

/**
 * Tests that a grammar rule can parse successfully.
 */
export async function expectGrammarRuleParsesSuccessfully(
    parse: (input: string) => Promise<LangiumDocument<Model>>,
    input: string,
    ruleName: string
): Promise<LangiumDocument<Model>> {
    const document = await parse(input);
    
    if (!hasNoParsingErrors(document)) {
        const errors = getDocumentErrors(document);
        throw new Error(`${ruleName} rule failed to parse:\n${errors}\n\nInput:\n${input}`);
    }
    
    return document;
}

/**
 * Tests that a grammar rule rejects invalid input.
 */
export async function expectGrammarRuleRejectsInput(
    parse: (input: string) => Promise<LangiumDocument<Model>>,
    input: string,
    ruleName: string
): Promise<LangiumDocument<Model>> {
    const document = await parse(input);
    
    if (hasNoParsingErrors(document)) {
        throw new Error(`${ruleName} rule should have rejected invalid input:\n${input}`);
    }
    
    return document;
}

export { s }; // Re-export for convenience