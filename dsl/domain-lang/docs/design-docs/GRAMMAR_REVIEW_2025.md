# DomainLang Grammar Review - October 2025

**Reviewer**: GitHub Copilot (Langium & DDD Expert)  
**Date**: October 5, 2025  
**Scope**: Complete grammar analysis from language design and DDD perspectives  
**Status**: ✅ Production-ready with enhancement opportunities

---

## Executive Summary

DomainLang has achieved a **mature and well-designed grammar** that successfully balances DDD compliance, language ergonomics, and IDE tooling integration. The recent DDD compliance audit (documented in `DDD_COMPLIANCE_AUDIT.md`) addressed critical issues, resulting in a grammar that properly enforces Domain-Driven Design principles while remaining accessible to both DDD experts and newcomers.

### Overall Assessment

| Aspect | Rating | Notes |
|--------|--------|-------|
| **DDD Compliance** | ✅ Excellent | All canonical patterns supported, proper boundary enforcement |
| **Language Ergonomics** | ✅ Very Good | Flexible syntax, multiple keyword aliases, optional/required balance |
| **Type System Design** | ✅ Excellent | Proper use of Langium type inference, clean AST structure |
| **Scoping & References** | ✅ Excellent | Multi-level namespacing, qualified names, proper MultiReference usage |
| **Documentation** | ✅ Very Good | Rich JSDoc, good inline documentation, comprehensive guides |
| **Extensibility** | ✅ Good | Clear structure for future additions, proper separation of concerns |
| **Validation Support** | ⚠️ Good | Solid foundation, opportunities for richer semantic checks |

### Key Strengths

1. **DDD-First Design**: Grammar constructs map directly to DDD strategic patterns
2. **Git-Native Imports**: Innovative dependency system aligns with modern DevOps
3. **Flexible Authoring**: Multiple syntax options (aliases, assignment operators) improve UX
4. **Rich Metadata**: Documentation blocks support comprehensive domain modeling
5. **Clean Architecture**: Well-organized sections, proper separation of strategic/tactical

### Key Opportunities

1. **Tactical DDD Support**: Add Aggregate, Entity, ValueObject modeling
2. **Enhanced Validation**: More semantic checks for common DDD anti-patterns
3. **Relationship Constraints**: Type-safe relationship pattern combinations
4. **Documentation Standardization**: Unified approach to required vs. optional metadata
5. **Query & Analysis Support**: Add dedicated constructs for model introspection

---

## Detailed Analysis

### 1. Strategic Design Constructs ✅

#### Domains

**Current Design**:
```langium
Domain:
    ('Domain' | 'domain') name=ID ('in' parentDomain=[Domain:QualifiedName])?
    '{'
        documentation+=DomainDocumentationBlock*
    '}'
```

**Strengths**:
- ✅ Proper subdomain hierarchy via `in` keyword
- ✅ Documentation blocks support description, vision, classifier
- ✅ Clean syntax matches DDD terminology exactly

**Recommendations**:

**R1.1 - Explicit Subdomain Type** [Medium Priority]
```langium
// Current: Uses generic classifier
Domain Sales {
    classifier: CoreDomain  // Generic reference
}

// Recommended: Dedicated subdomain type field
Domain Sales {
    type: Core  // or Supporting, Generic
    classifier: Strategic  // For other classifications
}
```

**Rationale**: Makes core DDD concept (subdomain classification) first-class rather than relying on generic classifiers. Improves discoverability and enables type-safe validation.

**Impact**: Breaking change; requires migration path.

**R1.2 - Domain Capabilities** [Low Priority]
```langium
Domain Sales {
    description: "..."
    capabilities {
        OrderManagement: "Handle customer orders"
        PricingCalculation: "Determine product prices"
    }
}
```

**Rationale**: Supports capability mapping from business to technical concerns, a common DDD practice.

---

#### Bounded Contexts

**Current Design**:
```langium
BoundedContext:
    ('BoundedContext' | 'boundedcontext' | 'BC' | 'Context') name=ID 
    ('for' domain=[Domain:QualifiedName])?
    (
        (('as' | 'tagged:') inlineRole=[Classification:QualifiedName])?
        (('by' | 'owner:') inlineTeam=[Team:QualifiedName])?
    )?
    ('{' documentation+=BoundedContextDocumentationBlock* '}')?
```

**Strengths**:
- ✅ Multiple keyword aliases improve ergonomics (bc is concise, BoundedContext is explicit)
- ✅ Inline role and team assignments provide convenient shorthand
- ✅ Single domain reference properly enforces boundary integrity (fixed in audit)
- ✅ Optional body allows lightweight declarations
- ✅ Rich documentation blocks (relationships, terminology, decisions, classifiers)

**Issues Identified**:

**I1.1 - Inconsistent Keyword: "implements"** [FIXED ✅]
- Previously allowed `bc Sales implements SalesDomain` 
- Fixed in DDD audit: removed "implements" keyword
- Proper syntax now: `bc Sales for SalesDomain`

**I1.2 - Confusing Inline vs. Block Syntax**
```langium
// Option 1: Inline
bc Sales for Domain1 as CoreRole by Team1

// Option 2: Block  
bc Sales for Domain1 {
    role: CoreRole
    team: Team1
}

// Option 3: Mixed (currently allowed!)
bc Sales for Domain1 as CoreRole {
    team: Team1  // Redundant/conflicting?
}
```

**Current Behavior**: Both inline and block assignments can coexist. Unclear precedence.

