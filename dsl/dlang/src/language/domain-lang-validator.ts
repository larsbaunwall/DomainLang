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
        Domain: validator.checkDomainStartsWithCapital,
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class DomainLangValidator {

    noopValidation(domain: Domain, accept: ValidationAcceptor): void {
    }

    checkDomainStartsWithCapital(domain: Domain, accept: ValidationAcceptor): void {
        if (domain.name) {
            const firstChar = domain.name.substring(0, 1);
            if (firstChar.toUpperCase() !== firstChar) {
                accept('hint', 'Domain name should start with a capital.', { node: domain, property: 'name' });
            }
        }
    }
}
