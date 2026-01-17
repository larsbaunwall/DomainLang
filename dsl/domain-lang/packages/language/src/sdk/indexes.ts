/**
 * Index building for O(1) lookups in the Model Query SDK.
 * Builds maps for FQN, name, team, role, and metadata lookups.
 * 
 * Indexes are built once during model loading and enable fast queries.
 */

import type { AstNode } from 'langium';
import { AstUtils } from 'langium';
import type {
    BoundedContext,
    Classification,
    ContextMap,
    Domain,
    DomainMap,
    Metadata,
    Model,
    NamespaceDeclaration,
    Team,
} from '../generated/ast.js';
import {
    isBoundedContext,
    isClassification,
    isContextMap,
    isDomain,
    isDomainMap,
    isMetadata,
    isNamespaceDeclaration,
    isTeam,
} from '../generated/ast.js';
import { QualifiedNameProvider } from '../lsp/domain-lang-naming.js';
import type { ModelIndexes } from './types.js';
import {
    resolveBcMetadata,
    resolveBcRole,
    resolveBcTeam,
} from './resolution.js';

/**
 * Builds all indexes for a model.
 * Called once during model loading.
 * 
 * @param model - Root model node
 * @returns ModelIndexes containing all lookup maps
 */
export function buildIndexes(model: Model): ModelIndexes {
    const byFqn = new Map<string, AstNode>();
    const byName = new Map<string, AstNode[]>();
    const byTeam = new Map<string, BoundedContext[]>();
    const byRole = new Map<string, BoundedContext[]>();
    const byMetadataKey = new Map<string, BoundedContext[]>();

    const fqnProvider = new QualifiedNameProvider();

    // Stream all AST nodes and index them
    for (const node of AstUtils.streamAllContents(model)) {
        // Index named types only
        if (!hasName(node)) {
            continue;
        }

        const name = node.name;
        const fqn = fqnProvider.getQualifiedName(node.$container, name);

        // Index by FQN (unique)
        byFqn.set(fqn, node);

        // Index by simple name (may have duplicates)
        const nameList = byName.get(name) ?? [];
        nameList.push(node);
        byName.set(name, nameList);

        // BoundedContext-specific indexes
        if (isBoundedContext(node)) {
            indexBoundedContext(node, byTeam, byRole, byMetadataKey);
        }
    }

    return {
        byFqn,
        byName,
        byTeam,
        byRole,
        byMetadataKey,
    };
}

/**
 * Indexes a BoundedContext by team, role, and metadata.
 * 
 * @param bc - BoundedContext node
 * @param byTeam - Team index map
 * @param byRole - Role index map
 * @param byMetadataKey - Metadata key index map
 */
function indexBoundedContext(
    bc: BoundedContext,
    byTeam: Map<string, BoundedContext[]>,
    byRole: Map<string, BoundedContext[]>,
    byMetadataKey: Map<string, BoundedContext[]>
): void {
    // Index by team
    const team = resolveBcTeam(bc);
    if (team?.name) {
        const teamList = byTeam.get(team.name) ?? [];
        teamList.push(bc);
        byTeam.set(team.name, teamList);
    }

    // Index by role
    const role = resolveBcRole(bc);
    if (role?.name) {
        const roleList = byRole.get(role.name) ?? [];
        roleList.push(bc);
        byRole.set(role.name, roleList);
    }

    // Index by metadata keys
    const metadata = resolveBcMetadata(bc);
    for (const key of metadata.keys()) {
        const metaList = byMetadataKey.get(key) ?? [];
        metaList.push(bc);
        byMetadataKey.set(key, metaList);
    }
}

/**
 * Type guard for named AST nodes.
 * Only these types are indexed by name.
 */
function hasName(node: AstNode): node is NamedNode {
    return (
        isDomain(node) ||
        isBoundedContext(node) ||
        isTeam(node) ||
        isClassification(node) ||
        isContextMap(node) ||
        isDomainMap(node) ||
        isNamespaceDeclaration(node) ||
        isMetadata(node)
    );
}

/**
 * Union type of all named AST nodes.
 */
type NamedNode =
    | Domain
    | BoundedContext
    | Team
    | Classification
    | ContextMap
    | DomainMap
    | NamespaceDeclaration
    | Metadata;