**Recommendations**:

**R1.3 - Document Precedence Rules** [High Priority]
Add validation that warns when both inline and block forms are used for the same property:

```typescript
function validateBoundedContextRedundantMetadata(
    bc: BoundedContext,
    accept: ValidationAcceptor
): void {
    // Check if inline role conflicts with block role
    if (bc.inlineRole && bc.documentation?.some(isRoleBlock)) {
        accept('warning', 
            `Role defined both inline (as ${bc.inlineRole.ref?.name}) and in documentation block. Inline value will be ignored.`,
            { node: bc, property: 'inlineRole' }
        );
    }
    
    // Similar for team
    if (bc.inlineTeam && bc.documentation?.some(isTeamBlock)) {
        accept('warning',
            `Team defined both inline and in documentation block...`,
            { node: bc, property: 'inlineTeam' }
        );
    }
}
```

**R1.4 - Explicit BC.domain Cardinality** [High Priority - Validation]
While grammar now correctly enforces single domain reference, add validation that **requires** domain assignment for production contexts:

```typescript
function validateBoundedContextHasDomain(
    bc: BoundedContext,
    accept: ValidationAcceptor
): void {
    if (!bc.domain) {
        accept('warning',
            `Bounded Context '${bc.name}' is not associated with a domain. Strategic DDD recommends explicit domain assignment.`,
            { node: bc, property: 'domain' }
        );
    }
}
```

**Rationale**: Every BC *should* belong to a domain (per DDD). Making it optional in grammar allows incremental modeling, but validation should guide toward best practices.

---

#### Context Groups

**Current Design**:
```langium
ContextGroup:
    ('ContextGroup' | 'contextgroup') name=ID 
    (('for' | 'in') domain=[Domain:QualifiedName])?
    '{'
        ('role' Assignment roleClassifier=[Classification:QualifiedName])?
        (('contexts' | 'contains') contexts+=[+BoundedContext:QualifiedName] 
            (',' contexts+=[+BoundedContext:QualifiedName])*)?
    '}'
```

**Strengths**:
- ✅ Proper MultiReference for contexts (allows aggregating same-named BCs from different packages)
- ✅ Cross-domain validation warning implemented (from DDD audit)
- ✅ Optional domain scoping

**Recommendations**:

**R1.5 - Explicit Purpose Field** [Medium Priority]
```langium
ContextGroup CoreDomains {
    purpose: "Groups all core domain contexts for strategic review"
    role: Strategic.CoreDomain
    contains OrderManagement, Pricing
}
```

**Rationale**: Context groups serve different purposes (strategic classification, visualization, governance boundaries). Explicit purpose improves model comprehension.

**R1.6 - Alternative: Typed Context Groups** [Low Priority]
```langium
// Instead of generic ContextGroup, consider specialized types
StrategicGroup CoreDomains {
    classification: Core
    contains ...
}

VisualizationGroup CustomerJourney {
    layout: horizontal
    contains ...
}

GovernanceGroup RegulatedContexts {
    complianceRequirements: ["PCI-DSS", "GDPR"]
    contains ...
}
```

**Rationale**: Different group types have different constraints and metadata needs. Type-safe groups enable better validation.

---

### 2. Architecture Mapping ✅

#### Context Maps

**Current Design**:
```langium
ContextMap:
    ('ContextMap' | 'contextmap') name=ID
    '{'
        ('contains' boundedContexts += [+BoundedContext:QualifiedName] 
            ((",")? boundedContexts += [+BoundedContext:QualifiedName])*)*
        (relationships += Relationship ((",")? relationships += Relationship)*)*
    '}'

Relationship:
    ('[' leftRoles+=RoleEnum (',' leftRoles+=RoleEnum)* ']')? 
    left=BoundedContextRef
    arrow=RelationshipArrow
    ('[' rightRoles+=RoleEnum (',' rightRoles+=RoleEnum)* ']')? 
    right=BoundedContextRef
    (':' type=RelationshipType)?
```

**Strengths**:
- ✅ Complete DDD pattern support (ACL, OHS, PL, CF, SK, P, BBoM)
- ✅ Multiple arrow styles (symbolic and named)
- ✅ Role annotations on both sides
- ✅ Special `this` reference for self-references
- ✅ Optional relationship type labels

**Issues Identified**:

**I2.1 - No Validation for Pattern Combinations**
Current grammar allows nonsensical combinations:
```dlang
// Semantically invalid but syntactically valid
[OHS, CF] Sales -> Billing  // Can't be both Open Host and Conformist
[ACL] Sales <-> Billing : SharedKernel  // ACL contradicts SharedKernel
```

**Recommendations**:

