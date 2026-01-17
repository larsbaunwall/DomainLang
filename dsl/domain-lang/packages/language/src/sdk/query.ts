/**
 * Query and QueryBuilder implementation for the Model Query SDK.
 * Provides fluent, lazy evaluation of model queries.
 */

import type { AstNode, LangiumDocument, URI } from 'langium';
import { AstUtils } from 'langium';
import type {
    BoundedContext,
    BoundedContextRef,
    Classification,
    ContextMap,
    Domain,
    DomainMap,
    Model,
    NamespaceDeclaration,
    Relationship,
    Team,
} from '../generated/ast.js';
import {
    isBoundedContext,
    isClassification,
    isContextMap,
    isDomain,
    isDomainMap,
    isModel,
    isNamespaceDeclaration,
    isTeam,
    isThisRef,
} from '../generated/ast.js';
import { QualifiedNameProvider } from '../lsp/domain-lang-naming.js';
import type { DomainLangServices } from '../domain-lang-module.js';
import { buildIndexes } from './indexes.js';
import {
    metadataAsMap,
    effectiveRole,
    effectiveTeam,
} from './resolution.js';
import { isDownstreamPattern, isUpstreamPattern, matchesPattern } from './patterns.js';
import type {
    BcQueryBuilder,
    ModelIndexes,
    Query,
    QueryBuilder,
    RelationshipView,
} from './types.js';

/**
 * Tracks which models have been augmented to avoid redundant augmentation.
 * Uses WeakSet to allow garbage collection of unused models.
 */
const augmentedModels = new WeakSet<Model>();

/**
 * Ensures a model is augmented with SDK properties.
 * Idempotent - safe to call multiple times.
 * 
 * @param model - Model to ensure is augmented
 */
function ensureAugmented(model: Model): void {
    if (!augmentedModels.has(model)) {
        augmentModelInternal(model);
        augmentedModels.add(model);
    }
}

/**
 * Creates a Query instance from a Model node.
 * Zero-copy operation for already-linked AST (used in LSP/validation).
 * 
 * Automatically augments the AST with resolved properties on first access.
 * 
 * @param model - Root Model node
 * @returns Query interface for model traversal
 */
export function fromModel(model: Model): Query {
    ensureAugmented(model);
    return new QueryImpl(model);
}

/**
 * Creates a Query instance from a LangiumDocument.
 * Zero-copy operation for already-linked AST (used in LSP providers).
 * 
 * Automatically augments the AST with resolved properties on first access.
 * 
 * @param document - LangiumDocument containing a Model
 * @returns Query interface for model traversal
 */
export function fromDocument(document: LangiumDocument<Model>): Query {
    const model = document.parseResult.value;
    ensureAugmented(model);
    return new QueryImpl(model);
}

/**
 * Creates a Query instance from DomainLangServices and document URI.
 * Zero-copy operation for already-linked AST (used when only services available).
 * 
 * Automatically augments the AST with resolved properties on first access.
 * 
 * @param services - DomainLangServices instance
 * @param documentUri - URI of the document to query
 * @returns Query interface for model traversal
 * @throws Error if document not found or not a Model
 */
export function fromServices(services: DomainLangServices, documentUri: URI): Query {
    const document = services.shared.workspace.LangiumDocuments.getDocument(documentUri);
    if (!document) {
        throw new Error(`Document not found: ${documentUri.toString()}`);
    }
    
    const model = document.parseResult.value;
    if (!isModel(model)) {
        throw new Error(`Document root is not a Model: ${documentUri.toString()}`);
    }
    
    ensureAugmented(model);
    return new QueryImpl(model);
}

/**
 * Implementation of Query interface.
 * Lazily builds indexes on first access.
 */
class QueryImpl implements Query {
    private readonly model: Model;
    private readonly fqnProvider: QualifiedNameProvider;
    private indexes?: ModelIndexes;

    constructor(model: Model) {
        this.model = model;
        this.fqnProvider = new QualifiedNameProvider();
    }

