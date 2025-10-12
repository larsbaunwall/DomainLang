/**
 * Decision Classification Tests
 * 
 * Tests that decisions can be categorized using Classification labels.
 */

import { beforeAll, describe, expect, test } from 'vitest';
import type { TestServices } from '../test-helpers.js';
import { setupTestSuite, expectValidDocument, s } from '../test-helpers.js';
import { isBoundedContext, isClassification } from '../../src/generated/ast.js';

describe('Decision Classification', () => {
    let testServices: TestServices;

    beforeAll(() => {
        testServices = setupTestSuite();
    });

    test('should use Classification for decision categories', async () => {
        // Arrange
        const input = s`
            Classification Architectural
            Classification Business
            Classification Technical
        `;
        
        // Act
        const document = await testServices.parse(input);
        expectValidDocument(document);
        const model = document.parseResult.value;
        const categories = model.children.filter(isClassification);
        
        // Assert
        expect(categories).toHaveLength(3);
        expect(categories[0].name).toBe('Architectural');
        expect(categories[1].name).toBe('Business');
        expect(categories[2].name).toBe('Technical');
    });

    test('should reference Classification in decisions', async () => {
        // Arrange
        const input = s`
            Classification Architectural
            Classification Business
            
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                decisions {
                    decision [Architectural] UseEventSourcing: "We will use event sourcing for order history",
                    policy [Business] RefundWindow: "Refunds allowed within 30 days"
                }
            }
        `;
        
        // Act
        const document = await testServices.parse(input);
        expectValidDocument(document);
        const model = document.parseResult.value;
        const bc = model.children.find(isBoundedContext);
        
        // Assert
        expect(bc).toBeDefined();
        const decisionsBlock = bc!.documentation.find(d => d.$type === 'DecisionsBlock');
        expect(decisionsBlock).toBeDefined();
        expect(decisionsBlock!.decisions).toHaveLength(2);
        expect(decisionsBlock!.decisions[0].classification?.ref?.name).toBe('Architectural');
        expect(decisionsBlock!.decisions[1].classification?.ref?.name).toBe('Business');
    });

    test('should support qualified names for decision Classification', async () => {
        // Arrange
        const input = s`
            namespace governance {
                Classification Architectural
                Classification Business
            }
            
            Domain Sales {}
            
            BoundedContext OrderContext for Sales {
                decisions {
                    decision [governance.Architectural] UseEventSourcing: "Event sourcing for audit trail"
                }
            }
        `;
        
        // Act
        const document = await testServices.parse(input);
        expectValidDocument(document);
        const model = document.parseResult.value;
        const bc = model.children.find(isBoundedContext);
        
        // Assert
        expect(bc).toBeDefined();
        const decisionsBlock = bc!.documentation.find(d => d.$type === 'DecisionsBlock');
        expect(decisionsBlock).toBeDefined();
        expect(decisionsBlock!.decisions[0].classification?.ref?.name).toBe('Architectural');
    });

    test('should share Classifications between context roles and decisions', async () => {
        // Arrange
        const input = s`
            Classification Core
            Classification Architectural
            
            Domain Sales {}
            
            BoundedContext OrderContext for Sales as Core {
                decisions {
                    decision [Architectural] EventSourcing: "Use event sourcing",
                    decision [Core] DomainEvents: "Publish domain events"
                }
            }
        `;
        
        // Act
        const document = await testServices.parse(input);
        expectValidDocument(document);
        const model = document.parseResult.value;
        const bc = model.children.find(isBoundedContext);
        
        // Assert
        expect(bc).toBeDefined();
        expect(bc!.role?.ref?.name).toBe('Core');
        const decisionsBlock = bc!.documentation.find(d => d.$type === 'DecisionsBlock');
        expect(decisionsBlock!.decisions[0].classification?.ref?.name).toBe('Architectural');
        expect(decisionsBlock!.decisions[1].classification?.ref?.name).toBe('Core');
    });
});
