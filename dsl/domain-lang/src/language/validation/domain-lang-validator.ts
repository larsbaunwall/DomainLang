import { modelChecks } from './model.js';
import { domainChecks } from './domain.js';
import { boundedContextChecks } from './bounded-context.js';
import { groupChecks } from './group.js';
import { classificationChecks } from './classification.js';
import { contextGroupChecks } from './context-group.js';
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
        GroupDeclaration: groupChecks,
        Classification: classificationChecks,
        ContextGroup: contextGroupChecks,
        ImportStatement: importChecks.ImportStatement,
    };
    
    registry.register(pipeline);
} 