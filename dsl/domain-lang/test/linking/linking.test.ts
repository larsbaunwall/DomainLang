import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { EmptyFileSystem, type LangiumDocument } from "langium";
import { expandToString as s } from "langium/generate";
import { clearDocuments, parseHelper } from "langium/test";
import { createDomainLangServices } from "../../src/language/domain-lang-module.js";
import { Container, ContextMap, Model, Relationship, isModel } from "../../src/language/generated/ast.js";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

let services: ReturnType<typeof createDomainLangServices>;
let parse:    ReturnType<typeof parseHelper<Model>>;
let document: LangiumDocument<Model> | undefined;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
        }`, {validation: true});

        // Document is valid because the references are not checked in the parser
        expect(checkDocumentValid(document)).toBeUndefined();

        // But the references are not resolved
        let ctxMap = document.parseResult.value?.children[0] as ContextMap;
        expect(ctxMap.relationships.length).toBe(1);
        
        let rel = ctxMap.relationships[0];

        expect(rel.inferredType).toBe('UpstreamDownstream');

        expect(rel.left.link?.ref).toBeUndefined();
        expect(rel.left.link?.error).toBeDefined();

        expect(rel.right.link?.ref).toBeUndefined();
        expect(rel.right.link?.error).toBeDefined();
    });

    test('succeed if references can be found', async () => {
        let document = await parse(`
            group TestPackage {
            
                ContextMap CorrectMap {
                    OtherPackage.PaymentBC <- OrdersBC
                }
                
                BoundedContext OrdersBC {
                }
            }
            
            group OtherPackage {
                BoundedContext PaymentBC {
                }
            }
        `, {validation: true});

        // Document is valid because the references are not checked in the parser
        expect(checkDocumentValid(document)).toBeUndefined();

        // Now the references are resolved
        let ctxMap = document.parseResult.value?.children.flatMap(e => (e as Container)?.children).find(e => e.$type === 'ContextMap') as ContextMap;
        expect(ctxMap.relationships.length).toBe(1);
        
        let rel = ctxMap.relationships[0];

        expect(rel.inferredType).toBe('UpstreamDownstream');

        expect(rel.left.link?.ref).toBeDefined();
        expect(rel.left.link?.error).toBeUndefined()

        expect(rel.right.link?.ref).toBeDefined();
        expect(rel.right.link?.error).toBeUndefined()
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
