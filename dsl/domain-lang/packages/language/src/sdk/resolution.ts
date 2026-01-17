/**
 * Property resolution logic for SDK-augmented properties.
 * Implements precedence rules for 0..1 properties on Domain and BoundedContext.
 * 
 * Resolution is deterministic and follows documented precedence:
 * - BoundedContext.role: header inline (`as`) → RoleBlock → ClassificationBlock.role
 * - BoundedContext.team: header inline (`by`) → TeamBlock
 * - BoundedContext.description: first DescriptionBlock
 * - BoundedContext.metadata: merge all MetadataBlock, later entries override
 * - Domain.description: first DescriptionBlock
 * - Domain.vision: first VisionBlock
 * - Domain.classification: first DomainClassificationBlock
 */

import type {
    BoundedContext,
    BoundedContextClassificationBlock,
    BoundedContextDocumentationBlock,
    BusinessModelBlock,
    Classification,
    DescriptionBlock,
    Domain,
    DomainClassificationBlock,
    DomainDocumentationBlock,
    LifecycleBlock,
    RoleBlock,
    Team,
    TeamBlock,
    VisionBlock,
} from '../generated/ast.js';
import {
    isBoundedContextClassificationBlock,
    isBusinessModelBlock,
    isDescriptionBlock,
    isDomainClassificationBlock,
    isLifecycleBlock,
    isMetadataBlock,
    isRoleBlock,
    isTeamBlock,
    isVisionBlock,
} from '../generated/ast.js';

/**
 * Resolves the description for a BoundedContext.
 * 
 * Precedence: First DescriptionBlock found
 * 
 * @param bc - BoundedContext AST node
 * @returns Description string or undefined
 */
export function resolveBcDescription(bc: BoundedContext): string | undefined {
    const block = findBlock<DescriptionBlock>(bc.documentation, isDescriptionBlock);
    return block?.description;
}

/**
 * Resolves the role for a BoundedContext.
 * 
 * Precedence:
 * 1. Header inline (`as` keyword) - highest priority
 * 2. Standalone RoleBlock
 * 3. BoundedContextClassificationBlock.role
 * 
 * @param bc - BoundedContext AST node
 * @returns Classification reference or undefined
 */
export function resolveBcRole(bc: BoundedContext): Classification | undefined {
    // 1. Header inline (highest precedence)
    if (bc.role?.ref) {
        return bc.role.ref;
    }

    // 2. Standalone role block
    const roleBlock = findBlock<RoleBlock>(bc.documentation, isRoleBlock);
    if (roleBlock?.role?.ref) {
        return roleBlock.role.ref;
    }

    // 3. Classifications block
    const classBlock = findBlock<BoundedContextClassificationBlock>(
        bc.documentation,
        isBoundedContextClassificationBlock
    );
    if (classBlock?.role?.ref) {
        return classBlock.role.ref;
    }

    return undefined;
}

/**
 * Resolves the team for a BoundedContext.
 * 
 * Precedence:
 * 1. Header inline (`by` keyword) - highest priority
 * 2. Standalone TeamBlock
 * 
 * @param bc - BoundedContext AST node
 * @returns Team reference or undefined
 */
export function resolveBcTeam(bc: BoundedContext): Team | undefined {
    // 1. Header inline (highest precedence)
    if (bc.team?.ref) {
        return bc.team.ref;
    }

    // 2. Team block
    const teamBlock = findBlock<TeamBlock>(bc.documentation, isTeamBlock);
    if (teamBlock?.team?.ref) {
        return teamBlock.team.ref;
    }

    return undefined;
}

/**
 * Resolves the business model for a BoundedContext.
 * 
 * Precedence:
 * 1. BoundedContextClassificationBlock.businessModel
 * 2. Standalone BusinessModelBlock
 * 
 * @param bc - BoundedContext AST node
 * @returns Classification reference or undefined
 */
