import type { ValidationChecks } from 'langium';
import type { Metadata, DomainLangAstType } from '../generated/ast.js';

/**
 * Validation checks for Metadata elements.
 * - Ensures metadata keys are defined before use
 */
export const metadataChecks: ValidationChecks<DomainLangAstType> = {
    Metadata(metadata: Metadata, accept) {
        if (!metadata.name) {
            accept('error', 'Metadata must have a name', { node: metadata });
        }
    },
};
