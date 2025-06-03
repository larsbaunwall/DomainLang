import { beforeAll, describe, expect, test } from "vitest";
import { EmptyFileSystem, type LangiumDocument } from "langium";
import { expandToString as s } from "langium/generate";
import { parseHelper } from "langium/test";
import { createDomainLangServices } from "../../src/language/domain-lang-module.js";
import { ContextMap, Domain, DomainMap, Model, UpstreamDownstreamRelationship, isDomain, isDomainMap, isModel } from "../../src/language/generated/ast.js";
import fs from "fs";

let services: ReturnType<typeof createDomainLangServices>;
let parse:    ReturnType<typeof parseHelper<Model>>;
//let document: LangiumDocument<Model> | undefined;

beforeAll(async () => {
    services = createDomainLangServices(EmptyFileSystem);
    parse = parseHelper<Model>(services.DomainLang);

    // activate the following if your linking test requires elements from a built-in library, for example
    // await services.shared.workspace.WorkspaceManager.initializeWorkspace([]);
});

describe('Parsing relationships tests', () => {

    test('parse test file succesfully', async () => {
        let document = await parseTestFile('context-map.dlang');
        expect(isDocumentValid(document)).toBe(true);
    });

    test('parse upstream-downstream', async () => {
        let document = await parseTestFile('context-map.dlang');
        let ctxMap = document.parseResult.value?.children.find(e => e.name === 'eShopMap') as ContextMap;
        
        expect(ctxMap.relationships.length).toBe(1);

        let rel = ctxMap.relationships[0] as UpstreamDownstreamRelationship;
        expect(rel.downstream.$refText).toBe('OrdersBC');
        expect(rel.upstream.$refText).toBe('PaymentBC');

        expect(rel.upstreamRoles).toStrictEqual(['OHS']);
        expect(rel.downstreamRoles).toStrictEqual(['CF']);
    });


    test('fail roles are used in wrong direction', async () => {
        let document = await parse(`
            boundedcontext PaymentBC {}
            boundedcontext OrdersBC {}

            ContextMap FaultyMap {
                PaymentBC [U,CF] -> [D,ACL] OrdersBC
        }`);

        // Downstream role CF is not allowed in the upstream direction
        expect(isDocumentValid(document)).toBe(false);

        let ctxMap = document.parseResult.value?.children.find(e => e.name === 'FaultyMap') as ContextMap;
        let rel = ctxMap.relationships[0] as UpstreamDownstreamRelationship;
        expect(rel.upstreamRoles.length).toBe(0);
        expect(rel.downstreamRoles).toBeDefined();
    });

});

async function parseTestFile(path: string): Promise<LangiumDocument<Model>> {
    return await parse(fs.readFileSync(`test/parsing/${path}`, 'utf8'));
}

function isDocumentValid(document: LangiumDocument): boolean {
    return checkDocumentValid(document) === undefined;
}

function checkDocumentValid(document: LangiumDocument): string | undefined {
    return document.parseResult.parserErrors.length && s`
        Parser errors:
          ${document.parseResult.parserErrors.map(e => e.message).join('\n  ')}
    `
        || document.parseResult.value === undefined && `ParseResult is 'undefined'.`
        || !isModel(document.parseResult.value) && `Root AST object is a ${document.parseResult.value.$type}, expected a '${Model}'.`
        || undefined;
}
