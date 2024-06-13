import { beforeAll, describe, expect, test } from "vitest";
import { EmptyFileSystem, type LangiumDocument } from "langium";
import { expandToString as s } from "langium/generate";
import { parseHelper } from "langium/test";
import { createDomainLangServices } from "../../src/language/domain-lang-module.js";
import { Domain, DomainMap, Model, isDomain, isDomainMap, isModel } from "../../src/language/generated/ast.js";
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

describe('Parsing domain entities', () => {

    test('parse test file succesfully', async () => {
        let document = await parseTestFile('domain-model.dlang');
        expect(isDocumentValid(document)).toBe(true);
    });

    test('parse domains', async () => {
        let document = await parseTestFile('domain-model.dlang');
        let domains = document.parseResult.value?.children.filter(e => isDomain(e));

        expect(domains.length).toBe(3);
        expect(domains.map(e => e.name).join(',')).toBe('Ordering,SupplyChain,Orders');
        expect(domains.map(d => d as Domain).map(d => d.vision).every(v => v !== undefined)).toBe(true);
    });

    test('parse a domain vision', async () => {
        let document = await parseTestFile('domain-model.dlang');
        let domain = document.parseResult.value?.children.find(e => isDomain(e) && e.name === 'Ordering') as Domain;

        expect(domain.vision).toBeDefined();
        expect(domain.vision).toBe('Impeccable one-click ordering process');

    });

    test('parse a subdomain', async () => {
        let document = await parseTestFile('domain-model.dlang');
        let domain = document.parseResult.value?.children.find(e => isDomain(e) && e.name === 'Orders') as Domain;

        expect(domain.parentDomain?.ref?.name).toBe('Ordering');

    });

    test('parse the domain map', async () => {
        let document = await parseTestFile('domain-model.dlang');
        let domainMaps = document.parseResult.value?.children.filter(e => isDomainMap(e));
        let fulfilmentMap = domainMaps[0] as DomainMap;

        expect(domainMaps.length).toBe(1);
        expect(fulfilmentMap.name).toBe('FulfilmentMap');
        expect(fulfilmentMap.domains.map(d => d.ref?.name).join(',')).toBe('Ordering,SupplyChain');
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
