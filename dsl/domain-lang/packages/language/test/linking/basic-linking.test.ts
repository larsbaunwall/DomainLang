
import { describe, test, beforeAll, expect } from 'vitest';
import type { TestServices } from '../test-helpers.js';
import { setupTestSuite, expectValidDocument, s } from '../test-helpers.js';
import type { ContextMap, StructureElement } from '../../src/generated/ast.js';
import { isContextMap, isNamespaceDeclaration } from '../../src/generated/ast.js';

let testServices: TestServices;

beforeAll(() => {
    testServices = setupTestSuite();
});

describe('Basic Linking', () => {
    test('should report unresolved references in ContextMap', async () => {
        // Arrange
        const input = s`
            ContextMap FaultyMap {
                PaymentBC <- OrdersBC
            }
        `;

        // Act
        const document = await testServices.parse(input);
        expectValidDocument(document);
        const ctxMap = document.parseResult.value.children.find(isContextMap);
        expect(ctxMap).toBeDefined();
        if (!ctxMap) {
            return;
        }
        const rel = ctxMap.relationships[0];

        // Assert
        expect(ctxMap.relationships.length).toBe(1);
        expect(rel.left.link?.ref).toBeUndefined();
        expect(rel.left.link?.error).toBeDefined();
        expect(rel.right.link?.ref).toBeUndefined();
        expect(rel.right.link?.error).toBeDefined();
    });

    test('should resolve references in ContextMap when present', async () => {
        // Arrange
        const input = s`
            namespace TestNamespace {
                ContextMap CorrectMap {
                    OtherNamespace.PaymentBC <- OrdersBC
                }
                BoundedContext OrdersBC {}
            }
            namespace OtherNamespace {
                BoundedContext PaymentBC {}
            }
        `;

        // Act
        const document = await testServices.parse(input);
        expectValidDocument(document);
        // Extract ContextMap from nested group structure
        const model = document.parseResult.value;
        const ctxMap = extractContextMaps(model.children)[0];
        expect(ctxMap).toBeDefined();
        if (!ctxMap) {
            return;
        }
        const rel = ctxMap.relationships[0];

        // Assert
        expect(ctxMap.relationships.length).toBe(1);

function extractContextMaps(elements: StructureElement[]): ContextMap[] {
    const collected: ContextMap[] = [];
    for (const element of elements) {
        if (isContextMap(element)) {
            collected.push(element);
        } else if (isNamespaceDeclaration(element)) {
            collected.push(...extractContextMaps(element.children));
        }
    }
    return collected;
}
        expect(rel.left.link?.ref).toBeDefined();
        expect(rel.left.link?.error).toBeUndefined();
        expect(rel.right.link?.ref).toBeDefined();
        expect(rel.right.link?.error).toBeUndefined();
    });
});
