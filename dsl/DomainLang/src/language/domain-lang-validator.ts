import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { DomainLangAstType, Domain } from './generated/ast.js';
import type { DomainLangServices } from './domain-lang-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: DomainLangServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.DomainLangValidator;
    const checks: ValidationChecks<DomainLangAstType> = {
        Domain: validator.noopValidation,
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class DomainLangValidator {

    noopValidation(domain: Domain, accept: ValidationAcceptor): void{
    }
    // checkPersonStartsWithCapital(person: Person, accept: ValidationAcceptor): void {
    //     if (person.name) {
    //         const firstChar = person.name.substring(0, 1);
    //         if (firstChar.toUpperCase() !== firstChar) {
    //             accept('warning', 'Person name should start with a capital.', { node: person, property: 'name' });
    //         }
    //     }
    // }

}
