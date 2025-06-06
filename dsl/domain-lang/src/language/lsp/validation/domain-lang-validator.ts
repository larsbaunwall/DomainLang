import { modelChecks } from './model.js';
import { domainChecks } from './domain.js';
import { boundedContextChecks } from './bounded-context.js';
import { packageChecks } from './package.js';
import { classificationChecks } from './classification.js';
import type { ValidationChecks } from 'langium';
import type { DomainLangAstType } from '../../generated/ast.js';
import { DomainLangServices } from '../../domain-lang-module.js';

// Compose the pipeline for each type
const pipeline: ValidationChecks<DomainLangAstType> = {
    Model: modelChecks,
    Domain: domainChecks,
    BoundedContext: boundedContextChecks,
    PackageDeclaration: packageChecks,
    Classification: classificationChecks,
};

export function registerValidationChecks(services: DomainLangServices) {
    const registry = services.validation.ValidationRegistry;
    registry.register(pipeline);
} 