# PRS-003: Tactical DDD Pattern Support

Status: Planned
Priority: High
Target Version: 2.0.0
Parent: PRS-001
Created: January 11, 2026
Effort Estimate: 6-8 weeks

## Overview

This PRS adds support for tactical Domain-Driven Design patterns to DomainLang, bridging the gap between strategic modeling (Domains, Bounded Contexts) and implementation (code generation). This enables complete DDD lifecycle support from Event Storming workshops to deployable code.

## Implementation Status Summary

| Requirement | Status | Notes |
|------------|--------|-------|
| FR-3.1: Aggregate Support | ❌ Not Implemented | Core tactical pattern |
| FR-3.2: Basic Type System | ❌ Not Implemented | Needed for properties |
| FR-3.3: Aggregate Boundary Validation | ❌ Not Implemented | Depends on FR-3.1 |

**Overall Status**: This entire feature set is NOT implemented. The current grammar focuses solely on strategic DDD patterns.

## User Stories

### US-1: Tactical DDD Practitioner
As a software architect implementing DDD,
I want to model Aggregates, Entities, and DomainEvents in DomainLang,
So that I can bridge strategic models to code implementation.

### US-2: Event Storming Facilitator
As a domain architect running Event Storming workshops,
I want to capture Commands, Events, and Aggregates directly in DomainLang,
So that workshop outcomes flow seamlessly into implementation.

### US-3: Code Generator User
As a developer building services,
I want my tactical DDD models to generate domain layer code,
So that I can focus on business logic instead of boilerplate.

## Functional Requirements

### ❌ FR-3.1: Aggregate Support [NOT IMPLEMENTED]

**Status**: **NOT IMPLEMENTED** - No tactical patterns exist in current grammar.

**Current Gap**: 
The grammar in `domain-lang.langium` contains no support for:
- Aggregates
- Entities
- ValueObjects
- DomainEvents
- Commands
- Invariants

**Requirement**:

Add grammar support for tactical DDD patterns:

```langium
/**
 * Aggregate - Consistency boundary with a root entity.
 * Central pattern in tactical DDD for defining transactional boundaries.
 */
Aggregate:
    'Aggregate' name=ID ('in' context=[BoundedContext:QualifiedName])?
    '{'
        ('root' ':' rootEntity=[Entity:QualifiedName])?
        (entities+=Entity)*
        (valueObjects+=ValueObject)*
        (events+=DomainEvent)*
        (commands+=Command)*
        (invariants+=Invariant)*
    '}'
;

/**
 * Entity - Object with identity that persists over time.
 */
Entity:
    'Entity' name=ID
    ('{'
        (properties+=Property)*
        ('behavior' '{' (methods+=Method)* '}')?
    '}')?
;

/**
 * ValueObject - Immutable object without identity.
 */
ValueObject:
    'ValueObject' name=ID
    '{'
        (properties+=Property)*
    '}'
;

/**
 * DomainEvent - Something that happened in the domain worth tracking.
 */
DomainEvent:
    'Event' name=ID
    ('{'
        ('trigger' ':' trigger=STRING)?
        (properties+=Property)*
        ('timestamp' ':' timestampProperty=[Property:ID])?
    '}')?
;

/**
 * Command - Intent to change aggregate state.
 */
Command:
    'Command' name=ID
    ('{'
        (properties+=Property)*
        ('target' ':' targetAggregate=[Aggregate:QualifiedName])?
    '}')?
;

/**
 * Invariant - Business rule that must always hold.
 */
Invariant:
    'Invariant' name=ID
    '{'
        ('rule' ':' rule=STRING)
        ('error' ':' errorMessage=STRING)?
    '}'
;

/**
 * Property - Typed field in Entity or ValueObject.
 */
Property:
    name=ID ':' type=TypeReference ('?')? // optional
;

/**
 * Method - Behavior on Entity.
 */
Method:
    name=ID '(' (params+=Parameter (',' params+=Parameter)*)? ')' 
    (':' returnType=TypeReference)?
;

Parameter:
    name=ID ':' type=TypeReference
;
```

