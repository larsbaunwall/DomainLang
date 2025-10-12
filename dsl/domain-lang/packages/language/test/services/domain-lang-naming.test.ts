import { describe, expect, it } from 'vitest';
import { setupTestSuite, expectValidDocument } from '../test-helpers.js';
import { QualifiedNameProvider, toQualifiedName } from '../../src/lsp/domain-lang-naming.js';
import { isDomain, isNamespaceDeclaration } from '../../src/generated/ast.js';

const qualifiedNames = new QualifiedNameProvider();

describe('domain-lang naming utilities', () => {
    const { parse } = setupTestSuite();

    it('computes qualified names for nested namespaces', async () => {
        const document = await parse(`
            namespace strategic.core {
                namespace operations {
                    Domain Sales {}
                }
            }
        `);

        expectValidDocument(document);

        const model = document.parseResult.value;
        const rootNamespace = model.children.find(isNamespaceDeclaration);
        expect(rootNamespace).toBeDefined();

        const innerNamespace = rootNamespace?.children.find(isNamespaceDeclaration);
        expect(innerNamespace).toBeDefined();

        const domain = innerNamespace?.children.find(isDomain);
        expect(domain).toBeDefined();

        const qualifiedFromProvider = qualifiedNames.getQualifiedName(domain!.$container, domain!.name);
        expect(qualifiedFromProvider).toBe('strategic.core.operations.Sales');

        const qualifiedFromNamespace = toQualifiedName(innerNamespace!, domain!.name);
        expect(qualifiedFromNamespace).toBe('strategic.core.operations.Sales');
    });

    it('treats nested namespace blocks as dotted qualified names', async () => {
        const document = await parse(`
            namespace company {
                namespace sales {
                    Domain Orders {}
                }
            }
        `);

        expectValidDocument(document);

        const model = document.parseResult.value;
        const companyNamespace = model.children.find(isNamespaceDeclaration);
        expect(companyNamespace?.name).toBe('company');

        const salesNamespace = companyNamespace?.children.find(isNamespaceDeclaration);
        expect(salesNamespace?.name).toBe('sales');

        const domain = salesNamespace?.children.find(isDomain);
        expect(domain?.name).toBe('Orders');

        if (!salesNamespace || !domain) {
            return;
        }

        const qualified = qualifiedNames.getQualifiedName(domain.$container, domain.name);
        expect(qualified).toBe('company.sales.Orders');
    });
});
