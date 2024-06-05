import type { AstNode, ValidationAcceptor, ValidationChecks } from 'langium';
import { type DomainLangAstType, type Domain, Model, Container, isContainer, BoundedContext } from './generated/ast.js';
import type { DomainLangServices } from './domain-lang-module.js';
import { QualifiedNameProvider } from './domain-lang-naming.js';

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
    }

    checkBC(bc: BoundedContext, accept: ValidationAcceptor): void {
        if(!bc.description)
            accept('warning', `Bounded Context '${bc.name}' has no description`, { node: bc, property: 'description' });
    }

    checkDomain(domain: Domain, accept: ValidationAcceptor): void {
        if(!domain.vision)
            accept('warning', `Domain '${domain.name}' has no domain vision. Consider adding one.`, { node: domain, property: 'vision' });
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