export function resolveBcBusinessModel(bc: BoundedContext): Classification | undefined {
    // 1. Classifications block (higher precedence)
    const classBlock = findBlock<BoundedContextClassificationBlock>(
        bc.documentation,
        isBoundedContextClassificationBlock
    );
    if (classBlock?.businessModel?.ref) {
        return classBlock.businessModel.ref;
    }

    // 2. Standalone business model block
    const bmBlock = findBlock<BusinessModelBlock>(bc.documentation, isBusinessModelBlock);
    if (bmBlock?.businessModel?.ref) {
        return bmBlock.businessModel.ref;
    }

    return undefined;
}

/**
 * Resolves the lifecycle for a BoundedContext.
 * 
 * Precedence:
 * 1. BoundedContextClassificationBlock.lifecycle
 * 2. Standalone LifecycleBlock
 * 
 * @param bc - BoundedContext AST node
 * @returns Classification reference or undefined
 */
export function resolveBcLifecycle(bc: BoundedContext): Classification | undefined {
    // 1. Classifications block (higher precedence)
    const classBlock = findBlock<BoundedContextClassificationBlock>(
        bc.documentation,
        isBoundedContextClassificationBlock
    );
    if (classBlock?.lifecycle?.ref) {
        return classBlock.lifecycle.ref;
    }

    // 2. Standalone lifecycle block
    const lcBlock = findBlock<LifecycleBlock>(bc.documentation, isLifecycleBlock);
    if (lcBlock?.lifecycle?.ref) {
        return lcBlock.lifecycle.ref;
    }

    return undefined;
}

/**
 * Resolves metadata for a BoundedContext by merging all MetadataBlock entries.
 * 
 * Resolution: Merge all metadata blocks; later entries override earlier ones
 * 
 * @param bc - BoundedContext AST node
 * @returns ReadonlyMap of metadata key-value pairs
 */
export function resolveBcMetadata(bc: BoundedContext): ReadonlyMap<string, string> {
    const metadata = new Map<string, string>();

    // Find all metadata blocks and merge entries
    for (const block of bc.documentation) {
        if (isMetadataBlock(block)) {
            for (const entry of block.entries) {
                const key = entry.key.ref?.name;
                if (key) {
                    metadata.set(key, entry.value);
                }
            }
        }
    }

    return metadata;
}

/**
 * Resolves the description for a Domain.
 * 
 * Precedence: First DescriptionBlock found
 * 
 * @param domain - Domain AST node
 * @returns Description string or undefined
 */
export function resolveDomainDescription(domain: Domain): string | undefined {
    const block = findBlock<DescriptionBlock>(domain.documentation, isDescriptionBlock);
    return block?.description;
}

/**
 * Resolves the vision for a Domain.
 * 
 * Precedence: First VisionBlock found
 * 
 * @param domain - Domain AST node
 * @returns Vision string or undefined
 */
export function resolveDomainVision(domain: Domain): string | undefined {
    const block = findBlock<VisionBlock>(domain.documentation, isVisionBlock);
    return block?.vision;
}

/**
 * Resolves the classification for a Domain.
 * 
 * Precedence: First DomainClassificationBlock found
 * 
 * @param domain - Domain AST node
 * @returns Classification reference or undefined
 */
export function resolveDomainClassification(domain: Domain): Classification | undefined {
    const block = findBlock<DomainClassificationBlock>(
        domain.documentation,
        isDomainClassificationBlock
    );
    return block?.classification?.ref;
}

/**
 * Internal helper to find the first block matching a type guard.
 * 
 * @param blocks - Array of documentation blocks
 * @param guard - Type guard function
 * @returns First matching block or undefined
 */
function findBlock<T extends BoundedContextDocumentationBlock | DomainDocumentationBlock>(
    blocks: readonly (BoundedContextDocumentationBlock | DomainDocumentationBlock)[],
    guard: (block: unknown) => block is T
): T | undefined {
    return blocks.find(guard);
}
