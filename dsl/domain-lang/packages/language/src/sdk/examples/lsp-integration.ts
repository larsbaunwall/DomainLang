/**
 * SDK Usage Examples for LSP Services
 * 
 * This file demonstrates how to refactor LSP services (hover, validation, completion)
 * to use the Model Query SDK instead of raw AST querying.
 * 
 * The SDK provides:
 * - `fromDocument()` - Zero-copy sync access to augmented AST
 * - `resolvedRole`, `resolvedTeam`, `description` - Pre-computed properties with transparent precedence
 * - `query.boundedContexts()` - Fluent queries with O(1) indexed lookups
 */

import type { LangiumDocument, ValidationAcceptor } from 'langium';
import type { BoundedContext, Domain, Model } from '../../generated/ast.js';
import { fromDocument } from '../../sdk/index.js';
import type { AugmentedBoundedContext, AugmentedDomain } from '../../sdk/types.js';

// =============================================================================
// BEFORE: Raw AST Querying (current approach)
// These functions demonstrate the old pattern vs. the SDK approach
// =============================================================================

/**
 * BEFORE: Manual block iteration to build hover content.
 * This is verbose, error-prone, and duplicates logic across services.
 */
function beforeHoverContentForBoundedContext(bc: BoundedContext): string {
    // Manual block iteration - duplicated in validation, completion, etc.
    let description = '';
    let teamName = '';
    let roleName = '';
    
    // First check inline properties
    if (bc.role?.ref?.name) {
        roleName = bc.role.ref.name;
    }
    if (bc.team?.ref?.name) {
        teamName = bc.team.ref.name;
    }
    
    // Then check documentation blocks (precedence rules manually applied)
    for (const block of bc.documentation ?? []) {
        if (!description && 'description' in block) {
            description = (block as { description: string }).description;
        }
        // More complex: check roleBlock, classificationBlock, etc.
        // This logic is repeated everywhere we need resolved properties!
    }
    
    return `**${bc.name}**\n\nRole: ${roleName}\nTeam: ${teamName}`;
}

/**
 * BEFORE: Manual validation with block iteration.
 */
function beforeValidateBoundedContextHasDescription(
    bc: BoundedContext,
    accept: ValidationAcceptor
): void {
    // Manually search through blocks
    const hasDescription = bc.documentation?.some(block => {
        return 'description' in block && (block as { description?: string }).description;
    });
    
    if (!hasDescription) {
        accept('warning', `BoundedContext '${bc.name}' has no description`, { node: bc });
    }
}

// =============================================================================
// AFTER: SDK-Based Approach (recommended)
// =============================================================================

/**
 * AFTER: SDK provides pre-resolved properties.
 * Clean, concise, and the resolution rules are centralized in the SDK.
 */
function afterHoverContentForBoundedContext(bc: BoundedContext): string {
    // Cast to augmented type to access SDK properties
    const augBc = bc as AugmentedBoundedContext;
    
    // SDK properties are computed automatically with correct precedence:
    // - resolvedRole: header inline → RoleBlock → ClassificationBlock.role
    // - resolvedTeam: header inline → TeamBlock
    // - description: first DescriptionBlock
    
    const parts = [`**${augBc.name}**`];
    
    if (augBc.description) {
        parts.push(augBc.description);
    }
    
    parts.push('---');
    
    if (augBc.resolvedRole) {
        parts.push(`🔖 **Role:** ${augBc.resolvedRole.name}`);
    }
    if (augBc.resolvedTeam) {
        parts.push(`👥 **Team:** ${augBc.resolvedTeam.name}`);
    }
    if (augBc.businessModel) {
        parts.push(`💼 **Business Model:** ${augBc.businessModel.name}`);
    }
    if (augBc.lifecycle) {
        parts.push(`🔄 **Lifecycle:** ${augBc.lifecycle.name}`);
    }
    
    // Metadata map is also pre-resolved
    if (augBc.metadata.size > 0) {
        parts.push('**Metadata:**');
        for (const [key, value] of augBc.metadata) {
            parts.push(`- ${key}: ${value}`);
        }
    }
    
    return parts.join('\n\n');
}

/**
 * AFTER: SDK provides pre-resolved properties for validation.
 */
function afterValidateBoundedContextHasDescription(
    bc: BoundedContext,
    accept: ValidationAcceptor
): void {
    const augBc = bc as AugmentedBoundedContext;
    
    // Simple property check - SDK handles the block iteration
    if (!augBc.description) {
        accept('warning', `BoundedContext '${bc.name}' has no description`, { node: bc });
    }
}

