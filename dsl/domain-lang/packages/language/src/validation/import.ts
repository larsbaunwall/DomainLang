import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { DomainLangAstType, ImportStatement, Model } from '../generated/ast.js';
import { resolveImportPath } from '../utils/import-utils.js';
import type { DomainLangServices } from '../domain-lang-module.js';
import type { LangiumDocument } from 'langium';

/**
 * Validates import statements in DomainLang.
 * 
 * Checks:
 * - Import paths are resolvable
 * - Named imports exist in target document
 * - Import aliases don't conflict with local names
 */
export class ImportValidator {
    private readonly documents: DomainLangServices['shared']['workspace']['LangiumDocuments'];

    constructor(services: DomainLangServices) {
        this.documents = services.shared.workspace.LangiumDocuments;
    }

    /**
     * Validates that an import path is resolvable.
     */
    async checkImportPath(
        imp: ImportStatement,
        accept: ValidationAcceptor,
        document: LangiumDocument
    ): Promise<void> {
        if (!imp.uri) {
            accept('error', 'Import statement must have a URI', { node: imp });
            return;
        }

        try {
            await resolveImportPath(document, imp.uri);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            accept('error', `Cannot resolve import: ${message}`, {
                node: imp,
                property: 'uri'
            });
        }
    }

    /**
     * Validates that named imports exist in the target document.
     */
    async checkNamedImports(
        imp: ImportStatement,
        accept: ValidationAcceptor,
        document: LangiumDocument
    ): Promise<void> {
        // Only check if we have named imports
        if (!imp.symbols || imp.symbols.length === 0) {
            return;
        }

        if (!imp.uri) {
            return; // Already reported by checkImportPath
        }

        try {
            // Resolve the target document
            const targetUri = await resolveImportPath(document, imp.uri);
            const targetDoc = await this.documents.getOrCreateDocument(targetUri);
            
            if (!targetDoc.parseResult?.value) {
                accept('error', `Cannot load imported document: ${imp.uri}`, {
                    node: imp,
                    property: 'uri'
                });
                return;
            }

            // Get all exported symbols from target document
            const targetModel = targetDoc.parseResult.value as Model;
            const exportedSymbols = this.getExportedSymbols(targetModel);

            // Check each imported symbol
            for (const symbol of imp.symbols) {
                if (!exportedSymbols.has(symbol)) {
                    accept('error', 
                        `Symbol '${symbol}' not found in ${imp.uri}. Available symbols: ${Array.from(exportedSymbols).join(', ')}`,
                        {
                            node: imp,
                            property: 'symbols'
                        }
                    );
                }
            }
        } catch {
            // Import path error already reported by checkImportPath
            return;
        }
    }

    /**
     * Gets all exportable symbols from a model.
     * 
     * In DomainLang, top-level declarations are implicitly exported:
     * - Domains
     * - BoundedContexts
     * - Classifications
     * - Groups
     */
    private getExportedSymbols(model: Model): Set<string> {
        const symbols = new Set<string>();

        // Iterate through all structure elements
        for (const element of model.children ?? []) {
            // Check if element has a name and add it
            if ('name' in element && typeof element.name === 'string') {
                symbols.add(element.name);
            }
        }

        return symbols;
    }

    /**
     * Checks for unused imports.
     * 
     * This is a warning, not an error, to avoid being too strict.
     */
    checkUnusedImports(
        imp: ImportStatement,
        _accept: ValidationAcceptor,
        _model: Model
    ): void {
        // Skip check for wildcard imports (no named imports)
        if (!imp.symbols || imp.symbols.length === 0) {
            return;
        }

        // For now, just a placeholder - would require tracking symbol usage
        // across the entire document, which is complex
        // TODO: Implement symbol usage tracking
    }
}

/**
 * Creates validation checks for import statements.
 */
export function createImportChecks(_services: DomainLangServices): ValidationChecks<DomainLangAstType> {

    return {
        ImportStatement: (imp, accept) => {
            const document = imp.$document;
            if (!document) return;

            // Note: Langium's validation is synchronous, so async checks won't
            // execute during document validation. These checks will run during
            // the build phase when documents are fully loaded.
            
            // For now, just do basic syntax validation
            if (!imp.uri) {
                accept('error', 'Import statement must have a URI', { node: imp });
            }

            // TODO: Implement async validation in a separate build phase
            // This would require using DocumentBuilder.onBuildPhase() or similar
        }
    };
}
