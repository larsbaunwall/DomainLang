import {
    createDefaultModule, createDefaultSharedModule, DefaultSharedModuleContext, inject,
    LangiumServices, LangiumSharedServices, Module, PartialLangiumServices
} from 'langium';
import { DomainLangGeneratedModule, DomainLangGeneratedSharedModule } from './generated/module';
import { DomainLangValidator, registerValidationChecks } from './domain-lang-validator';

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
        DomainLangValidator: () => new DomainLangValidator()
    }
};

/**
 * Create the full set of services required by Langium.
 *
 * First inject the shared services by merging two modules:
 *  - Langium default shared services
 *  - Services generated by langium-cli
 *
 * Then inject the language-specific services by merging three modules:
 *  - Langium default language-specific services
 *  - Services generated by langium-cli
 *  - Services specified in this file
 *
 * @param context Optional module context with the LSP connection
 * @returns An object wrapping the shared services and the language-specific services
 */
export function createDomainLangServices(context: DefaultSharedModuleContext): {
    shared: LangiumSharedServices,
    DomainLang: DomainLangServices
} {
    const shared = inject(
        createDefaultSharedModule(context),
        DomainLangGeneratedSharedModule
    );
    const DomainLang = inject(
        createDefaultModule({ shared }),
        DomainLangGeneratedModule,
        DomainLangModule
    );
    shared.ServiceRegistry.register(DomainLang);
    registerValidationChecks(DomainLang);
    return { shared, DomainLang };
}