    /**
     * Lazily builds and caches indexes on first access.
     */
    private getIndexes(): ModelIndexes {
        if (!this.indexes) {
            this.indexes = buildIndexes(this.model);
        }
        return this.indexes;
    }

    domains(): QueryBuilder<Domain> {
        // Use generator for lazy iteration per PRS requirement
        const model = this.model;
        function* domainIterator(): Generator<Domain> {
            for (const node of AstUtils.streamAllContents(model)) {
                if (isDomain(node)) {
                    yield node;
                }
            }
        }
        return new QueryBuilderImpl(domainIterator(), this.fqnProvider);
    }

    boundedContexts(): BcQueryBuilder {
        // Use generator for lazy iteration per PRS requirement
        const model = this.model;
        function* bcIterator(): Generator<BoundedContext> {
            for (const node of AstUtils.streamAllContents(model)) {
                if (isBoundedContext(node)) {
                    yield node;
                }
            }
        }
        return new BcQueryBuilderImpl(bcIterator(), this.fqnProvider, this.getIndexes());
    }

    teams(): QueryBuilder<Team> {
        // Use generator for lazy iteration
        const model = this.model;
        function* teamIterator(): Generator<Team> {
            for (const node of AstUtils.streamAllContents(model)) {
                if (isTeam(node)) {
                    yield node;
                }
            }
        }
        return new QueryBuilderImpl(teamIterator(), this.fqnProvider);
    }

    classifications(): QueryBuilder<Classification> {
        // Use generator for lazy iteration
        const model = this.model;
        function* classIterator(): Generator<Classification> {
            for (const node of AstUtils.streamAllContents(model)) {
                if (isClassification(node)) {
                    yield node;
                }
            }
        }
        return new QueryBuilderImpl(classIterator(), this.fqnProvider);
    }

    relationships(): QueryBuilder<RelationshipView> {
        // Use generator for lazy iteration - combines BC and ContextMap relationships
        return new QueryBuilderImpl(this.iterateRelationships(), this.fqnProvider);
    }

    /** @internal Generator for relationship iteration */
    private *iterateRelationships(): Generator<RelationshipView> {
        // Collect relationships defined on bounded contexts
        for (const node of AstUtils.streamAllContents(this.model)) {
            if (isBoundedContext(node)) {
                for (const rel of node.relationships) {
                    const view = this.createRelationshipView(rel, node, 'BoundedContext');
                    if (view) {
                        yield view;
                    }
                }
            }
        }

        // Collect from ContextMap.relationships
        for (const node of AstUtils.streamAllContents(this.model)) {
            if (isContextMap(node)) {
                for (const rel of node.relationships) {
                    const view = this.createRelationshipView(rel, undefined, 'ContextMap');
                    if (view) {
                        yield view;
                    }
                }
            }
        }
    }

    contextMaps(): QueryBuilder<ContextMap> {
        const model = this.model;
        function* cmapIterator(): Generator<ContextMap> {
            for (const node of AstUtils.streamAllContents(model)) {
                if (isContextMap(node)) {
                    yield node;
                }
            }
        }
        return new QueryBuilderImpl(cmapIterator(), this.fqnProvider);
    }

    domainMaps(): QueryBuilder<DomainMap> {
        const model = this.model;
        function* dmapIterator(): Generator<DomainMap> {
            for (const node of AstUtils.streamAllContents(model)) {
                if (isDomainMap(node)) {
                    yield node;
                }
            }
        }
        return new QueryBuilderImpl(dmapIterator(), this.fqnProvider);
    }

    namespaces(): QueryBuilder<NamespaceDeclaration> {
        const model = this.model;
        function* nsIterator(): Generator<NamespaceDeclaration> {
            for (const node of AstUtils.streamAllContents(model)) {
                if (isNamespaceDeclaration(node)) {
                    yield node;
                }
            }
        }
        return new QueryBuilderImpl(nsIterator(), this.fqnProvider);
    }

    byFqn<T extends AstNode = AstNode>(fqn: string): T | undefined {
        return this.getIndexes().byFqn.get(fqn) as T | undefined;
    }

