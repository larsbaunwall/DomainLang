import {
  //   ValidationAcceptor,
  ValidationCheck,
  ValidationRegistry,
} from "langium";
import { DomainLangAstType } from "./generated/ast";
import { DomainLangServices } from "./domain-lang-module";

/**
 * Map AST node types to validation checks.
 */
type DomainLangChecks = {
  [type in DomainLangAstType]?: ValidationCheck | ValidationCheck[];
};

/**
 * Registry for validation checks.
 */
export class DomainLangValidationRegistry extends ValidationRegistry {
  constructor(services: DomainLangServices) {
    super(services);
    const validator = services.validation.DomainLangValidator;
    const checks: DomainLangChecks = {};
    this.register(checks, validator);
  }
}

/**
 * Implementation of custom validations.
 */
export class DomainLangValidator {}