**R2.1 - Pattern Compatibility Validation** [High Priority]
```typescript
// Define valid pattern combinations
const INCOMPATIBLE_PATTERNS = [
    ['OHS', 'CF'],  // Open Host Service ⊥ Conformist
    ['ACL', 'SK'],  // Anti-Corruption Layer ⊥ Shared Kernel
    ['SK', 'PL'],   // Shared Kernel ⊥ Published Language
    // ... more combinations
];

const RELATIONSHIP_TYPE_REQUIRED_PATTERNS = {
    'SharedKernel': ['SK'],
    'Partnership': ['P'],
    'CustomerSupplier': ['PL', 'ACL'],  // At least one
    // ...
};

function validateRelationshipPatterns(
    rel: Relationship,
    accept: ValidationAcceptor
): void {
    const allRoles = [...rel.leftRoles, ...rel.rightRoles];
    
    // Check incompatible combinations
    for (const [pattern1, pattern2] of INCOMPATIBLE_PATTERNS) {
        if (allRoles.includes(pattern1) && allRoles.includes(pattern2)) {
            accept('error',
                `Incompatible patterns: ${pattern1} and ${pattern2} cannot be used together`,
                { node: rel }
            );
        }
    }
    
    // Check relationship type alignment
    if (rel.type) {
        const expectedPatterns = RELATIONSHIP_TYPE_REQUIRED_PATTERNS[rel.type];
        if (expectedPatterns && !expectedPatterns.some(p => allRoles.includes(p))) {
            accept('warning',
                `Relationship type '${rel.type}' typically requires patterns: ${expectedPatterns.join(' or ')}`,
                { node: rel, property: 'type' }
            );
        }
    }
}
```

**R2.2 - Directional Arrow Constraints** [Medium Priority]
```typescript
// Validate that arrow direction matches relationship semantics
function validateRelationshipDirection(
    rel: Relationship,
    accept: ValidationAcceptor  
): void {
    // SharedKernel should use bidirectional arrow
    if (rel.type === 'SharedKernel' && rel.arrow !== '<->') {
        accept('warning',
            `SharedKernel relationships should use bidirectional arrow '<->' (found: '${rel.arrow}')`,
            { node: rel, property: 'arrow' }
        );
    }
    
    // CustomerSupplier should use directed arrow
    if (rel.type === 'CustomerSupplier' && rel.arrow === '<->') {
        accept('warning',
            `CustomerSupplier is inherently directional; consider using '->' or 'C/S'`,
            { node: rel, property: 'arrow' }
        );
    }
}
```

**R2.3 - Relationship Documentation** [Low Priority]
```langium
Relationship:
    // ... existing ...
    (':' type=RelationshipType)?
    ('described' 'as' description=STRING)?  // Add optional description
```

Example:
```dlang
[OHS] Catalog -> [ACL] Orders : UpstreamDownstream
    described as "Catalog publishes product changes via event stream"
```

---

#### Domain Maps

**Current Design**:
```langium
DomainMap:
    ('DomainMap' | 'domainmap') name=ID
    '{'
        ('contains' domains += [+Domain:QualifiedName] 
            ((",")? domains += [+Domain:QualifiedName])*)*
    '}'
```

**Strengths**:
- ✅ Clean visualization of domain portfolios
- ✅ MultiReference for domains (allows cross-package aggregation)

**Issues**:

**I2.2 - Limited Expressiveness**
Domain maps currently only aggregate domains without showing relationships between them.

**Recommendations**:

**R2.4 - Domain Relationships** [Medium Priority]
```langium
DomainMap:
    ('DomainMap' | 'domainmap') name=ID
    '{'
        ('contains' domains += [+Domain:QualifiedName] ((",")? domains += [+Domain:QualifiedName])*)*
        (domainRelationships += DomainRelationship)*  // NEW
    '}'

DomainRelationship:
    upstream=[Domain:QualifiedName] 
    ('provides' | 'supports' | 'depends-on') 
    downstream=[Domain:QualifiedName]
    (':' description=STRING)?
```

Example:
```dlang
DomainMap Enterprise {
    contains Sales, Billing, Inventory
    
    Sales depends-on Inventory : "Check product availability"
    Billing supports Sales : "Invoice processing"
}
```

---

### 3. Tactical Design Support ⚠️

**Current State**: DomainLang focuses heavily on **strategic DDD** (domains, contexts, relationships) but lacks **tactical DDD** constructs (Aggregates, Entities, Value Objects).

**Gap Analysis**:

| DDD Pattern | Support Level | Notes |
|-------------|---------------|-------|
| Domain | ✅ Full | Complete with subdomain hierarchy |
| Bounded Context | ✅ Full | Complete with rich metadata |
| Context Map | ✅ Full | All integration patterns |
| Ubiquitous Language | ✅ Good | Terminology blocks with examples |
| **Aggregate** | ❌ None | Not modeled |
| **Entity** | ❌ None | Not modeled |
| **Value Object** | ❌ None | Not modeled |
| **Domain Event** | ❌ None | Not modeled |
| **Command** | ❌ None | Not modeled |
| Repository | ❌ None | Not modeled |
| Service | ❌ None | Not modeled |

**Recommendations**:

**R3.1 - Add Aggregate Support** [High Priority]

This is the **single biggest enhancement opportunity**. Aggregates are fundamental to tactical DDD and bridge strategic (BC) and implementation (code).

```langium
/**
 * Aggregate Root - Cluster of entities and value objects with consistency boundary
 */
Aggregate:
    ('Aggregate' | 'aggregate') name=ID 
    ('in' context=[BoundedContext:QualifiedName])?
    '{'
        ('root' rootEntity=ID)?
        (entities+=EntityDeclaration)*
        (valueObjects+=ValueObjectDeclaration)*
        (events+=DomainEventDeclaration)*
        (commands+=CommandDeclaration)*
        (invariants+=InvariantRule)*
    '}'

EntityDeclaration:
    ('entity' | 'Entity') name=ID '{'
        (properties+=PropertyDeclaration)*
    '}'

ValueObjectDeclaration:
    ('value' | 'ValueObject') name=ID '{'
        (properties+=PropertyDeclaration)*
    '}'

PropertyDeclaration:
    name=ID ':' type=TypeReference
```

