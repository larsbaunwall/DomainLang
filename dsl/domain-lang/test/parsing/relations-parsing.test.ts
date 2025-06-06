import { beforeAll, describe, expect, test } from "vitest";
import { EmptyFileSystem, type LangiumDocument } from "langium";
import { expandToString as s } from "langium/generate";
import { parseHelper } from "langium/test";
import { createDomainLangServices } from "../../src/language/domain-lang-module.js";
import { ContextMap, Domain, DomainMap, Model, isDomain, isDomainMap, isModel, isGroupDeclaration, isContextMap } from "../../src/language/generated/ast.js";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

let services: ReturnType<typeof createDomainLangServices>;
let parse:    ReturnType<typeof parseHelper<Model>>;
//let document: LangiumDocument<Model> | undefined;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

beforeAll(async () => {
    services = createDomainLangServices(EmptyFileSystem);
    parse = parseHelper<Model>(services.DomainLang);

    // activate the following if your linking test requires elements from a built-in library, for example
    // await services.shared.workspace.WorkspaceManager.initializeWorkspace([]);
});

describe('Parsing relationships tests', () => {

    test('parse test file succesfully', async () => {
        let document = await parseTestFile('relations-parsing-fixture.dlang');
        expect(isDocumentValid(document)).toBe(true);
    });

    test('parse upstream-downstream', async () => {
        let document = await parseTestFile('relations-parsing-fixture.dlang');

        let group = document.parseResult.value?.children.find((e: any) => isGroupDeclaration(e) && e.name === 'test');
        if (!group) throw new Error('Test group not found');

        let ctxMap = (group as any).children.find((e: any) => isContextMap(e) && e.name === 'eShopMap');

        expect(ctxMap.relationships.length).toBe(1);
        
        let rel = ctxMap.relationships[0];
        expect(rel.left.link?.ref.name).toBe('PaymentBC');
        expect(rel.right.link?.ref.name).toBe('OrdersBC');
        expect(rel.type).toBe('UpstreamDownstream');
    });

});

async function parseTestFile(path: string): Promise<LangiumDocument<Model>> {
    const fullPath = join(__dirname, path);
    return await parse(fs.readFileSync(fullPath, 'utf8'));
}

function isDocumentValid(document: LangiumDocument): boolean {
    console.log(checkDocumentValid(document));
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