**Example Usage**:
```dlang
BC OrderManagement for Sales {
    description: "Manages customer orders from placement to fulfillment"
    
    Aggregate Order {
        root: OrderEntity
        
        Entity OrderEntity {
            orderId: OrderId
            customerId: CustomerId
            items: OrderItem[]
            status: OrderStatus
            totalAmount: Money
            
            behavior {
                placeOrder(items: OrderItem[]): void
                cancelOrder(): void
                addItem(item: OrderItem): void
            }
        }
        
        ValueObject OrderItem {
            productId: ProductId
            quantity: number
            unitPrice: Money
            subtotal: Money
        }
        
        ValueObject Money {
            amount: number
            currency: string
        }
        
        Event OrderPlaced {
            trigger: "Customer completes checkout"
            orderId: OrderId
            customerId: CustomerId
            items: OrderItem[]
            totalAmount: Money
            timestamp: placedAt
        }
        
        Event OrderCancelled {
            trigger: "Customer or system cancels order"
            orderId: OrderId
            reason: string
            timestamp: cancelledAt
        }
        
        Command PlaceOrder {
            target: Order
            customerId: CustomerId
            items: OrderItem[]
        }
        
        Command CancelOrder {
            target: Order
            orderId: OrderId
            reason: string
        }
        
        Invariant MinimumOrderValue {
            rule: "Total order value must exceed $10"
            error: "Order total must be at least $10.00"
        }
        
        Invariant PositiveQuantity {
            rule: "All order item quantities must be positive"
            error: "Item quantity must be greater than zero"
        }
    }
}
```

**AST Structure Implications**:

New AST types will be generated:
- `Aggregate extends AstNode`
- `Entity extends AstNode`
- `ValueObject extends AstNode`
- `DomainEvent extends AstNode`
- `Command extends AstNode`
- `Invariant extends AstNode`
- `Property extends AstNode`
- `Method extends AstNode`

**Integration Points**:
- Aggregates should be containable within BoundedContexts
- Entities/ValueObjects should be referenceable across Aggregates
- Events should be referenceable in Relationships (publishes/subscribes)

**Rationale**: 
- Completes DDD coverage (strategic + tactical)
- Enables code generation for domain models
- Supports Event Storming outcomes
- Achieves feature parity with ContextMapper DSL

### ❌ FR-3.2: Basic Type System [NOT IMPLEMENTED]

**Status**: **NOT IMPLEMENTED** - No type system exists.

**Current Gap**: 
Properties in tactical patterns need type definitions. The grammar has no type system.

**Requirement**:

Add type references for properties:

```langium
/**
 * Type reference for properties.
 */
TypeReference:
    primitiveType=PrimitiveType |
    customType=[Type:QualifiedName] |
    arrayType=ArrayType
;

PrimitiveType returns string:
    'string' | 'number' | 'boolean' | 
    'Date' | 'DateTime' | 'Money' | 
    'UUID' | 'Email' | 'URL'
;

ArrayType:
    elementType=TypeReference '[]'
;
```

**Primitive Types**:
- `string` - Text values
- `number` - Numeric values (integer or decimal)
- `boolean` - True/false values
- `Date` - Date without time
- `DateTime` - Date with time
- `Money` - Monetary amount (requires currency)
- `UUID` - Universally unique identifier
- `Email` - Email address
- `URL` - Web address

**Custom Types**:
- References to defined ValueObjects
- References to defined Entities
- References to defined Enums (future)

**Array Types**:
- Any type followed by `[]`
- Example: `OrderItem[]`, `string[]`, `number[]`

**Optional Types**:
- Any type followed by `?`
- Example: `notes: string?`, `discount: Money?`

**Example**:
```dlang
ValueObject Address {
    street: string
    city: string
    postalCode: string
    country: string
}

Entity Customer {
    customerId: UUID
    email: Email
    name: string
    billingAddress: Address
    shippingAddress: Address?  // Optional
    orders: OrderId[]          // Array
    registeredAt: DateTime
    loyaltyPoints: number
}
```

**Validation Requirements**:
- Warn on undefined custom types
- Error on circular type references
- Info hint for missing type annotations
- Suggest primitive types in completion

**Rationale**: 
- Enables type checking in models
- Supports code generation with correct types
- Provides IDE support (completion, validation)
- Follows TypeScript/Java type syntax conventions