    domain(name: string): Domain | undefined {
        // Try FQN lookup first
        const byFqn = this.byFqn<Domain>(name);
        if (byFqn) {
            return byFqn;
        }

        // Fallback to simple name lookup
        const nodes = this.getIndexes().byName.get(name) ?? [];
        return nodes.find(isDomain);
    }

    boundedContext(name: string): BoundedContext | undefined {
        // Try FQN lookup first
        const byFqn = this.byFqn<BoundedContext>(name);
        if (byFqn) {
            return byFqn;
        }

        // Fallback to simple name lookup
        const nodes = this.getIndexes().byName.get(name) ?? [];
        return nodes.find(isBoundedContext);
    }

    bc(name: string): BoundedContext | undefined {
        return this.boundedContext(name);
    }

    team(name: string): Team | undefined {
        const nodes = this.getIndexes().byName.get(name) ?? [];
        return nodes.find(isTeam);
    }

    fqn(node: AstNode): string {
        if ('name' in node && typeof node.name === 'string' && node.$container) {
            const container = node.$container;
            if (isModel(container) || isNamespaceDeclaration(container)) {
                return this.fqnProvider.getQualifiedName(container, node.name);
            }
        }
        return '';
    }

    /**
     * Creates a RelationshipView from a Relationship AST node.
     * Resolves 'this' references to the containing BoundedContext.
     */
    private createRelationshipView(
        rel: Relationship,
        containingBc: BoundedContext | undefined,
        source: 'BoundedContext' | 'ContextMap'
    ): RelationshipView | undefined {
        const left = this.resolveContextRef(rel.left, containingBc);
        const right = this.resolveContextRef(rel.right, containingBc);

        if (!left || !right) {
            return undefined;
        }

        return {
            left,
            right,
            arrow: rel.arrow,
            leftPatterns: rel.leftPatterns,
            rightPatterns: rel.rightPatterns,
            type: rel.type,
            inferredType: this.inferRelationshipType(rel),
            source,
            astNode: rel,
        };
    }

    /**
     * Resolves a BoundedContextRef to a BoundedContext.
     * Handles 'this' references by using the containing BoundedContext.
     */
    private resolveContextRef(
        ref: BoundedContextRef,
        containingBc: BoundedContext | undefined
    ): BoundedContext | undefined {
        if (isThisRef(ref)) {
            return containingBc;
        }
        return ref.link?.ref;
    }

    /**
     * Infers relationship type from integration patterns.
     * Simple heuristic based on common DDD pattern combinations.
     */
    private inferRelationshipType(rel: Relationship): string | undefined {
        const leftPatterns = rel.leftPatterns;
        const rightPatterns = rel.rightPatterns;

        // Partnership: Bidirectional with P or SK
        if (rel.arrow === '<->' && (leftPatterns.includes('P') || leftPatterns.includes('SK'))) {
            return 'Partnership';
        }

        // Shared Kernel: SK pattern
        if (leftPatterns.includes('SK') || rightPatterns.includes('SK')) {
            return 'SharedKernel';
        }

        // Customer-Supplier: OHS + CF
        if (leftPatterns.includes('OHS') && rightPatterns.includes('CF')) {
            return 'CustomerSupplier';
        }

        // Upstream-Downstream: directional arrow
        if (rel.arrow === '->') {
            return 'UpstreamDownstream';
        }

        // Separate Ways
        if (rel.arrow === '><') {
            return 'SeparateWays';
        }

        return undefined;
    }
}

/**
 * Base implementation of QueryBuilder with lazy iteration.
 * Predicates are chained and only evaluated during iteration.
 */
class QueryBuilderImpl<T> implements QueryBuilder<T> {
    protected readonly sourceItems: Iterable<T>;
    protected readonly predicateList: Array<(item: T) => boolean>;
    
    constructor(
        items: Iterable<T>,
        protected readonly fqnProvider: QualifiedNameProvider,
        predicates: Array<(item: T) => boolean> = []
    ) {
        this.sourceItems = items;
        this.predicateList = predicates;
    }

