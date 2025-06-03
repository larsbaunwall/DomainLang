import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { EmptyFileSystem, type LangiumDocument } from "langium";
import { expandToString as s } from "langium/generate";
import { clearDocuments, parseHelper } from "langium/test";
import { createDomainLangServices } from "../../src/language/domain-lang-module.js";
import { Container, ContextMap, Model, StructureElement, UpstreamDownstreamRelationship, isModel } from "../../src/language/generated/ast.js";

let services: ReturnType<typeof createDomainLangServices>;
let parse:    ReturnType<typeof parseHelper<Model>>;
let document: LangiumDocument<Model> | undefined;

beforeAll(async () => {
    services = createDomainLangServices(EmptyFileSystem);
    parse = parseHelper<Model>(services.DomainLang);

    // activate the following if your linking test requires elements from a built-in library, for example
    // await services.shared.workspace.WorkspaceManager.initializeWorkspace([]);
});

afterEach(async () => {
    document && clearDocuments(services.shared, [ document ]);
});

describe('Linking tests', () => {


    test('fail if references cannot be found', async () => {
        let document = await parse(`
            ContextMap FaultyMap {
                PaymentBC <- OrdersBC
        }`);

        // Document is valid because the references are not checked in the parser
        expect(checkDocumentValid(document)).toBeUndefined();

        // But the references are not resolved
        let ctxMap = document.parseResult.value?.children[0] as ContextMap;
        expect(ctxMap.relationships.length).toBe(1);
        
        let rel = ctxMap.relationships[0] as UpstreamDownstreamRelationship;
        expect(rel.downstream.ref).toBeUndefined();
        expect(rel.downstream.error).toBeDefined()

        expect(rel.upstream.ref).toBeUndefined();
        expect(rel.upstream.error).toBeDefined()
    });

    test('succeed if references can be found', async () => {
        let document = await parse(`
            package TestPackage {
            
                ContextMap CorrectMap {
                    OtherPackage.PaymentBC <- OrdersBC
                }
                
                BoundedContext OrdersBC {
                }
            }
            
            package OtherPackage {
                BoundedContext PaymentBC {
                }
            }
        `);

        // Document is valid because the references are not checked in the parser
        expect(checkDocumentValid(document)).toBeUndefined();

        // Now the references are resolved
        let ctxMap = document.parseResult.value?.children.flatMap(e => (e as Container)?.children).find(e => e.$type === 'ContextMap') as ContextMap;
        expect(ctxMap.relationships.length).toBe(1);
        
        let rel = ctxMap.relationships[0] as UpstreamDownstreamRelationship;
        expect(rel.downstream.ref).toBeDefined();
        expect(rel.downstream.error).toBeUndefined()

        expect(rel.upstream.ref).toBeDefined();
        expect(rel.upstream.error).toBeUndefined()
    });
});


function checkDocumentValid(document: LangiumDocument): string | undefined {
    return document.parseResult.parserErrors.length && s`
        Parser errors:
          ${document.parseResult.parserErrors.map(e => e.message).join('\n  ')}
    `
        || document.parseResult.value === undefined && `ParseResult is 'undefined'.`
        || !isModel(document.parseResult.value) && `Root AST object is a ${document.parseResult.value.$type}, expected a '${Model}'.`
        || undefined;
}
