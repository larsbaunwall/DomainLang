import type { ValidationChecks } from 'langium';
import type { Metadata, DomainLangAstType } from '../generated/ast.js';
import { ValidationMessages, buildCodeDescription } from './constants.js';

/**
 * Validation checks for Metadata elements.
 * - Ensures metadata keys are defined before use
 */
export const metadataChecks: ValidationChecks<DomainLangAstType> = {
    Metadata(metadata: Metadata, accept) {
        if (!metadata.name) {
            accept('error', ValidationMessages.METADATA_MISSING_NAME(), { 
                node: metadata,
                codeDescription: buildCodeDescription('language.md', 'metadata')
            });
        }
    },
};