    where(predicate: (item: T) => boolean): QueryBuilder<T> {
        return new QueryBuilderImpl(
            this.sourceItems,
            this.fqnProvider,
            [...this.predicateList, predicate]
        );
    }

    withName(pattern: string | RegExp): QueryBuilder<T> {
        const regex = typeof pattern === 'string' ? new RegExp(`^${escapeRegex(pattern)}$`) : pattern;
        return this.where((item: T) => {
            const node = item as unknown as AstNode;
            if ('name' in node && typeof node.name === 'string') {
                return regex.test(node.name);
            }
            return false;
        });
    }

    withFqn(pattern: string | RegExp): QueryBuilder<T> {
        const regex = typeof pattern === 'string' ? new RegExp(`^${escapeRegex(pattern)}$`) : pattern;
        return this.where((item: T) => {
            const node = item as unknown as AstNode;
            if ('name' in node && typeof node.name === 'string' && node.$container) {
                const container = node.$container;
                if (isModel(container) || isNamespaceDeclaration(container)) {
                    const fqn = this.fqnProvider.getQualifiedName(container, node.name);
                    return regex.test(fqn);
                }
            }
            return false;
        });
    }

    first(): T | undefined {
        for (const item of this) {
            return item;
        }
        return undefined;
    }

    toArray(): T[] {
        return Array.from(this);
    }

    count(): number {
        let count = 0;
        for (const _ of this) {
            count++;
        }
        return count;
    }

    *[Symbol.iterator](): Iterator<T> {
        for (const item of this.sourceItems) {
            if (this.predicateList.every(p => p(item))) {
                yield item;
            }
        }
    }
}

/**
 * BoundedContext-specific QueryBuilder with domain filters.
 * Supports indexed lookups for performance when filters allow.
 */
class BcQueryBuilderImpl extends QueryBuilderImpl<BoundedContext> implements BcQueryBuilder {
    constructor(
        items: Iterable<BoundedContext>,
        fqnProvider: QualifiedNameProvider,
        private readonly indexes: ModelIndexes,
        predicates: Array<(item: BoundedContext) => boolean> = []
    ) {
        super(items, fqnProvider, predicates);
    }

    override where(predicate: (item: BoundedContext) => boolean): BcQueryBuilder {
        return new BcQueryBuilderImpl(
            this.sourceItems,
            this.fqnProvider,
            this.indexes,
            [...this.predicateList, predicate]
        );
    }

    override withName(pattern: string | RegExp): BcQueryBuilder {
        return super.withName(pattern) as BcQueryBuilder;
    }

    override withFqn(pattern: string | RegExp): BcQueryBuilder {
        return super.withFqn(pattern) as BcQueryBuilder;
    }

    inDomain(domain: string | Domain): BcQueryBuilder {
        const domainName = typeof domain === 'string' ? domain : domain.name;
        return this.where(bc => bc.domain?.ref?.name === domainName);
    }

    withTeam(team: string | Team): BcQueryBuilder {
        const teamName = typeof team === 'string' ? team : team.name;
        
        // Use index for initial filtering if no predicates yet
        if (this.predicateList.length === 0) {
            const indexed = this.indexes.byTeam.get(teamName) ?? [];
            return new BcQueryBuilderImpl(indexed, this.fqnProvider, this.indexes);
        }
        
        // Add predicate to existing chain
        return this.where(bc => effectiveTeam(bc)?.name === teamName);
    }

    withRole(role: string | Classification): BcQueryBuilder {
        const roleName = typeof role === 'string' ? role : role.name;
        
        // Use index for initial filtering if no predicates yet
        if (this.predicateList.length === 0) {
            const indexed = this.indexes.byRole.get(roleName) ?? [];
            return new BcQueryBuilderImpl(indexed, this.fqnProvider, this.indexes);
        }
        
        // Add predicate to existing chain
        return this.where(bc => effectiveRole(bc)?.name === roleName);
    }

