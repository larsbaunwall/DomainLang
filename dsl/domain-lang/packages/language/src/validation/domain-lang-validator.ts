import { modelChecks } from './model.js';
import { domainChecks } from './domain.js';
import { boundedContextChecks } from './bounded-context.js';
import { classificationChecks } from './classification.js';
import { createImportChecks } from './import.js';
import type { ValidationChecks } from 'langium';
import type { DomainLangAstType } from '../generated/ast.js';
import { DomainLangServices } from '../domain-lang-module.js';

export function registerValidationChecks(services: DomainLangServices) {
    const registry = services.validation.ValidationRegistry;
    
    // Get import checks
    const importChecks = createImportChecks(services);
    
    // Compose the pipeline for each type
    const pipeline: ValidationChecks<DomainLangAstType> = {
        Model: modelChecks,
        Domain: domainChecks,
        BoundedContext: boundedContextChecks,
        Classification: classificationChecks,
        ImportStatement: importChecks.ImportStatement,
    };
    
    registry.register(pipeline);
} 