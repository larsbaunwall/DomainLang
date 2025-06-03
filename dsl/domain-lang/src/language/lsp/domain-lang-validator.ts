import type { AstNode, ValidationAcceptor, ValidationChecks } from 'langium';
import { type DomainLangAstType, type Domain, Model, Container, isContainer, BoundedContext, Relationship } from '../generated/ast.js';
import type { DomainLangServices } from '../domain-lang-module.js';
import { QualifiedNameProvider } from './domain-lang-naming.js';
import { setInferredRelationshipTypes } from '../services/relationship-inference.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: DomainLangServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.DomainLangValidator;
    const checks: ValidationChecks<DomainLangAstType> = {
        Model: validator.checkModelIntegrity,
        BoundedContext: validator.checkBC,
        Domain: validator.checkDomain,
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class DomainLangValidator {

    noopValidation(domain: Domain, accept: ValidationAcceptor): void {
    }

    checkModelIntegrity(model: Model, accept: ValidationAcceptor): void {
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

    checkBC(bc: BoundedContext, accept: ValidationAcceptor): void {

        const hasDescription = bc.documentation?.some(
            block => 'description' in block && block.description
        );
        if (!hasDescription)
            accept('warning', `Bounded Context '${bc.name}' has no description`, { node: bc, property: 'documentation' });
    }

    checkDomain(domain: Domain, accept: ValidationAcceptor): void {
        const hasVision = domain.documentation?.some(
            block => 'vision' in block && block.vision
        );
        if (!hasVision)
            accept('warning', `Domain '${domain.name}' has no domain vision. Consider adding one.`, { node: domain, property: 'documentation' });
    }

    validateSeparateWaysArrow(relationship: Relationship, accept: ValidationAcceptor): void {
        const effectiveType = relationship.type ?? relationship.inferredType;
        if (relationship.arrow === '><') {
            if (effectiveType !== 'SeparateWays') {
                accept('error', "`><` arrow can only be used with type 'SeparateWays'.", { node: relationship, property: 'arrow' });
            }
        }
        if (effectiveType === 'SeparateWays' && relationship.arrow !== '><') {
            // Optionally, warn or auto-correct if you want to enforce `><` for SeparateWays
        }
    }
}

function* extractNames(element: Container): Generator<{fqn: string, node: AstNode}> {
    const fqnProvider = new QualifiedNameProvider();
        for (const child of element.children) {
            yield {fqn: fqnProvider.getQualifiedName(child.$container, child.name), node: child};
            // If child is of type Container, recursively yield its names
            if (isContainer(child)) {
                yield* extractNames(child);
            }
        }
}