    withMetadata(key: string, value?: string): BcQueryBuilder {
        // Use index for initial filtering if no predicates yet and no value specified
        if (this.predicateList.length === 0 && value === undefined) {
            const indexed = this.indexes.byMetadataKey.get(key) ?? [];
            return new BcQueryBuilderImpl(indexed, this.fqnProvider, this.indexes);
        }
        
        // Add predicate to existing chain
        return this.where(bc => {
            const metadata = metadataAsMap(bc);
            const metaValue = metadata.get(key);
            if (metaValue === undefined) {
                return false;
            }
            return value === undefined || metaValue === value;
        });
    }
}

/**
 * Escapes special regex characters in a string.
 */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Augments BoundedContext instances with SDK-resolved properties.
 * Called during model loading to enrich the AST.
 * 
 * Properties use natural names (not sdk* prefix) per PRS:
 * "Properties are discoverable in IDE autocomplete. The SDK enriches the AST 
 * during load, so `bc.role` just works—no imports needed."
 * 
 * Note: We use getters to avoid computing values until accessed.
 * Note: We use Object.defineProperty to avoid modifying the original interface.
 * 
 * @param bc - BoundedContext to augment
 */
export function augmentBoundedContext(bc: BoundedContext): void {
    const fqnProvider = new QualifiedNameProvider();
    
    // Define computed properties with getters for lazy evaluation
    // Only include properties that add value beyond direct AST access:
    // - effectiveRole/effectiveTeam: array precedence resolution
    // - metadataMap: array to Map conversion
    // - fqn: computed qualified name
    // - helper methods: hasRole, hasTeam, hasMetadata
    Object.defineProperties(bc, {
        effectiveRole: {
            get: () => effectiveRole(bc),
            enumerable: true,
            configurable: true,
        },
        effectiveTeam: {
            get: () => effectiveTeam(bc),
            enumerable: true,
            configurable: true,
        },
        metadataMap: {
            get: () => metadataAsMap(bc),
            enumerable: true,
            configurable: true,
        },
        fqn: {
            get: () => {
                if (bc.$container && (isModel(bc.$container) || isNamespaceDeclaration(bc.$container))) {
                    return fqnProvider.getQualifiedName(bc.$container, bc.name);
                }
                return bc.name;
            },
            enumerable: true,
            configurable: true,
        },
        // Helper methods
        hasRole: {
            value: (name: string | Classification): boolean => {
                const role = effectiveRole(bc);
                if (!role) return false;
                const targetName = typeof name === 'string' ? name : name?.name;
                if (!targetName) return false;
                return role.name === targetName;
            },
            enumerable: false,
            configurable: true,
        },
        hasTeam: {
            value: (name: string | Team): boolean => {
                const team = effectiveTeam(bc);
                if (!team) return false;
                const targetName = typeof name === 'string' ? name : name?.name;
                if (!targetName) return false;
                return team.name === targetName;
            },
            enumerable: false,
            configurable: true,
        },
        hasMetadata: {
            value: (key: string, value?: string): boolean => {
                const metadata = metadataAsMap(bc);
                const metaValue = metadata.get(key);
                if (metaValue === undefined) return false;
                return value === undefined || metaValue === value;
            },
            enumerable: false,
            configurable: true,
        },
    });
}

/**
 * Augments Domain instances with SDK-resolved properties.
 * Called during model loading to enrich the AST.
 * 
 * Only includes properties that add value beyond direct AST access:
 * - fqn: computed qualified name
 * - hasClassification: helper method
 * 
 * Direct access (no augmentation needed):
 * - domain.description
 * - domain.vision
 * - domain.classification?.ref
 * 
 * @param domain - Domain to augment
 */