Example usage:
```dlang
bc OrderManagement for Sales {
    description: "..."
    
    Aggregate Order {
        root: Order
        
        entity Order {
            orderId: OrderId
            customerId: CustomerId
            items: OrderLineItem[]
            status: OrderStatus
        }
        
        value OrderLineItem {
            productId: ProductId
            quantity: Quantity
            price: Money
        }
        
        value OrderId {
            value: string
        }
        
        event OrderPlaced {
            orderId: OrderId
            timestamp: DateTime
        }
        
        command PlaceOrder {
            customerId: CustomerId
            items: OrderLineItem[]
        }
        
        invariant MinimumOrderValue {
            rule: "Total order value must exceed $10"
            implementation: "sum(items.price * items.quantity) > 10.00"
        }
    }
}
```

**Benefits**:
- Bridges strategic and tactical DDD
- Enables code generation for domain model
- Documents aggregate boundaries (critical for microservices)
- Supports event storming outcomes
- Foundation for CQRS/Event Sourcing modeling

**Impact**: Major addition; requires:
- Grammar expansion
- New AST types
- Validation rules (aggregate consistency, entity references)
- Documentation
- Code generation templates

**R3.2 - Type System for Properties** [Medium Priority]

If aggregates are added, need a type system:

```langium
TypeReference:
    primitiveType=PrimitiveType |
    customType=[Type:QualifiedName] |
    arrayType=ArrayTypeReference

PrimitiveType returns string:
    'string' | 'number' | 'boolean' | 'Date' | 'DateTime' | 'Money' | 'UUID'

ArrayTypeReference:
    elementType=TypeReference '[]'
```

**R3.3 - Domain Events as First-Class** [Medium Priority]

Even without full aggregates, domain events are crucial:

```langium
DomainEvent:
    ('event' | 'Event' | 'DomainEvent') name=ID
    ('in' context=[BoundedContext:QualifiedName])?
    '{'
        ('trigger' trigger=STRING)?
        (properties+=PropertyDeclaration)*
        ('subscribers' subscribers+=[BoundedContext:QualifiedName] 
            (',' subscribers+=[BoundedContext:QualifiedName])*)?
    '}'
```

Example:
```dlang
Event OrderPlaced in OrderManagement {
    trigger: "Customer completes checkout"
    
    orderId: OrderId
    customerId: CustomerId
    totalAmount: Money
    timestamp: DateTime
    
    subscribers: Billing, Shipping, Warehouse
}
```

This enables **event-driven architecture modeling** at the strategic level.

---

### 4. Module System & Imports ✅

**Current Design**:
```langium
ImportStatement:
    'import' (
        '{' symbols+=ID (',' symbols+=ID)* '}' 'from' uri=STRING
        | uri=STRING ('as' alias=ID)?
        ('integrity' integrity=STRING)?
    )

PackageDeclaration:
    'package' name=QualifiedName '{'
        (children+=StructureElement)*
    '}'

GroupDeclaration:
    ('Group' | 'group') name=QualifiedName '{'
        (children+=StructureElement)*
    '}'
```

**Strengths**:
- ✅ Git-native imports (innovative, aligns with modern DevOps)
- ✅ Multiple import styles (named, wildcard, aliased)
- ✅ Workspace-relative paths (`~/`)
- ✅ GitHub shorthand (`owner/repo@tag`)
- ✅ Integrity hashes (reserved for future security)
- ✅ Package and group namespacing
- ✅ Manifest-based dependency management

**This is a standout feature** - no other DDD DSL has git-native imports at this maturity level.

**Recommendations**:

**R4.1 - Export Control** [Medium Priority]

Currently, all symbols are implicitly exported. Add explicit export control:

```langium
// Option 1: Export statements
export Domain Sales
export bc OrderManagement

// Option 2: Private keyword
private Classification InternalOnly  // Not exported

// Option 3: Explicit export block
exports {
    Domain Sales
    bc OrderManagement
}
```

**Rationale**: Large models need encapsulation. Internal classifications/teams shouldn't leak to importers.

**R4.2 - Wildcard Imports** [Low Priority]
```langium
import * from "./shared/types.dlang"
import * as Shared from "./shared/types.dlang"
```

**R4.3 - Re-exports** [Low Priority]
```langium
import { CoreDomain } from "ddd-patterns"
export { CoreDomain }  // Re-export for downstream consumers
```

**R4.4 - Circular Import Detection** [High Priority - Validation]

Add validation to detect and report circular imports:

```typescript
function validateNoCircularImports(
    model: Model,
    accept: ValidationAcceptor,
    services: DomainLangServices
): void {
    const visited = new Set<string>();
    const stack = new Set<string>();
    
    function detectCycle(docUri: string): boolean {
        if (stack.has(docUri)) {
            accept('error',
                `Circular import detected: ${Array.from(stack).join(' -> ')} -> ${docUri}`,
                { node: model }
            );
            return true;
        }
        
        if (visited.has(docUri)) return false;
        
        visited.add(docUri);
        stack.add(docUri);
        
        // Check all imports from this document
        const doc = services.shared.workspace.LangiumDocuments.getDocument(URI.parse(docUri));
        if (doc?.parseResult.value) {
            for (const imp of (doc.parseResult.value as Model).imports) {
                const targetUri = resolveImportUri(imp, docUri);
                if (detectCycle(targetUri)) return true;
            }
        }
        
        stack.delete(docUri);
        return false;
    }
    
    detectCycle(model.$document!.uri.toString());
}
```

---

