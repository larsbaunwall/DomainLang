import { type Model, type Relationship, type StructureElement, isBoundedContext, isContextMap, isPackageDeclaration, type BoundedContext } from '../generated/ast.js';


export function setInferredRelationshipTypes(model: Model) {
    walkStructureElements(model.children);
}

function walkStructureElements(elements: StructureElement[] = [], containerBc?: BoundedContext) {
    for (const element of elements) {
        if (isPackageDeclaration(element)) {
            walkStructureElements(element.children, containerBc);
        } else if (isBoundedContext(element)) {
            const relationshipsBlock = element.documentation.find(block => 'relationships' in block);
            if (relationshipsBlock && 'relationships' in relationshipsBlock) {
                for (const rel of relationshipsBlock.relationships) {
                    enrichRelationship(rel, element);
                }
            }
        } else if (isContextMap(element)) {
            if (element.relationships) {
                for (const rel of element.relationships) {
                    enrichRelationship(rel, undefined);
                }
            }
        }
        // Add more cases if you have other containers
    }
}

// function resolveBoundedContextRef(ref: BoundedContextRef, container: BoundedContext | undefined): BoundedContext | undefined {
//     if (isThisRef(ref)) {
//         return container;
//     }
//     // ref.ref is a Reference<BoundedContext> | undefined; get the actual node via $ref
//     if (ref && 'ref' in ref && ref.ref && '$ref' in ref.ref && ref.ref.$ref) {
//         return ref.ref.$ref as BoundedContext;
//     }
//     return undefined;
// }

function enrichRelationship(rel: Relationship, containerBc?: BoundedContext) {
    // Example: resolve left/right for further processing
    //const leftContext = resolveBoundedContextRef(rel.left, containerBc);
    //const rightContext = resolveBoundedContextRef(rel.right, containerBc);
    // You can use leftContext/rightContext as needed for further inference
    if (!rel.type) {
        rel.inferredType = inferRelationshipType(rel);
    }
}

function inferRelationshipType(relationship: Relationship): string | undefined {
    const left = (relationship.leftRoles ?? []).map(r => r.toUpperCase());
    const right = (relationship.rightRoles ?? []).map(r => r.toUpperCase());

    if (relationship.arrow === '><') {
        return 'SeparateWays';
    }
    if (relationship.arrow === '<->') {
        if ((left.length === 0 && right.length === 0) || (left.includes('P') && right.includes('P'))) {
            return 'Partnership';
        }
        if (left.includes('SK') && right.includes('SK')) {
            return 'SharedKernel';
        }
    } else if (relationship.arrow === '->' || relationship.arrow === '<-') {
        // Always default to UpstreamDownstream unless type is explicitly set
        return 'UpstreamDownstream';
    }
    return undefined;
} 