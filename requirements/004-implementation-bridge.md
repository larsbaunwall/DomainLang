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
| FR-4.1: Implementation Metadata | ✅ COMPLETED | Grammar, validation, tests (12), docs, examples |
| FR-4.2: Lifecycle Markers | ⏭️ Won't Implement | Current Classification system is sufficient |

**Overall Status**: FR-4.1 COMPLETED (Version 2.1.0).

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

### ✅ FR-4.1: Metadata Block with Defined Keys [COMPLETED]

**Status**: **COMPLETED** (January 11, 2025) - Full implementation with grammar, validation, tests, and documentation.

**Implementation Summary**:

| Component | Status | Details |
| --------- | ------ | ------- |
| Grammar | ✅ Complete | `Metadata` element, MetadataBlock, MetadataEntry rules added |
| Validation | ✅ Complete | Duplicate key detection, empty block warnings |
| Tests | ✅ Complete | 12 test cases covering parsing, validation, edge cases |
| Documentation | ✅ Complete | language.md, quick-reference.md |
| Examples | ✅ Complete | metadata-local-definition.dlang, metadata-polyglot.dlang |

**Current Capability**:
- **Defined locally** in your model
- **Imported from stdlib** (PRS-006) for standardization
- **Type-safe** with full IDE support

**Requirement**:

Add `Metadata` element definition and metadata block to BoundedContexts:

```langium
// Top-level element (alongside Domain, Team, Classification)
Metadata:
    /** A Metadata defines a key that can be used in metadata blocks. 
        Examples: Language, Framework, Database, Repository.
        Can be defined locally or imported from stdlib. */
    'Metadata' name=ID
;

// Documentation block for metadata
BoundedContextDocumentationBlock:
    // ... existing blocks ...
    | {MetadataBlock} ('metadata' | 'meta') '{'
        (entries+=MetadataEntry)*
      '}'
;

MetadataEntry:
    key=[Metadata:QualifiedName] ':' value=STRING
;
```

**Example Usage - Local Definition**:

```dlang
// Define metadata keys once (can be in separate file and imported)
Metadata Language
Metadata Framework
Metadata Database
Metadata MessageBus
Metadata Repository
Metadata Deployment
Metadata ApiVersion
Metadata HealthCheckPath

bc OrderManagement for Sales {
    description: "Manages customer orders"
    
    meta {
        Language: "TypeScript"
        Framework: "NestJS"
        Database: "PostgreSQL"
        MessageBus: "RabbitMQ"
        Repository: "github.com/company/order-service"
        Deployment: "Kubernetes"
        ApiVersion: "v2"
        HealthCheckPath: "/health"
    }
}

bc LegacyOrders for Sales {
    description: "Legacy order system"
    
    meta {
        Language: "Java"
        Framework: "Spring Boot"
        Database: "Oracle"
        Repository: "internal-gitlab/legacy/orders"
        Deployment: "VM"
    }
}
```

**Example Usage - From Standard Library**:

```dlang
import "domainlang/stdlib@v1.0.0" as Std

// Stdlib provides standard metadata keys - no local definition needed
bc PaymentGateway for Sales {
    description: "Third-party payment processing"
    
    meta {
        Std.Language: "Java"
        Std.Framework: "Spring Boot"
        Std.Database: "PostgreSQL"
        Std.Deployment: "Kubernetes"
    }
}
```

**Example Usage - Hybrid (Standard + Custom)**:

```dlang
import "domainlang/stdlib@v1.0.0" as Std

Metadata CustomMetricPath
Metadata CustomAlertGroup

bc Analytics for Business {
    description: "Analytics and reporting"
    
    meta {
        // From stdlib
        Std.Language: "Python"
        Std.Framework: "FastAPI"
        Std.Database: "Snowflake"
        Std.Deployment: "Kubernetes"
        
        // Custom metadata
        CustomMetricPath: "/analytics/metrics"
        CustomAlertGroup: "analytics-team@company.com"
    }
}
```

**IDE Features (Enabled by Design)**:

- ✅ Autocomplete for metadata keys (with cross-reference suggestions)
- ✅ Error on undefined or misspelled keys
- ✅ Hover shows metadata key definition and documentation
- ✅ Suggestions for stdlib metadata keys when imported
- ✅ Can query: "Find all contexts using Language=TypeScript"
- ✅ Can validate: "Deprecated contexts shouldn't use Production metadata"

**Code Generation Use Cases**:

- Generate Dockerfile with correct base image
- Generate docker-compose.yml with correct databases
- Generate k8s deployment manifests
- Generate CI/CD pipeline configurations
- Generate infrastructure-as-code (Terraform, Pulumi)
- Query contexts by metadata (e.g., all PostgreSQL databases)

**Validation**:

- Error: Reference to undefined Metadata key
- Warning: Unused Metadata definitions
- Future: Type hints for metadata values (e.g., Version, URL, Technology)
- Future: Compatibility checking (e.g., warn if NestJS used without Node.js)

**Rationale**:

- **Consistency**: Metadata keys become first-class like `Classification`, `Team`, `Domain`
- **Type-safe**: IDE catches typos and provides strong error messages
- **Standardization**: PRS-006 stdlib can define standard metadata keys
- **Documentation**: Keys can be defined with JSDoc comments
- **Queryable**: Tools can discover and validate metadata usage
- **Scalability**: Works from single-file models to large ecosystems
- **Infrastructure Automation**: Direct support for code generation
- **Supports polyglot architectures**: No predefined key set

### ⏭️ FR-4.2: Lifecycle Markers [WON'T IMPLEMENT]

**Status**: **Won't Implement** - The existing `Classification` system is sufficient.

**Rationale**:

The current `Classification` system already provides a robust, type-safe mechanism for marking lifecycle states. Users can define and assign Classifications to BoundedContexts to indicate stability, deprecation, or experimental status:

```dlang
Classification Deprecated
Classification Experimental
Classification Stable

bc LegacyOrders for Sales as Deprecated {
    description: "Legacy order system"
}

bc NewFeature for Sales as Experimental {
    description: "Experimental feature"
}
```

**Why This Is Sufficient**:

- ✅ **Already implemented** - No new language features needed
- ✅ **Type-safe** - IDE provides autocomplete and validation
- ✅ **First-class domain concepts** - Maintains DDD ubiquitous language
- ✅ **Flexible** - Users define custom lifecycle Classifications as needed
- ✅ **Queryable** - Tools can find all contexts with a given Classification
- ✅ **Works with existing LSP features** - Hover, completion, cross-references

**Alternative**: For standardized lifecycle names across teams, import from standard library (PRS-006):

```dlang
import "domainlang/stdlib@v1.0.0" as Std

bc PaymentGateway for Sales as Std.Stable {
    description: "Core payment processing"
}
```

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

**Total Effort**: 1 week

## Success Metrics

| Metric | Current | Target |
| --- | --- | --- |
| Implementation metadata support | 0% | 100% |

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