### 5. Documentation & Governance ✅

**Current Design**:
```langium
DomainTerm:
    ('term' | 'Term' | 'define') name=ID (Assignment meaning=STRING)?
    (('aka' | 'aka:' | 'synonyms' | 'synonyms:') synonyms+=ID (',' synonyms+=ID)*)?
    (('examples' | 'examples:' | 'e.g.' | 'e.g.:') examples+=STRING (',' examples+=STRING)*)?

AbstractDecision: Decision | Policy | BusinessRule

Decision:
    ('decision' | 'Decision') 
    ('[' category=DecisionCategory ']')?
    name=ID Assignment value=STRING
```

**Strengths**:
- ✅ Rich terminology support (synonyms, examples)
- ✅ Multiple decision types (decision, policy, rule) - flexible naming
- ✅ Category tags (architectural, business, technical, compliance, security, operational)
- ✅ Terminology blocks in BoundedContexts

**Recommendations**:

**R5.1 - Terminology Cross-References** [Medium Priority]

Currently, terms are defined but not used elsewhere:

```langium
// Allow references to terms in descriptions
DomainTerm:
    // ... existing ...
    ('related-to' relatedTerms+=[DomainTerm:QualifiedName] 
        (',' relatedTerms+=[DomainTerm:QualifiedName])*)?

// In properties (if aggregates added)
PropertyDeclaration:
    name=ID ':' type=TypeReference
    ('glossary' term=[DomainTerm:QualifiedName])?
```

Example:
```dlang
terminology {
    term Order: "Customer purchase request"
        examples: "Order #12345"
    
    term OrderLine: "Individual item in an order"
        related-to: Order
        
    term SKU: "Stock Keeping Unit"
        aka: ProductId
}

Aggregate Order {
    entity Order {
        orderId: OrderId glossary Order
        lines: OrderLine[] glossary OrderLine
    }
}
```

**R5.2 - Decision Status & Lifecycle** [Low Priority]
```langium
Decision:
    ('decision' | 'Decision')
    ('[' category=DecisionCategory ']')?
    ('status' status=DecisionStatus)?
    name=ID Assignment value=STRING
    ('rationale' rationale=STRING)?
    ('alternatives' alternatives+=STRING (',' alternatives+=STRING)*)?

DecisionStatus returns string:
    'proposed' | 'accepted' | 'deprecated' | 'superseded'
```

Example:
```dlang
decisions {
    decision [architectural] status proposed AdoptEventSourcing: "Use event sourcing for order history"
        rationale: "Audit requirements demand full change tracking"
        alternatives: "CRUD with audit log", "Change data capture"
    
    decision [architectural] status superseded UseRestAPI: "Use REST for all APIs"
        // Superseded by decision AdoptGraphQL
}
```

**R5.3 - Architecture Decision Records (ADR) Integration** [Medium Priority]

Add dedicated ADR construct:

```langium
ArchitectureDecisionRecord:
    'ADR' number=INT ':' title=STRING '{'
        'status' status=ADRStatus
        'context' context=STRING
        'decision' decision=STRING
        'consequences' consequences=STRING
        ('alternatives' '{' alternatives+=Alternative* '}')?
        ('supersedes' supersedes+=[ArchitectureDecisionRecord:QualifiedName] 
            (',' supersedes+=[ArchitectureDecisionRecord:QualifiedName])*)?
    '}'

ADRStatus returns string:
    'proposed' | 'accepted' | 'rejected' | 'deprecated' | 'superseded'

Alternative:
    name=ID ':' description=STRING
    ('pros' pros+=STRING (',' pros+=STRING)*)?
    ('cons' cons+=STRING (',' cons+=STRING)*)?
```

Example:
```dlang
bc OrderManagement {
    ADR 001: "Use Event Sourcing for Order Aggregate" {
        status accepted
        context: "Orders require full audit trail for compliance and customer support"
        decision: "Implement event sourcing for Order aggregate with event store"
        consequences: "Increased complexity, but full history and temporal queries"
        alternatives {
            CRUDWithAudit: "Traditional CRUD with separate audit log"
                pros: "Simpler implementation", "Well-understood pattern"
                cons: "Audit log can drift from actual state", "No temporal queries"
            
            ChangeDataCapture: "CDC from database transaction log"
                pros: "Automatic capture", "No app changes"
                cons: "Database-specific", "Limited to database changes"
        }
    }
}
```

**Benefits**: Embeds ADRs directly in domain model, ensuring decisions are traceable to context boundaries.

---

### 6. Type System & AST Design ✅

**Current Approach**:
- Langium type inference from grammar
- Interface-based metadata blocks
- Proper use of `type` for unions
- Clean separation of concerns

**Strengths**:
- ✅ No unnecessary type annotations
- ✅ Proper use of fragments for reuse
- ✅ Metadata interfaces enable type-safe block handling
- ✅ MultiReference used only where semantically correct

**Recommendations**:

**R6.1 - Consistent Interface Naming** [Low Priority]

Current metadata interfaces:
- `DescriptionBlock`, `VisionBlock` - noun-based
- `RelationshipsBlock`, `TerminologyBlock` - plural noun
- `ClassifierBlock`, `TeamBlock` - singular noun

Standardize to one pattern:
```langium
// Option A: All singular
interface DescriptionBlock { ... }
interface ClassifierBlock { ... }
interface RelationshipBlock { ... }  // Changed from RelationshipsBlock

// Option B: All based on content cardinality
interface DescriptionBlock { description: string }  // Singular property
interface RelationshipsBlock { relationships: Relationship[] }  // Plural property
```