export function augmentDomain(domain: Domain): void {
    const fqnProvider = new QualifiedNameProvider();
    
    Object.defineProperties(domain, {
        fqn: {
            get: () => {
                if (domain.$container && (isModel(domain.$container) || isNamespaceDeclaration(domain.$container))) {
                    return fqnProvider.getQualifiedName(domain.$container, domain.name);
                }
                return domain.name;
            },
            enumerable: true,
            configurable: true,
        },
        // Helper methods
        hasClassification: {
            value: (name: string | Classification): boolean => {
                const classification = domain.classification?.ref;
                if (!classification) return false;
                const targetName = typeof name === 'string' ? name : name?.name;
                if (!targetName) return false;
                return classification.name === targetName;
            },
            enumerable: false,
            configurable: true,
        },
    });
}

/**
 * Augments Relationship instances with SDK helper methods.
 * Called during model loading to enrich the AST.
 * 
 * @param rel - Relationship to augment
 * @param containingBc - BoundedContext containing this relationship (for 'this' resolution)
 */
export function augmentRelationship(rel: Relationship, containingBc?: BoundedContext): void {
    Object.defineProperties(rel, {
        leftContextName: {
            get: () => {
                if (isThisRef(rel.left)) {
                    return containingBc?.name ?? 'this';
                }
                return rel.left.link?.ref?.name ?? '';
            },
            enumerable: true,
            configurable: true,
        },
        rightContextName: {
            get: () => {
                if (isThisRef(rel.right)) {
                    return containingBc?.name ?? 'this';
                }
                return rel.right.link?.ref?.name ?? '';
            },
            enumerable: true,
            configurable: true,
        },
        isBidirectional: {
            get: () => rel.arrow === '<->',
            enumerable: true,
            configurable: true,
        },
        // Helper methods for pattern matching (type-safe, no magic strings)
        hasPattern: {
            value: (pattern: string): boolean => {
                return rel.leftPatterns.some(p => matchesPattern(p, pattern)) ||
                       rel.rightPatterns.some(p => matchesPattern(p, pattern));
            },
            enumerable: false,
            configurable: true,
        },
        hasLeftPattern: {
            value: (pattern: string): boolean => {
                return rel.leftPatterns.some(p => matchesPattern(p, pattern));
            },
            enumerable: false,
            configurable: true,
        },
        hasRightPattern: {
            value: (pattern: string): boolean => {
                return rel.rightPatterns.some(p => matchesPattern(p, pattern));
            },
            enumerable: false,
            configurable: true,
        },
        isUpstream: {
            value: (side: 'left' | 'right'): boolean => {
                const patterns = side === 'left' ? rel.leftPatterns : rel.rightPatterns;
                return patterns.some(p => isUpstreamPattern(p));
            },
            enumerable: false,
            configurable: true,
        },
        isDownstream: {
            value: (side: 'left' | 'right'): boolean => {
                const patterns = side === 'left' ? rel.leftPatterns : rel.rightPatterns;
                return patterns.some(p => isDownstreamPattern(p));
            },
            enumerable: false,
            configurable: true,
        },
    });
}

/**
 * Internal implementation of model augmentation.
 * Called by ensureAugmented() which tracks augmentation state.
 * 
 * @param model - Root Model node to augment
 */
function augmentModelInternal(model: Model): void {
    for (const node of AstUtils.streamAllContents(model)) {
        if (isBoundedContext(node)) {
            augmentBoundedContext(node);
            // Augment relationships inside this bounded context
            for (const rel of node.relationships) {
                augmentRelationship(rel, node);
            }
        } else if (isDomain(node)) {
            augmentDomain(node);
        } else if (isContextMap(node)) {
            // Augment relationships in context maps (no containing BC)
            for (const rel of node.relationships) {
                augmentRelationship(rel, undefined);
            }
        }
    }
}

/**
 * Augments all AST nodes in a model with SDK-resolved properties.
 * 
 * This function walks the entire AST and adds lazy getters for resolved
 * properties like `effectiveRole`, `effectiveTeam`, etc.
 * 
 * Idempotent - safe to call multiple times on the same model.
 * Automatically called by `fromModel()`, `fromDocument()`, and `fromServices()`.
 * 
 * @param model - Root Model node to augment
 */
export function augmentModel(model: Model): void {
    ensureAugmented(model);
}
