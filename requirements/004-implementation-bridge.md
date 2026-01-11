# PRS-004: Implementation Bridge

Status: Planned
Priority: Medium
Target Version: 2.1.0
Parent: PRS-001
Created: January 11, 2026
Effort Estimate: 2 weeks
Dependencies: None

## Overview

This PRS adds implementation metadata and operational concerns to DomainLang models, bridging the gap between strategic/tactical design and actual deployed systems. These features enable infrastructure-as-code generation, DevOps integration, and architectural lifecycle management.

## Implementation Status Summary

| Requirement | Status | Notes |
|------------|--------|-------|
| FR-4.1: Implementation Metadata | ❌ Not Implemented | Technology stack mapping |
| FR-4.2: Lifecycle Markers | ❌ Not Implemented | Architectural evolution tracking |

**Overall Status**: NOT implemented. These features represent future enhancements for connecting models to deployed systems.

## User Stories

### US-1: DevOps Engineer
As a DevOps engineer,
I want to specify infrastructure requirements in DomainLang models,
So that I can generate deployment configurations automatically.

### US-2: Software Architect
As a software architect managing evolution,
I want to mark deprecated or experimental contexts,
So that teams understand which systems are stable.

## Functional Requirements

### ❌ FR-4.1: Implementation Metadata Block [NOT IMPLEMENTED]

**Status**: **NOT IMPLEMENTED** - No implementation metadata support exists.

**Current Gap**: 
Models describe what systems do, but not how they're implemented or where they're deployed.

**Requirement**:

Add implementation metadata block to BoundedContexts:

```langium
BoundedContextDocumentationBlock:
    // ... existing blocks ...
    | {ImplementationBlock} 'implementation' '{' 
        (('language' | 'lang') Assignment language=STRING)?
        ('framework' Assignment framework=STRING)?
        ('database' Assignment database=STRING)?
        (('messagebus' | 'messaging') Assignment messagebus=STRING)?
        ('repository' Assignment repository=STRING)?
        ('deployment' Assignment deployment=STRING)?
        (customProperties+=KeyValuePair)*
      '}'
;

KeyValuePair:
    key=ID ':' value=STRING
;
```

**Example Usage**:
```dlang
BC OrderManagement for Sales {
    description: "Manages customer orders"
    
    implementation {
        language: "TypeScript"
        framework: "NestJS"
        database: "PostgreSQL"
        messagebus: "RabbitMQ"
        repository: "github.com/company/order-service"
        deployment: "Kubernetes"
        
        // Custom properties
        apiVersion: "v2"
        healthCheckPath: "/health"
        metricsPath: "/metrics"
    }
}

BC LegacyOrders for Sales {
    description: "Legacy order system"
    
    implementation {
        language: "Java"
        framework: "Spring Boot"
        database: "Oracle"
        repository: "internal-gitlab/legacy/orders"
        deployment: "VM"
    }
}
```

**Code Generation Use Cases**:
- Generate Dockerfile with correct base image
- Generate docker-compose.yml with correct databases
- Generate k8s deployment manifests
- Generate CI/CD pipeline configurations
- Generate infrastructure-as-code (Terraform, Pulumi)

**Validation**:
- No validation initially (freeform text)
- Future: Validate against known technology catalog
- Future: Check compatibility (e.g., NestJS requires Node.js/TypeScript)

**Rationale**: 
- Connects abstract models to concrete implementations
- Enables infrastructure automation
- Documents technology decisions in model
- Supports polyglot architectures

### ❌ FR-4.2: Lifecycle Markers [NOT IMPLEMENTED]

**Status**: **NOT IMPLEMENTED** - No lifecycle tracking exists.

**Current Gap**: 
Models don't indicate which contexts are stable, deprecated, or experimental.

**Design Decision**: 
This feature will **use the existing `Classification` system** rather than introducing generic annotations. This preserves DomainLang's DDD-first philosophy where all concepts are explicit domain terms, not programming language metaphors.

**Rationale for Classifications over Annotations**:
- ✅ Maintains ubiquitous language principle - Classifications are named domain concepts
- ✅ Consistent with existing patterns - avoids "two ways to do the same thing"
- ✅ Better discoverability - Classifications are first-class, referenceable elements
- ✅ Type-safe - IDE knows valid values through cross-references
- ✅ LSP-friendly - Works with Langium's built-in cross-referencing
- ❌ Avoids programming language metaphors (`@annotation`) in domain modeling