**Current approach (Option B) is actually correct** - interface name matches property cardinality. No change needed, but document the convention.

**R6.2 - AST Augmentation Opportunities** [Medium Priority]

Current AST augmentation in `src/language/ast-augmentation.ts` is minimal. Consider adding computed properties:

```typescript
// Extend generated interfaces
declare module './generated/ast.js' {
    interface BoundedContext {
        // Computed: effective role considering inline and block assignments
        readonly effectiveRole: Reference<Classification> | undefined;
        
        // Computed: effective team
        readonly effectiveTeam: Reference<Team> | undefined;
        
        // Computed: all decisions across all decision blocks
        readonly allDecisions: AbstractDecision[];
        
        // Computed: fully qualified name
        readonly fqn: string;
    }
    
    interface Domain {
        // Computed: all child domains recursively
        readonly allSubdomains: Domain[];
        
        // Computed: all bounded contexts in this domain
        readonly boundedContexts: BoundedContext[];
    }
}
```

**Benefits**: Simplifies validation and service code by centralizing common computations.

---

### 7. Validation Architecture ✅

**Current State**:
- Clean validator structure with separate files per type
- Centralized message constants
- DDD-aware validations (e.g., cross-domain context groups)
- Warning-based guidance (not overly restrictive)

**Recommendations**:

**R7.1 - Validation Severity Levels** [High Priority]

Add configurable severity for guidelines:

```typescript
// In settings or manifest
{
    "domainlang.validation": {
        "requireBoundedContextDescription": "warning",  // or "error", "info", "off"
        "requireDomainVision": "warning",
        "warnCrossDomainGroups": "info",
        "requireBoundedContextDomain": "off"  // For incremental modeling
    }
}
```

**R7.2 - Additional DDD Anti-Pattern Checks** [Medium Priority]

```typescript
/**
 * Warn if a bounded context has too many responsibilities (Large Context anti-pattern)
 */
function validateBoundedContextComplexity(
    bc: BoundedContext,
    accept: ValidationAcceptor
): void {
    const aggregateCount = countAggregates(bc);  // If aggregates added
    const relationshipCount = countRelationships(bc);
    const termCount = countTerms(bc);
    
    if (aggregateCount > 7) {
        accept('info',
            `Bounded Context '${bc.name}' has ${aggregateCount} aggregates. ` +
            `Consider splitting into smaller contexts (DDD: "A bc should be as small as possible").`,
            { node: bc }
        );
    }
}

/**
 * Warn about potential Shared Kernel anti-pattern
 */
function validateSharedKernelUsage(
    rel: Relationship,
    accept: ValidationAcceptor
): void {
    if (rel.leftRoles.includes('SK') || rel.rightRoles.includes('SK')) {
        accept('info',
            `Shared Kernel detected. Remember: Shared Kernels require tight team coordination ` +
            `and should be avoided unless teams are co-located. Consider ACL or OHS instead.`,
            { node: rel }
        );
    }
}

/**
 * Detect potential Big Ball of Mud based on relationship patterns
 */
function validateContextIsolation(
    contextMap: ContextMap,
    accept: ValidationAcceptor
): void {
    // Build dependency graph
    const dependencies = new Map<string, Set<string>>();
    
    for (const rel of contextMap.relationships) {
        const leftName = getContextName(rel.left);
        const rightName = getContextName(rel.right);
        
        if (!dependencies.has(leftName)) dependencies.set(leftName, new Set());
        if (!dependencies.has(rightName)) dependencies.set(rightName, new Set());
        
        dependencies.get(leftName)!.add(rightName);
        dependencies.get(rightName)!.add(leftName);
    }
    
    // Check for highly connected contexts (potential BBoM)
    for (const [context, deps] of dependencies) {
        if (deps.size > 5) {
            accept('warning',
                `Context '${context}' has ${deps.size} relationships. ` +
                `High coupling may indicate unclear boundaries or Big Ball of Mud.`,
                { node: contextMap }
            );
        }
    }
}
```

**R7.3 - Strategic/Tactical Alignment Checks** [Low Priority - requires aggregates]

```typescript
function validateAggregateAlignment(
    bc: BoundedContext,
    accept: ValidationAcceptor
): void {
    // Core domains should have aggregates
    const isCore = bc.inlineRole?.ref?.name?.includes('Core') || 
                   bc.documentation?.some(b => isRoleBlock(b) && 
                       b.roleClassifier?.ref?.name?.includes('Core'));
    
    const aggregateCount = countAggregates(bc);
    
    if (isCore && aggregateCount === 0) {
        accept('info',
            `Core domain context '${bc.name}' has no aggregates. ` +
            `Core domains typically contain the most important business logic and aggregates.`,
            { node: bc }
        );
    }
}
```

---

### 8. Language Ergonomics ✅

**Current Strengths**:
- ✅ Multiple keyword aliases (`BC` vs `BoundedContext`, `contextmap` vs `ContextMap`)
- ✅ Multiple assignment operators (`:`, `=`, `is`)
- ✅ Optional commas in lists
- ✅ Case-insensitive keywords where appropriate
- ✅ Flexible ordering (no strict sections)

**Recommendations**:

**R8.1 - Consistency Guidelines** [Documentation]

Document when to use which alias:

