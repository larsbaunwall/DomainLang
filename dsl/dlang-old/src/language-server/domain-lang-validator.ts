import { ValidationAcceptor, ValidationChecks, ValidationRegistry } from 'langium';
import { DomainLangAstType, Domain } from './generated/ast';
import type { DomainLangServices } from './domain-lang-module';

/**
 * Registry for validation checks.
 */
export class DomainLangValidationRegistry extends ValidationRegistry {
    constructor(services: DomainLangServices) {
        super(services);
        const validator = services.validation.DomainLangValidator;
        const checks: ValidationChecks<DomainLangAstType> = {
            Domain: validator.noopValidation
        };
        this.register(checks, validator);
    }
}

/**
 * Implementation of custom validations.
 */
export class DomainLangValidator {

    noopValidation(domain: Domain, accept: ValidationAcceptor): void{
    }
//   checkPersonStartsWithCapital(person: Person, accept: ValidationAcceptor): void {
//         if (person.name) {
//             const firstChar = person.name.substring(0, 1);
//             if (firstChar.toUpperCase() !== firstChar) {
//                 accept('warning', 'Person name should start with a capital.', { node: person, property: 'name' });
//             }
//         }
//     }

}
