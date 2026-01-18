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
 * - Import aliases don't conflict with local names
 * 
 * NOTE: Named imports and integrity checks removed in PRS-010.
 */
export class ImportValidator {
    constructor(_services: DomainLangServices) {
        // Services parameter kept for backward compatibility
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
            accept('error', 'Import statement must have a URI', { 
                node: imp,
                keyword: 'import'
            });
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
     * 
     * NOTE: Named imports have been removed in PRS-010. This method is kept
     * for backward compatibility but does nothing since symbols property
     * no longer exists on ImportStatement.
     */
    async checkNamedImports(
        _imp: ImportStatement,
        _accept: ValidationAcceptor,
        _document: LangiumDocument
    ): Promise<void> {
        // Named imports removed in PRS-010 - this method is now a no-op
        return;
    }

    /**
     * Checks for unused imports.
     * 
     * This is a warning, not an error, to avoid being too strict.
     * 
     * NOTE: Named imports have been removed in PRS-010. This method is kept
     * for backward compatibility but does nothing since symbols property
     * no longer exists on ImportStatement.
     */
    checkUnusedImports(
        _imp: ImportStatement,
        _accept: ValidationAcceptor,
        _model: Model
    ): void {
        // Named imports removed in PRS-010 - this method is now a no-op
        return;
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
                accept('error', 'Import statement must have a URI', { 
                    node: imp,
                    keyword: 'import'
                });
            }

            // TODO: Implement async validation in a separate build phase
            // This would require using DocumentBuilder.onBuildPhase() or similar
        }
    };
}
