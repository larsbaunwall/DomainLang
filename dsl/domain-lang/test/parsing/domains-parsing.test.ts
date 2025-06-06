import { beforeAll, describe, expect, test } from "vitest";
import { EmptyFileSystem, type LangiumDocument } from "langium";
import { expandToString as s } from "langium/generate";
import { parseHelper } from "langium/test";
import { createDomainLangServices } from "../../src/language/domain-lang-module.js";
import { Model, isDomain, isDomainMap, isModel, isGroupDeclaration } from "../../src/language/generated/ast.js";
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

describe('Parsing domain entities', () => {

    test('parse test file succesfully', async () => {
        let document = await parseTestFile('domains-parsing-fixture.dlang');
        expect(isDocumentValid(document)).toBe(true);
    });

    test('parse multiple domains', async () => {
        let document = await parseTestFile('domains-parsing-fixture.dlang');
        let group = document.parseResult.value?.children.find((e: any) => isGroupDeclaration(e) && e.name === 'test');
        if (!group) throw new Error('Test group not found');
        let domains = (group as any).children.filter((e: any) => isDomain(e));

        expect(domains.length).toBe(3);
        expect(domains.map((e: any) => e.name).join(',')).toBe('Ordering,SupplyChain,Orders');
        // Check that each domain has a documentation block with description and vision
        for (const d of domains) {
            const docBlock = d.documentation;
            expect(docBlock.some((b: any) => b.description)).toBe(true);
            expect(docBlock.some((b: any) => b.vision)).toBe(true);
        }
    });

    test('parse a domain vision', async () => {
        let document = await parseTestFile('domains-parsing-fixture.dlang');
        let group = document.parseResult.value?.children.find((e: any) => isGroupDeclaration(e) && e.name === 'test');
        if (!group) throw new Error('Test group not found');
        let domain = (group as any).children.find((e: any) => isDomain(e) && e.name === 'Ordering');
        const visionBlock = domain.documentation.find((b: any) => b.vision);
        expect(visionBlock).toBeDefined();
        expect(visionBlock.vision).toBe('Impeccable one-click ordering process');
    });

    test('parse a subdomain', async () => {
        let document = await parseTestFile('domains-parsing-fixture.dlang');
        let group = document.parseResult.value?.children.find((e: any) => isGroupDeclaration(e) && e.name === 'test');
        if (!group) throw new Error('Test group not found');
        let domain = (group as any).children.find((e: any) => isDomain(e) && e.name === 'Orders');
        expect(domain.parentDomain?.ref?.name).toBe('Ordering');
    });

    test('parse the domain map', async () => {
        let document = await parseTestFile('domains-parsing-fixture.dlang');
        let group = document.parseResult.value?.children.find((e: any) => isGroupDeclaration(e) && e.name === 'test');
        if (!group) throw new Error('Test group not found');
        let domainMaps = (group as any).children.filter((e: any) => isDomainMap(e));
        let fulfilmentMap = domainMaps[0];
        expect(domainMaps.length).toBe(1);
        expect(fulfilmentMap.name).toBe('FulfilmentMap');
        expect(fulfilmentMap.domains.map((d: any) => d.ref?.name).join(',')).toBe('Ordering,SupplyChain');
    });
});

async function parseTestFile(path: string): Promise<LangiumDocument<Model>> {
    const fullPath = join(__dirname, path);
    return await parse(fs.readFileSync(fullPath, 'utf8'));
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
