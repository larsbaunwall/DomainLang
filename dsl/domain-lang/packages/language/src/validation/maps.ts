import type { ValidationAcceptor } from 'langium';
import type { ContextMap, DomainMap } from '../generated/ast.js';
import { ValidationMessages, buildCodeDescription } from './constants.js';

/**
 * Validates that a context map contains at least one bounded context.
 * Empty context maps are not useful for documentation purposes.
 * 
 * @param map - The context map to validate
 * @param accept - The validation acceptor for reporting issues
 */
function validateContextMapHasContexts(
    map: ContextMap,
    accept: ValidationAcceptor
): void {
    if (!map.boundedContexts || map.boundedContexts.length === 0) {
        accept('warning', ValidationMessages.CONTEXT_MAP_NO_CONTEXTS(map.name), {
            node: map,
            keyword: 'contains',
            codeDescription: buildCodeDescription('language.md', 'context-maps')
        });
    }
}

/**
 * Validates that a context map has at least one relationship if it contains multiple contexts.
 * Multiple unrelated contexts should have documented relationships.
 * 
 * @param map - The context map to validate
 * @param accept - The validation acceptor for reporting issues
 */
function validateContextMapHasRelationships(
    map: ContextMap,
    accept: ValidationAcceptor
): void {
    const contextCount = map.boundedContexts?.length ?? 0;
    const relationshipCount = map.relationships?.length ?? 0;
    
    // Only warn if multiple contexts exist without relationships
    if (contextCount > 1 && relationshipCount === 0) {
        accept('info', ValidationMessages.CONTEXT_MAP_NO_RELATIONSHIPS(map.name, contextCount), {
            node: map,
            keyword: 'ContextMap',
            codeDescription: buildCodeDescription('language.md', 'context-maps')
        });
    }
}

/**
 * Validates that a domain map contains at least one domain.
 * Empty domain maps are not useful for documentation purposes.
 * 
 * @param map - The domain map to validate
 * @param accept - The validation acceptor for reporting issues
 */
function validateDomainMapHasDomains(
    map: DomainMap,
    accept: ValidationAcceptor
): void {
    if (!map.domains || map.domains.length === 0) {
        accept('warning', ValidationMessages.DOMAIN_MAP_NO_DOMAINS(map.name), {
            node: map,
            keyword: 'contains',
            codeDescription: buildCodeDescription('language.md', 'domain-maps')
        });
    }
}

export const contextMapChecks = [
    validateContextMapHasContexts,
    validateContextMapHasRelationships
];

export const domainMapChecks = [
    validateDomainMapHasDomains
];
