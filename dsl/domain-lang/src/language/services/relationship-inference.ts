import type { 
    Model, 
    Relationship, 
    StructureElement, 
    BoundedContext,
    ContextMap
} from '../generated/ast.js';
import { 
    isBoundedContext, 
    isContextMap, 
    isGroupDeclaration 
} from '../generated/ast.js';

/**
 * Enriches relationships in the model by inferring relationship types
 * from roles and arrow directions.
 * 
 * This service walks the entire model structure and applies inference
 * rules to relationships that don't have an explicit type.
 * 
 * @param model - The root model to process
 */
export function setInferredRelationshipTypes(model: Model): void {
    walkStructureElements(model.children);
}

/**
 * Recursively walks structure elements to find and enrich relationships.
 * 
 * @param elements - Array of structure elements to process
 * @param containerBc - Optional container bounded context (for nested contexts)
 */
function walkStructureElements(
    elements: StructureElement[] = [], 
    containerBc?: BoundedContext
): void {
    for (const element of elements) {
        if (isGroupDeclaration(element)) {
            walkStructureElements(element.children, containerBc);
        } else if (isBoundedContext(element)) {
            processContextRelationships(element);
        } else if (isContextMap(element)) {
            processMapRelationships(element);
        }
    }
}

/**
 * Processes relationships within a bounded context.
 * 
 * @param context - The bounded context to process
 */
function processContextRelationships(context: BoundedContext): void {
    const relationshipsBlock = context.documentation.find(
        block => 'relationships' in block
    );
    
    if (relationshipsBlock && 'relationships' in relationshipsBlock) {
        for (const rel of relationshipsBlock.relationships) {
            enrichRelationship(rel);
        }
    }
}

/**
 * Processes relationships within a context map.
 * 
 * @param map - The context map to process
 */
function processMapRelationships(map: ContextMap): void {
    if (map.relationships) {
        for (const rel of map.relationships) {
            enrichRelationship(rel);
        }
    }
}

/**
 * Enriches a single relationship by inferring its type if not explicitly set.
 * 
 * @param rel - The relationship to enrich
 */
function enrichRelationship(rel: Relationship): void {
    if (!rel.type) {
        rel.inferredType = inferRelationshipType(rel);
    }
}

/**
 * Infers relationship type from arrow direction and roles.
 * 
 * Inference rules:
 * - `><` → SeparateWays
 * - `<->` with P roles → Partnership
 * - `<->` with SK roles → SharedKernel
 * - `->` or `<-` → UpstreamDownstream
 * 
 * @param relationship - The relationship to analyze
 * @returns The inferred type or undefined if no rule matches
 */
function inferRelationshipType(relationship: Relationship): string | undefined {
    const leftRoles = (relationship.leftRoles ?? []).map(r => r.toUpperCase());
    const rightRoles = (relationship.rightRoles ?? []).map(r => r.toUpperCase());

    if (relationship.arrow === '><') {
        return 'SeparateWays';
    }
    
    if (relationship.arrow === '<->') {
        const noRoles = leftRoles.length === 0 && rightRoles.length === 0;
        const bothPartners = leftRoles.includes('P') && rightRoles.includes('P');
        
        if (noRoles || bothPartners) {
            return 'Partnership';
        }
        
        if (leftRoles.includes('SK') && rightRoles.includes('SK')) {
            return 'SharedKernel';
        }
    }
    
    if (relationship.arrow === '->' || relationship.arrow === '<-') {
        return 'UpstreamDownstream';
    }
    
    return undefined;
} 