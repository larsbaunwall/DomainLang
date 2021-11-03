import { createDefaultModule, DefaultModuleContext, inject, LangiumServices, Module, PartialLangiumServices } from 'langium';
import { DomainLangGeneratedModule } from './generated/module';
import { DomainLangValidationRegistry, DomainLangValidator } from './domain-lang-validator';

/**
 * Declaration of custom services - add your own service classes here.
 */
export type DomainLangAddedServices = {
    validation: {
        DomainLangValidator: DomainLangValidator
    }
}

/**
 * Union of Langium default services and your custom services - use this as constructor parameter
 * of custom service classes.
 */
export type DomainLangServices = LangiumServices & DomainLangAddedServices

/**
 * Dependency injection module that overrides Langium default services and contributes the
 * declared custom services. The Langium defaults can be partially specified to override only
 * selected services, while the custom services must be fully specified.
 */
export const DomainLangModule: Module<DomainLangServices, PartialLangiumServices & DomainLangAddedServices> = {
    validation: {
        ValidationRegistry: (injector) => new DomainLangValidationRegistry(injector),
        DomainLangValidator: () => new DomainLangValidator()
    }
};

/**
 * Inject the full set of language services by merging three modules:
 *  - Langium default services
 *  - Services generated by langium-cli
 *  - Services specified in this file
 */
export function createDomainLangServices(context?: DefaultModuleContext): DomainLangServices {
    return inject(
        createDefaultModule(context),
        DomainLangGeneratedModule,
        DomainLangModule
    );
}