**Requirement**:

Add dedicated `lifecycle` field to BoundedContext for lifecycle state tracking:

```langium
BoundedContext:
    ('BoundedContext' | 'bc') name=ID 
    ('for' domain=[Domain:QualifiedName])?
    (
        ('as' role=[Classification:QualifiedName])?
        ('by' team=[Team:QualifiedName])?
        ('lifecycle' lifecycle=[Classification:QualifiedName])?  // NEW
    )?
    ('{' documentation+=BoundedContextDocumentationBlock* '}')?
;
```

**Standard Lifecycle Classifications**:

These can be defined locally in each project, or imported from a shared standard library:

```dlang
// Option 1: Define locally
Classification Deprecated
Classification Experimental
Classification Stable
Classification Internal
Classification Beta

// Option 2: Import from standard library (recommended)
import "domainlang/stdlib@v1.0.0" as Std

// Use: Std.Deprecated, Std.Experimental, etc.
```

**Future: DomainLang Standard Library (BCL-equivalent)**:
- `domainlang/stdlib` - Core classifications and common patterns
- `domainlang/ddd-patterns` - DDD strategic/tactical patterns
- `domainlang/examples` - Example models and templates
- Community packages via git imports (already supported)

This leverages DomainLang's existing git-native import system, making standard definitions available without adding language keywords.

**See**: [PRS-006: Standard Library](./006-standard-library.md) for full stdlib implementation details, including LSP recognition and semantic validation of standard types.

**Example Usage**:

```dlang
// Define lifecycle classifications once
Classification Deprecated
Classification Experimental
Classification Stable
Classification Internal
Classification Beta

// Or import from standard library
import "domainlang/stdlib@v1.0.0" as Std

// Use inline lifecycle assignment
BC LegacyOrders for Sales
    lifecycle Deprecated
    by SalesTeam {
    description: "Legacy order management system"
}

BC AIRecommendations for Marketing
    lifecycle Experimental {
    description: "AI-powered product recommendations"
}

BC Checkout for Sales
    lifecycle Stable {
    description: "Checkout and payment processing"
}

BC AdminTools for Operations
    lifecycle Internal {
    description: "Internal administration tools"
}

BC MobileAPI for Sales
    lifecycle Beta {
    description: "Mobile-optimized API endpoints"
}

// Using imported standard library
BC PaymentGateway for Sales
    lifecycle Std.Stable {
    description: "Third-party payment processing"
}
```

**Validation**:
- Warning: Context with `lifecycle: Deprecated` referenced by stable context
- Info: Context with `lifecycle: Experimental` has relationships
- Error: Context with `lifecycle: Internal` referenced by external system (future)
- Suggest: If BC has no lifecycle, suggest adding one

**Note**: Enhanced validation with stdlib type recognition is covered in [PRS-006: Standard Library](./006-standard-library.md).

**IDE Features**:
- Strikethrough text for contexts with `lifecycle: Deprecated`
- Warning icon for `lifecycle: Experimental`
- Lock icon for `lifecycle: Internal`
- Beta badge for `lifecycle: Beta`
- Hover shows lifecycle Classification with its description
- Completion suggests standard lifecycle Classifications

**Code Generation Use Cases**:
- Generate architectural decision records
- Generate migration documentation
- Filter contexts by lifecycle stage
- Generate dependency graphs with lifecycle colors

**Rationale**: 
- Documents architectural evolution
- Supports migration planning
- Improves team communication
- Prevents accidental usage of deprecated systems

**Alternative Approaches Considered**:

*Generic Annotation System* (Rejected):
```dlang
@deprecated("reason")
@experimental
BC OrderManagement { ... }
```

**Why Rejected**:
- Breaks DDD ubiquitous language principle - `@annotation` is programming metaphor
- Creates two ways to do same thing (Classifications already exist)
- Less discoverable - annotations are "magic strings" vs. first-class Classifications
- Weaker type safety - no cross-reference validation
- Harder to query - can't ask "show all Deprecated contexts"
- Poor fit for LSP - would need custom validation, hover, completion

*Inline Classification Assignment* (Current Approach):
```dlang
BC OrderManagement lifecycle Deprecated { ... }
```