```markdown
## Style Guide

### Keyword Choices

**Use in specifications/documentation**:
- `Domain`, `BoundedContext`, `ContextMap`
- Full keywords for clarity

**Use in day-to-day modeling**:
- `BC`, `contextmap`, `group`
- Concise aliases for speed

### Assignment Operators

**Recommended**:
- `:` for assignments in blocks (like JSON/YAML)
- `=` for inline assignments (like function parameters)
- `is` for natural language descriptions

Examples:
```dlang
// Block style: use colon
bc Sales for Domain1 {
    description: "Handles sales"
    role: CoreDomain
}

// Inline style: use 'as'/'by'
bc Sales for Domain1 as CoreDomain by Team1

// Natural language: use 'is'
term Order: "A customer purchase"
```

**R8.2 - Template Snippets** [Tooling]

Add VS Code snippets for common patterns:

```json
{
    "Bounded Context with full metadata": {
        "prefix": "bc-full",
        "body": [
            "BC ${1:name} for ${2:domain} as ${3:role} by ${4:team} {",
            "\tdescription: \"${5:description}\"",
            "\t",
            "\tterminology {",
            "\t\tterm ${6:Term}: \"${7:definition}\"",
            "\t}",
            "\t",
            "\tdecisions {",
            "\t\tdecision [${8|architectural,business,technical|}] ${9:name}: \"${10:description}\"",
            "\t}",
            "}"
        ]
    },
    
    "Context Map with relationships": {
        "prefix": "cmap",
        "body": [
            "ContextMap ${1:name} {",
            "\tcontains ${2:context1}, ${3:context2}",
            "\t",
            "\t[${4|OHS,ACL,PL,CF,SK,P|}] ${2:context1} -> [${5|OHS,ACL,PL,CF,SK,P|}] ${3:context2} : ${6|UpstreamDownstream,CustomerSupplier,Partnership,SharedKernel|}",
            "}"
        ]
    }
}
```

**R8.3 - Error Recovery** [Low Priority]

Improve parser error recovery for common mistakes:

```langium
// Current: Hard error on missing colon
bc Sales for Domain1 {
    description "Missing colon"  // Parser error, no recovery
}

// Improved: Recover and suggest fix
// Using Langium's error recovery mechanisms
```

This requires custom parser error recovery strategies.

---

### 9. Missing DDD Patterns

Beyond aggregates (covered in R3.1), other patterns to consider:

**R9.1 - Saga/Process Manager** [Medium Priority]
```langium
Process:
    ('process' | 'Process' | 'Saga') name=ID 
    ('in' context=[BoundedContext:QualifiedName])?
    '{'
        ('trigger' trigger=[DomainEvent:QualifiedName])?
        (steps+=ProcessStep)*
    '}'

ProcessStep:
    'step' name=ID '{'
        ('action' action=STRING)?
        ('on-success' onSuccess=[ProcessStep:QualifiedName])?
        ('on-failure' onFailure=[ProcessStep:QualifiedName])?
        ('compensation' compensation=STRING)?
    '}'
```

**R9.2 - Specification Pattern** [Low Priority]
```langium
Specification:
    ('specification' | 'Specification') name=ID
    ('for' entity=[Entity:QualifiedName])?
    '{'
        'rule' rule=STRING
        ('examples' examples+=STRING (',' examples+=STRING)*)?
    '}'
```

**R9.3 - Factory Pattern** [Low Priority]
```langium
Factory:
    ('factory' | 'Factory') name=ID
    ('creates' creates=[Entity:QualifiedName] | [Aggregate:QualifiedName])?
    '{'
        ('input' inputs+=PropertyDeclaration)*
        ('validation' validations+=STRING)*
    '}'
```

---

### 10. Code Generation Support

**Current State**: Basic JavaScript generation in `src/cli/generator.ts`.

**Recommendations**:

**R10.1 - Template Metadata** [High Priority]

Add metadata to guide code generation:

```langium
BoundedContext:
    // ... existing ...
    ('implementation' '{'
        ('language' implementationLanguage=STRING)?
        ('framework' framework=STRING)?
        ('repository' repository=STRING)?
        ('package' packageName=STRING)?
    '}')?
```

Example:
```dlang
bc OrderManagement for Sales {
    description: "..."
    
    implementation {
        language: "TypeScript"
        framework: "NestJS"
        repository: "https://github.com/acme/order-service"
        package: "@acme/order-management"
    }
}
```

**R10.2 - Technology Mapping** [Medium Priority]
```langium
TechnologyMapping:
    'technology' 'mapping' '{'
        ('database' database=STRING)?
        ('messagebus' messageBus=STRING)?
        ('apiGateway' apiGateway=STRING)?
        (customTech+=TechnologyEntry)*
    '}'

TechnologyEntry:
    key=ID ':' value=STRING
