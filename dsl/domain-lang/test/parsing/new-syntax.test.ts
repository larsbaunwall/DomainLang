/**
 * Tests for new simplified syntax features.
 * 
 * This test suite validates:
 * - BC shorthand syntax
 * - Inline role/team/domain assignments
 * - Flattened classifiers
 * - Categorized decisions
 * - PackageDeclaration
 * - ContextGroup
 * - Enhanced imports
 * - Relationship arrow shorthands (U/D, C/S)
 */

import { beforeAll, describe, expect, test } from "vitest";
import { EmptyFileSystem } from "langium";
import { expandToString as s } from "langium/generate";
import { parseHelper } from "langium/test";
import type { LangiumDocument } from 'langium';
import { createDomainLangServices } from "../../src/language/domain-lang-module.js";
import type { Model } from "../../src/language/generated/ast.js";
import { isBoundedContext, isContextGroup, isPackageDeclaration } from "../../src/language/generated/ast.js";

let services: ReturnType<typeof createDomainLangServices>;
let parse:    ReturnType<typeof parseHelper<Model>>;

function hasNoErrors(document: LangiumDocument): boolean {
    if (document.parseResult.lexerErrors.length > 0 || document.parseResult.parserErrors.length > 0) {
        console.log('Lexer errors:', document.parseResult.lexerErrors);
        console.log('Parser errors:', document.parseResult.parserErrors.map(e => e.message));
    }
    return document.parseResult.lexerErrors.length === 0 &&
           document.parseResult.parserErrors.length === 0;
}

beforeAll(() => {
    services = createDomainLangServices(EmptyFileSystem);
    parse = parseHelper<Model>(services.DomainLang);
});

describe('New Syntax Features', () => {

    test('BC shorthand with inline assignments', async () => {
        const input = s`
            Domain Sales {}
            Team ProductTeam
            Classification Core
            
            BC OrderContext for Sales as Core by ProductTeam
        `;
        
        const document = await parse(input);
        expect(hasNoErrors(document)).toBe(true);
        
        const model = document.parseResult.value;
        const bc = model.children.find(c => isBoundedContext(c));
        
        expect(bc).toBeDefined();
        expect(bc!.name).toBe('OrderContext');
        expect(bc!.domain?.ref?.name).toBe('Sales');  // Single reference now
        expect(bc!.inlineRole?.ref?.name).toBe('Core');
        expect(bc!.inlineTeam?.ref?.name).toBe('ProductTeam');
    });

    test('Flattened classifiers in BoundedContext', async () => {
        const input = s`
            Classification SaaS
            Classification Custom
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                businessModel: SaaS
                evolution: Custom
            }
        `;
        
        const document = await parse(input);
        expect(hasNoErrors(document)).toBe(true);
    });

    test('Categorized decisions', async () => {
        const input = s`
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                constraints {
                    decision [architectural] UseMicroservices: "Adopt microservices"
                    policy [business] RefundPolicy: "30-day returns"
                    rule [technical] UniqueOrderId: "Orders need unique IDs"
                }
            }
        `;
        
        const document = await parse(input);
        expect(hasNoErrors(document)).toBe(true);
    });

    test('PackageDeclaration', async () => {
        const input = s`
            package com.example {
                Domain Sales {}
            }
        `;
        
        const document = await parse(input);
        expect(hasNoErrors(document)).toBe(true);
        
        const model = document.parseResult.value;
        const pkg = model.children.find(c => isPackageDeclaration(c));
        
        expect(pkg).toBeDefined();
        expect(pkg!.name).toBe('com.example');
        expect(pkg!.children).toHaveLength(1);
    });

    test('ContextGroup', async () => {
        const input = s`
            Domain Sales {}
            Classification Core
            BC OrderContext for Sales
            BC PaymentContext for Sales
            
            ContextGroup CoreSales for Sales {
                role: Core
                contains OrderContext, PaymentContext
            }
        `;
        
        const document = await parse(input);
        expect(hasNoErrors(document)).toBe(true);
        
        const model = document.parseResult.value;
        const group = model.children.find(c => isContextGroup(c));
        
        expect(group).toBeDefined();
        expect(group!.name).toBe('CoreSales');
        expect(group!.domain?.ref?.name).toBe('Sales');
        expect(group!.contexts).toHaveLength(2);
    });

    test('Relationship arrow shorthands U/D', async () => {
        const input = s`
            Domain Sales {}
            BC Upstream for Sales
            BC Downstream for Sales
            
            ContextMap map {
                Upstream U/D Downstream
            }
        `;
        
        const document = await parse(input);
        expect(hasNoErrors(document)).toBe(true);
    });

    test('Relationship arrow shorthands C/S', async () => {
        const input = s`
            Domain Sales {}
            BC Customer for Sales
            BC Supplier for Sales
            
            ContextMap map {
                [PL] Customer C/S [ACL] Supplier
            }
        `;
        
        const document = await parse(input);
        expect(hasNoErrors(document)).toBe(true);
    });

    test('Rich terminology with synonyms and examples', async () => {
        const input = s`
            Domain Sales {}
            
            BC OrderContext for Sales {
                language {
                    term Product: "Item for sale"
                        aka: SKU, Item
                        examples: "Laptop", "Mouse"
                }
            }
        `;
        
        const document = await parse(input);
        expect(hasNoErrors(document)).toBe(true);
    });

    test('Multiple syntax alternatives work together', async () => {
        const input = s`
            // Classifications
            Classification Core
            Classification SaaS
            
            // Teams
            Team ProductTeam
            
            // Domain
            Domain Sales {
                vision: "Be the best"
            }
            
            // Using BC shorthand
            BC OrdersBC for Sales as Core by ProductTeam
            
            // Using Context keyword
            Context PaymentBC for Sales {
                description: "Handles payments"
                businessModel: SaaS
                
                language {
                    term Transaction: "A payment"
                        aka: Payment
                        examples: "Credit card payment"
                }
            }
            
            // Context map with new arrows
            ContextMap eCommerce {
                OrdersBC U/D PaymentBC
            }
        `;
        
        const document = await parse(input);
        expect(hasNoErrors(document)).toBe(true);
        
        const model = document.parseResult.value;
        const contexts = model.children.filter(c => isBoundedContext(c));
        expect(contexts).toHaveLength(2);
    });

});