**Why Chosen**:
- Leverages existing `Classification` construct (zero new syntax)
- Type-safe cross-references with IDE support
- First-class domain concepts, not metadata
- Consistent with `as role` and `by team` patterns
- Easy to query and validate
- Future: Can add metadata to Classifications themselves

## Non-Functional Requirements

### Performance
- Implementation metadata parsing adds <5ms overhead
- API endpoint parsing handles 100+ endpoints efficiently
- No impact on IDE responsiveness

### Usability
- Metadata blocks are optional
- Natural language format for SLOs
- Autocomplete suggests common technologies
- Annotations use familiar @ syntax

### Compatibility
- Backward compatible with existing models
- Implementation blocks are purely additive
- Models without metadata remain valid

### Maintainability
- Separate validators for each metadata type
- Clear separation from strategic/tactical concerns
- Extensible for future metadata types

## Design Considerations

### Architectural Implications

**Grammar Evolution**:
- Add new documentation blocks to BoundedContext
- Add inline `lifecycle` keyword (parallel to `as` and `by`)
- Keep lifecycle optional to avoid breaking changes
- Leverage existing Classification cross-reference infrastructure

**Validation Strategy**:
- No strict validation initially (freeform)
- Future: Catalogs of known technologies
- Future: Compatibility checking

**Lifecycle Classification Strategy**:
- Standard lifecycle names are conventions, not enforced
- Users can define custom lifecycle Classifications
- Future: Classification metadata (type, severity, description)
- Future: Validation recognizes common lifecycle patterns

**Code Generation Impact**:
- Metadata directly supports infrastructure generation
- Clear mapping to deployment artifacts
- Technology-agnostic design

### Related ADRs

**Proposed**:
- ADR-006: Implementation Metadata Design (to be created)
- ADR-007: Code Generation Architecture (to be created)
- ADR-008: Standard Library Architecture (see PRS-006)

**References**:
- [ADR-002: Architectural Review 2025](../adr/002-architectural-review-2025.md)
- [PRS-006: Standard Library](./006-standard-library.md)

## Acceptance Testing

### TS-4.1: Implementation Metadata Parsing
**Given** a BoundedContext with implementation block
**When** file is parsed
**Then** AST contains implementation metadata
**And** hover shows technology stack
**And** code generator can access metadata

### TS-4.2: Deprecated Context Warning
**Given** a stable context referencing a deprecated context
**When** file is validated
**Then** warning appears about deprecated dependency
**And** migration message from @deprecated is shown

### TS-4.3: Lifecycle Visualization
**Given** a model with various lifecycle annotations
**When** rendered in diagram
**Then** deprecated contexts are shown as strikethrough
**And** experimental contexts have warning badges
**And** stable contexts appear normal

## Dependencies

**Requires**:
- Langium 4.x (existing)
- TypeScript 5.8+ (existing)

**Blocks**:
- Infrastructure code generation
- Deployment automation

**Related**:
- PRS-006: Standard Library (lifecycle Classifications from stdlib)
- Code generation framework design
- DevOps tooling integration

## Implementation Phases

### Phase 1: Implementation Metadata (1 week)
- [ ] Add implementation block to grammar
- [ ] Update AST generation
- [ ] Add parsing tests
- [ ] Add hover provider support
- [ ] Create examples

### Phase 2: Lifecycle Markers (1 week)

- [ ] Add inline `lifecycle` keyword to grammar
- [ ] Implement lifecycle Classification references
- [ ] Add validation for deprecated references
- [ ] Add IDE visual indicators (strikethrough, icons)
- [ ] Update diagrams to show lifecycle

**Total Effort**: 2 weeks

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Implementation metadata support | 0% | 100% |
| Lifecycle markers | 0% | 5 standard annotations |
| Infrastructure generation | 0% | Basic Docker/K8s |

## Open Questions

### Q1: Technology Validation
**Question**: Should we validate technology names against a catalog?
**Options**:
- A) No validation (freeform text)
- B) Warn on unknown technologies
- C) Error on unknown technologies

**Recommendation**: Option A initially, Option B in future with extensible catalog.

## References

- [Original PRS-001](./001-language-design-improvements.md)
- [PRS-006: Standard Library](./006-standard-library.md)

---

**Document Version:** 1.0  
**Last Updated:** January 11, 2026  
**Status:** Planned  
**Next Review:** After PRS-003 completion