```

Example:
```dlang
bc OrderManagement {
    technology mapping {
        database: "PostgreSQL"
        messagebus: "RabbitMQ"
        apiGateway: "Kong"
        cache: "Redis"
    }
}
```

---

## Prioritized Recommendations

### Critical (Do First) 🔴

1. **R1.4** - Validate BC.domain requirement
2. **R2.1** - Pattern compatibility validation
3. **R4.4** - Circular import detection
4. **R7.1** - Configurable validation severity
5. **R1.3** - Document inline vs. block precedence

### High Value (Should Do) 🟡

6. **R3.1** - Add Aggregate support (biggest feature gap)
7. **R7.2** - DDD anti-pattern checks
8. **R2.2** - Directional arrow validation
9. **R10.1** - Implementation metadata for code gen
10. **R3.3** - Domain Events as first-class

### Nice to Have (Could Do) 🟢

11. **R1.1** - Explicit subdomain type field
12. **R5.3** - ADR integration
13. **R2.4** - Domain relationship modeling
14. **R4.1** - Export control
15. **R8.2** - Template snippets

### Future Exploration (Ideas) 💡

16. **R1.6** - Typed context groups
17. **R9.1-9.3** - Saga/Specification/Factory patterns
18. **R6.2** - AST augmentation with computed properties
19. **R3.2** - Full type system for properties
20. **R5.1** - Terminology cross-references

---

## Grammar Anti-Patterns to Avoid

Based on Langium best practices and DDD principles:

### ❌ Don't: Overload Keywords
```langium
// Bad: Same keyword for different concepts
Context: BoundedContext | ExecutionContext | SecurityContext
```

### ❌ Don't: Break DDD Semantics
```langium
// Bad: Allow bc to implement multiple domains
BoundedContext:
    'BC' name=ID ('implements' domains=[+Domain])?  // ❌ Violates bc principle
```
**(Already fixed in audit)**

### ❌ Don't: Allow Nonsensical Combinations
```langium
// Bad: No validation for contradictory patterns
[ACL, SK] A <-> B  // Anti-Corruption Layer + Shared Kernel = nonsense
```
**(Recommended in R2.1)**

### ❌ Don't: Mix Abstraction Levels
```langium
// Bad: Tactical details in strategic constructs
Domain Sales {
    database: "PostgreSQL"  // ❌ Implementation detail in domain
}
```

### ✅ Do: Separate Concerns
```langium
// Good: Strategic in Domain, tactical in BC, implementation in metadata
Domain Sales { ... }
bc OrderManagement for Sales { 
    technology mapping { database: "PostgreSQL" }
}
```

---

## Comparison with Other DSLs

### vs. ContextMapper DSL

| Feature | DomainLang | ContextMapper | Winner |
|---------|------------|---------------|--------|
| Git-native imports | ✅ | ❌ | **DomainLang** |
| IDE tooling | ✅ Langium LSP | ✅ Xtext | Tie |
| Aggregate modeling | ❌ (planned) | ✅ | ContextMapper |
| Relationship patterns | ✅ Complete | ✅ Complete | Tie |
| Module system | ✅ Advanced | ⚠️ Basic | **DomainLang** |
| Tactical DDD | ❌ | ✅ | ContextMapper |
| Learning curve | ✅ Gentler | ⚠️ Steeper | **DomainLang** |
| Code generation | ⚠️ Basic | ✅ Advanced | ContextMapper |

**Verdict**: DomainLang excels at strategic DDD and modern DevOps integration. ContextMapper leads in tactical DDD and code generation. **Adding aggregate support would make DomainLang competitive across all dimensions.**

### vs. PlantUML/C4

| Feature | DomainLang | PlantUML | Winner |
|---------|------------|----------|--------|
| DDD semantics | ✅ Native | ⚠️ Via comments | **DomainLang** |
| Validation | ✅ Semantic | ❌ Syntax only | **DomainLang** |
| Tooling | ✅ LSP | ⚠️ Preview only | **DomainLang** |
| Diagram output | ⚠️ Planned | ✅ Native | PlantUML |
| Learning curve | ✅ | ✅ | Tie |

**Verdict**: DomainLang is a proper modeling language; PlantUML is visualization-first. Different use cases, but DomainLang is better for **executable architecture**.

---

## Conclusion

### Summary

DomainLang has achieved **production readiness** for strategic DDD modeling with:
- ✅ Excellent DDD compliance
- ✅ Innovative git-native imports
- ✅ Clean, ergonomic syntax
- ✅ Solid validation foundation
- ✅ Comprehensive relationship modeling

### Primary Gap

**Tactical DDD support** is the biggest missing piece. Adding **Aggregate modeling** (R3.1) would:
- Complete the DDD coverage
- Enable end-to-end modeling (strategic → tactical → code)
- Differentiate from diagram-only tools
- Support event storming outcomes
- Bridge to implementation

### Recommended Roadmap

**Phase 1: Validation Hardening** (1-2 weeks)
- R1.3, R1.4: bc metadata validation
- R2.1, R2.2: Relationship pattern validation
- R4.4: Circular import detection
- R7.1: Configurable severity

**Phase 2: Tactical DDD** (4-6 weeks)
- R3.1: Aggregate, Entity, ValueObject support
- R3.3: Domain Events as first-class
- R3.2: Basic type system
- Validation rules for tactical patterns

**Phase 3: Enhanced Metadata** (2-3 weeks)
- R5.3: ADR integration
- R10.1: Implementation metadata
- R2.4: Domain relationships
- R6.2: AST augmentation

**Phase 4: Developer Experience** (1-2 weeks)
- R8.2: Template snippets
- Documentation updates
- Migration guides
- Example gallery

### Final Rating

**Current State**: ⭐⭐⭐⭐½ (4.5/5)
- Excellent for strategic DDD
- Missing tactical patterns

**With Aggregate Support**: ⭐⭐⭐⭐⭐ (5/5)
- Complete DDD coverage
- Best-in-class DSL for Domain-Driven Design

---

**Review Completed**: October 5, 2025  
**Reviewer**: GitHub Copilot (Langium & DDD Expert)  
**Recommendation**: **Approved for production use in strategic DDD modeling. Implement aggregate support to achieve complete DDD coverage.**