### ❌ FR-3.3: Aggregate Boundary Validation [NOT IMPLEMENTED]

**Status**: **NOT IMPLEMENTED** - Depends on FR-3.1.

**Requirement**:

Add DDD-aware validations for Aggregates:

1. **Minimum Aggregate Contents**
   - Error: Aggregate must contain at least one Entity
   - Error: Root entity must be specified or inferred

2. **Aggregate Size Code Smell**
   - Warning: Aggregate contains >7 entities (code smell)
   - Info: Consider splitting into smaller aggregates

3. **Root Entity Validation**
   - Error: Specified root entity does not exist in aggregate
   - Error: Root entity reference ambiguous (multiple matches)

4. **Circular Dependency Detection**
   - Error: Aggregate A references Aggregate B which references A
   - Info: Aggregates should be independent consistency boundaries

5. **Event Consistency**
   - Warning: Event references properties not in aggregate
   - Info: Events should use aggregate's value objects

**Example Validations**:

```dlang
// ERROR: No entities
Aggregate EmptyAggregate {
    // Error: Aggregate must contain at least one Entity
}

// ERROR: Root doesn't exist
Aggregate Order {
    root: NonExistentEntity
    Entity OrderEntity { }
}

// WARNING: Too large
Aggregate HugeAggregate {
    Entity E1 { }
    Entity E2 { }
    Entity E3 { }
    Entity E4 { }
    Entity E5 { }
    Entity E6 { }
    Entity E7 { }
    Entity E8 { }  // Warning: Aggregate has 8 entities (>7 is a code smell)
}

// WARNING: Event uses external type
Aggregate Order {
    Entity OrderEntity {
        orderId: UUID
    }
    Event OrderPlaced {
        customerEmail: ExternalType  // Warning: Event references type outside aggregate
    }
}
```

**Validation Location**: 
- New file: `packages/language/src/validation/aggregate.ts`
- Registration: `domain-lang-validator.ts`

**Test Coverage**:
- Minimum 20 test cases covering all validation scenarios
- Positive and negative test cases
- Edge cases (empty aggregates, single entity, etc.)

**Rationale**: 
- Enforces DDD best practices
- Catches design anti-patterns early
- Educates users on tactical DDD principles
- Prevents common mistakes in aggregate design

## Non-Functional Requirements

### Performance
- Parsing aggregates adds <10ms overhead per 100 entities
- Validation completes in <100ms for files with 50 aggregates
- No degradation in IDE responsiveness

### Usability
- Autocomplete suggests tactical keywords
- Hover tooltips explain tactical patterns
- Error messages reference DDD principles
- Examples demonstrate all tactical patterns

### Compatibility
- Backward compatible with existing strategic models
- Tactical patterns are optional
- No breaking changes to existing grammar

### Scalability
- Supports 1000+ entities across all aggregates
- Handles deep nesting (aggregates in contexts in namespaces)
- Efficient cross-reference resolution for types

## Design Considerations

### Architectural Implications

**Grammar Evolution**:
- Add new top-level constructs (Aggregate, Entity, etc.)
- Maintain backward compatibility
- Use interface composition for shared properties

**Type System Design**:
- Start simple: primitives + references
- Future: generics, constraints, computed types
- Avoid Turing-complete type system

**Validation Strategy**:
- Separate validator for aggregates
- Progressive validation levels (error → warning → info)
- Cache validation results for performance

**Code Generation Impact**:
- AST structure must support multiple target languages
- Metadata preservation for generators
- Clear separation of model vs. implementation concerns

### Related ADRs

**Required**:
- ADR-003: Tactical DDD Pattern Design (to be created)
- ADR-004: Type System Design (to be created)

**References**:
- [ADR-002: Architectural Review 2025](../adr/002-architectural-review-2025.md)

## Acceptance Testing

### TS-3.1: Aggregate Parsing
**Given** a valid Aggregate definition with Entity and ValueObject
**When** file is parsed
**Then** AST contains correct structure
**And** types are resolved correctly
**And** hover shows aggregate documentation

### TS-3.2: Type System Validation
**Given** an Entity with property `customerId: UUID`
**When** file is validated
**Then** type reference resolves to UUID primitive
**And** completion suggests valid types
**And** no errors reported

