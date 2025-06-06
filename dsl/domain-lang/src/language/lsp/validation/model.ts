import { setInferredRelationshipTypes } from '../../services/relationship-inference.js';
import { extractNames } from './shared.js';
import type { ValidationAcceptor } from 'langium';
import type { Model } from '../../generated/ast.js';

function checkModelIntegrity(model: Model, accept: ValidationAcceptor): void {
    const uniqueNames = new Set<string>();
    let names = extractNames(model);
    for(const {fqn, node} of names) {
        const oldSize = uniqueNames.size;
        uniqueNames.add(fqn);
        if (uniqueNames.size === oldSize) {
            accept('error', `This element is already defined elsewhere: '${fqn}'`, { node: node, property: 'name' });
        }
    }
    setInferredRelationshipTypes(model);
}

export const modelChecks = [checkModelIntegrity]; 