/**
 * AFTER: SDK provides Domain properties too.
 */
function afterHoverContentForDomain(domain: Domain): string {
    const augDomain = domain as AugmentedDomain;
    
    const parts = [`📁 **${augDomain.name}**`];
    
    if (augDomain.description) {
        parts.push(augDomain.description);
    }
    
    if (augDomain.vision) {
        parts.push(`**Vision:** ${augDomain.vision}`);
    }
    
    if (augDomain.classification) {
        parts.push(`**Classification:** ${augDomain.classification.name}`);
    }
    
    // FQN is also pre-computed
    parts.push(`**FQN:** \`${augDomain.fqn}\``);
    
    return parts.join('\n\n');
}

// =============================================================================
// Using Query API for Document-Level Queries
// =============================================================================

/**
 * Example: Finding all Core contexts for a diagnostic summary.
 */
function getCoreBoundedContextsInDocument(document: LangiumDocument<Model>): BoundedContext[] {
    const query = fromDocument(document);
    
    // Fluent query with O(1) indexed lookup by role
    return query.boundedContexts()
        .withRole('Core')
        .toArray();
}

/**
 * Example: Finding conflicts - BCs with same team but different roles.
 */
function findTeamRoleConflicts(
    document: LangiumDocument<Model>,
    accept: ValidationAcceptor
): void {
    const query = fromDocument(document);
    
    // Group by team and check for role conflicts
    const teamToBcs = new Map<string, AugmentedBoundedContext[]>();
    
    for (const bc of query.boundedContexts()) {
        const augBc = bc as AugmentedBoundedContext;
        const teamName = augBc.resolvedTeam?.name;
        if (teamName) {
            const list = teamToBcs.get(teamName) ?? [];
            list.push(augBc);
            teamToBcs.set(teamName, list);
        }
    }
    
    for (const [teamName, bcs] of teamToBcs) {
        const roles = new Set(bcs.map(bc => bc.resolvedRole?.name).filter(Boolean));
        if (roles.size > 1) {
            for (const bc of bcs) {
                accept('info', `Team '${teamName}' owns BCs with different roles: ${[...roles].join(', ')}`, {
                    node: bc
                });
            }
        }
    }
}

/**
 * Example: Direct O(1) lookup by name.
 */
function findBoundedContextByName(
    document: LangiumDocument<Model>,
    name: string
): AugmentedBoundedContext | undefined {
    const query = fromDocument(document);
    
    // O(1) lookup - no iteration
    const bc = query.boundedContext(name);
    return bc as AugmentedBoundedContext | undefined;
}

/**
 * Example: Direct O(1) lookup by FQN.
 */
function findByFqn(
    document: LangiumDocument<Model>,
    fqn: string
): AugmentedBoundedContext | undefined {
    const query = fromDocument(document);
    
    // O(1) FQN lookup
    return query.byFqn<BoundedContext>(fqn) as AugmentedBoundedContext | undefined;
}

// =============================================================================
// Integration Pattern: Full Hover Provider Example
// =============================================================================

/**
 * Example of how to integrate SDK into existing HoverProvider.
 * 
 * Key pattern: Use `fromDocument()` at the document level,
 * then cast individual nodes to AugmentedBoundedContext/AugmentedDomain.
 */
export function exampleHoverProviderIntegration(
    document: LangiumDocument<Model>,
    node: BoundedContext | Domain
): string | undefined {
    // fromDocument() ensures model is augmented (idempotent)
    // This is a zero-copy operation - no reloading from disk
    // Just calling fromDocument() augments the AST - the query object is optional
    fromDocument(document);
    
    // Now all nodes in the document have SDK properties attached
    if ('domain' in node) {
        // It's a BoundedContext
        return afterHoverContentForBoundedContext(node as BoundedContext);
    } else if ('parent' in node) {
        // It's a Domain
        return afterHoverContentForDomain(node as Domain);
    }
    
    return undefined;
}

// Export the refactored functions for use in LSP services
export {
    // "Before" examples (for documentation/comparison)
    beforeHoverContentForBoundedContext,
    beforeValidateBoundedContextHasDescription,
    // "After" examples (recommended SDK-based approach)
    afterHoverContentForBoundedContext,
    afterHoverContentForDomain,
    afterValidateBoundedContextHasDescription,
    getCoreBoundedContextsInDocument,
    findTeamRoleConflicts,
    findBoundedContextByName,
    findByFqn,
};