### TS-3.3: Aggregate Size Warning
**Given** an Aggregate with 8 entities
**When** file is validated
**Then** warning appears suggesting to split aggregate
**And** warning includes DDD best practices explanation

### TS-3.4: Root Entity Validation
**Given** an Aggregate with non-existent root entity
**When** file is validated
**Then** error is reported
**And** quick fix suggests existing entities
**And** file cannot proceed without fixing

### TS-3.5: Circular Dependency Detection
**Given** two Aggregates referencing each other
**When** file is validated
**Then** error is reported on both aggregates
**And** explanation suggests refactoring

## Dependencies

**Requires**:
- PRS-002: Language Consistency (recommended but not blocking)
- Langium 4.x (existing)
- TypeScript 5.8+ (existing)
- Vitest (existing)

**Blocks**:
- Code generation framework (requires tactical patterns)
- Schema generation (requires type system)
- Event Storming integration tools

**Related**:
- DDD-COMPLIANCE-AUDIT.md (tactical patterns missing)
- GRAMMAR-REVIEW-2025.md (recommendations for tactical support)

## Implementation Phases

### Phase 1: Core Grammar (2 weeks)
- [ ] Design AST structure for tactical patterns
- [ ] Implement Aggregate, Entity, ValueObject grammar
- [ ] Implement basic type system (primitives + references)
- [ ] Generate AST types with Langium
- [ ] Add parsing tests (80%+ coverage)

### Phase 2: Events & Commands (2 weeks)
- [ ] Implement DomainEvent grammar
- [ ] Implement Command grammar
- [ ] Implement Invariant grammar
- [ ] Add method/behavior support to entities
- [ ] Add parsing tests for all constructs

### Phase 3: Validation (2 weeks)
- [ ] Implement aggregate boundary validation
- [ ] Implement type resolution validation
- [ ] Implement circular dependency detection
- [ ] Add comprehensive validation tests
- [ ] Update error messages with DDD guidance

### Phase 4: IDE Support (2 weeks)
- [ ] Add hover providers for tactical patterns
- [ ] Add completion providers for types
- [ ] Add code actions (quick fixes)
- [ ] Update language guide with tactical patterns
- [ ] Create comprehensive examples

**Total Effort**: 8 weeks

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Tactical pattern support | 0% | 100% |
| Type system coverage | 0% | Primitives + custom |
| Validation rules | 0 | 10+ |
| Example completeness | Strategic only | Strategic + Tactical |
| Feature parity with ContextMapper | 60% | 95% |
| User satisfaction | N/A | 8/10 |

## Open Questions

### Q1: Aggregate Placement
**Question**: Should Aggregates be top-level constructs or nested within BoundedContexts?
**Options**:
- A) Top-level only (flexible but less structured)
- B) Nested only (structured but verbose)
- C) Both (maximum flexibility)

**Recommendation**: Option C - Support both for flexibility. Most common pattern is nested.

### Q2: Behavior Modeling Depth
**Question**: How detailed should method signatures be?
**Options**:
- A) Name only: `placeOrder`
- B) Signature only: `placeOrder(items: OrderItem[]): void`
- C) Full implementation: Include method bodies

**Recommendation**: Option B - Signatures provide contract without implementation details.

### Q3: Type System Extensibility
**Question**: Should users be able to define custom primitive types?
**Options**:
- A) Fixed primitive set only
- B) Allow type aliases: `type OrderId = UUID`
- C) Full type system with generics

**Recommendation**: Option B for initial version, Option C for future enhancement.

## References

- [Original PRS-001](./001-language-design-improvements.md)
- [PRS-002: Language Consistency](./002-language-consistency.md)
- [ContextMapper Tactical DDD](https://contextmapper.org/docs/tactic-ddd/)
- [DDD Reference by Eric Evans](https://www.domainlanguage.com/ddd/reference/)
- [Implementing DDD by Vaughn Vernon](https://vaughnvernon.com/)

---

**Document Version:** 1.0  
**Last Updated:** January 11, 2026  
**Status:** Planned  
**Next Review:** Before Phase 1 kickoff
