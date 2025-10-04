import { setInferredRelationshipTypes } from '../services/relationship-inference.js';
import { extractNames } from './shared.js';
import type { ValidationAcceptor } from 'langium';
import type { Model } from '../generated/ast.js';
import { ValidationMessages } from './constants.js';

/**
 * Validates that all elements in the model have unique fully qualified names.
 * Also triggers relationship type inference.
 * 
 * @param model - The model to validate
 * @param accept - The validation acceptor for reporting issues
 */
function validateModelUniqueNames(
    model: Model, 
    accept: ValidationAcceptor
): void {
    const uniqueNames = new Set<string>();
    const names = extractNames(model);
    
    for (const {fqn, node} of names) {
        const oldSize = uniqueNames.size;
        uniqueNames.add(fqn);
        if (uniqueNames.size === oldSize) {
            accept('error', ValidationMessages.DUPLICATE_ELEMENT(fqn), { 
                node: node, 
                property: 'name' 
            });
        }
    }
    
    // Enrich relationships with inferred types
    setInferredRelationshipTypes(model);
}

export const modelChecks = [validateModelUniqueNames]; 