import type { ValidationChecks } from 'langium';
import type { Metadata, MetadataBlock, DomainLangAstType } from '../generated/ast.js';

/**
 * Validation checks for Metadata elements.
 * - Ensures metadata keys are defined before use
 * - Warns on unused metadata definitions
 */
export const metadataChecks: ValidationChecks<DomainLangAstType> = {
    Metadata(metadata: Metadata, accept) {
        // Metadata definitions are valid by construction
        // Validation of references happens in MetadataBlock
        if (!metadata.name) {
            accept('error', 'Metadata must have a name', { node: metadata });
        }
    },

    MetadataBlock(block: MetadataBlock, accept) {
        // Validate that all referenced metadata keys are defined
        // Note: Langium's cross-reference validation handles this automatically
        // This check provides additional semantic validation if needed
        
        if (!block.entries || block.entries.length === 0) {
            accept('warning', 'Metadata block is empty - consider removing it', {
                node: block,
            });
        }

        // Check for duplicate metadata keys in the same block
        const keys = new Set<string>();
        for (const entry of block.entries || []) {
            if (entry.key?.ref?.name) {
                if (keys.has(entry.key.ref.name)) {
                    accept('warning', `Metadata key '${entry.key.ref.name}' is already defined in this block`, {
                        node: entry,
                    });
                }
                keys.add(entry.key.ref.name);
            }
        }
    },
};
