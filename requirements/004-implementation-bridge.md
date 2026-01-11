# PRS-004: Implementation Bridge

Status: Planned
Priority: Medium
Target Version: 2.1.0
Parent: PRS-001
Created: January 11, 2026
Effort Estimate: 3-4 weeks
Dependencies: PRS-003 (Tactical DDD Patterns)

## Overview

This PRS adds implementation metadata and operational concerns to DomainLang models, bridging the gap between strategic/tactical design and actual deployed systems. These features enable infrastructure-as-code generation, DevOps integration, and architectural lifecycle management.

## Implementation Status Summary

| Requirement | Status | Notes |
|------------|--------|-------|
| FR-4.1: Implementation Metadata | ❌ Not Implemented | Technology stack mapping |
| FR-4.2: API Specification Support | ❌ Not Implemented | Contract definitions |
| FR-4.3: Service Level Objectives | ❌ Not Implemented | Operational requirements |
| FR-4.4: Lifecycle Markers | ❌ Not Implemented | Architectural evolution tracking |

**Overall Status**: NOT implemented. These features represent future enhancements for connecting models to deployed systems.

## User Stories

### US-1: DevOps Engineer
As a DevOps engineer,
I want to specify infrastructure requirements in DomainLang models,
So that I can generate deployment configurations automatically.

### US-2: API Designer
As an API designer,
I want to document API contracts within Bounded Contexts,
So that integration teams understand available endpoints.

### US-3: Site Reliability Engineer
As an SRE,
I want to define SLOs for each Bounded Context,
So that monitoring and alerting can be configured automatically.

### US-4: Software Architect
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

### ❌ FR-4.2: API Specification Support [NOT IMPLEMENTED]

**Status**: **NOT IMPLEMENTED** - No API contract definitions exist.

**Current Gap**: 
Relationships show connections but not the interfaces/contracts.

**Requirement**:

Add API contract definitions to BoundedContexts:

```langium
BoundedContextDocumentationBlock:
    // ... existing blocks ...
    | {APIBlock} ('API' | 'api') name=ID '{' 
        ('protocol' Assignment protocol=APIProtocol)?
        ('version' Assignment version=STRING)?
        (endpoints+=APIEndpoint)*
        (events+=PublishedEvent)*
      '}'
;

APIProtocol returns string:
    'REST' | 'GraphQL' | 'gRPC' | 'SOAP'
;

APIEndpoint:
    method=HTTPMethod path=STRING 
    ('returns' returnType=ID)?
    ('requires' authType=ID)?
;

HTTPMethod returns string:
    'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
;

PublishedEvent:
    'publishes' eventType=[DomainEvent:QualifiedName] 
    'to' topic=STRING
;
```

**Example Usage**:
```dlang
BC OrderManagement for Sales {
    description: "Manages customer orders"
    
    API OrderAPI {
        protocol: REST
        version: "v1"
        
        POST /orders returns OrderId
        GET /orders/:id returns Order
        GET /orders returns OrderList
        PUT /orders/:id returns Order
        DELETE /orders/:id
        
        publishes OrderPlaced to "orders.placed"
        publishes OrderCancelled to "orders.cancelled"
        publishes OrderShipped to "orders.shipped"
    }
    
    API OrderQuery {
        protocol: GraphQL
        version: "v1"
        
        // GraphQL schema reference
    }
}
```

**Code Generation Use Cases**:
- Generate OpenAPI/Swagger specifications
- Generate API gateway configurations
- Generate contract tests
- Generate API client libraries
- Generate event schemas (AsyncAPI)

**IDE Features**:
- Hover over endpoint shows documentation
- Click endpoint navigates to implementation (future)
- Validation warns on duplicate paths
- Completion suggests HTTP methods

**Rationale**: 
- Documents integration contracts
- Enables API gateway configuration
- Supports contract testing
- Improves team coordination

### ❌ FR-4.3: Service Level Objectives [NOT IMPLEMENTED]

**Status**: **NOT IMPLEMENTED** - No SLO definitions exist.

**Current Gap**: 
Models describe functionality but not operational requirements.

**Requirement**:

Add SLO definitions to BoundedContexts:

```langium
BoundedContextDocumentationBlock:
    // ... existing blocks ...
    | {SLOBlock} ('slo' | 'SLO') name=ID '{' 
        ('target' Assignment target=STRING)?
        ('measurement' Assignment measurement=STRING)?
        ('p99' Assignment p99=STRING)?
        ('p95' Assignment p95=STRING)?
        ('p50' Assignment p50=STRING)?
        (customMetrics+=KeyValuePair)*
      '}'
;
```

**Example Usage**:
```dlang
BC OrderManagement for Sales {
    description: "Manages customer orders"
    
    slo Availability {
        target: "99.9%"
        measurement: "uptime per month"
    }
    
    slo Latency {
        p99: "200ms"
        p95: "100ms"
        p50: "50ms"
        measurement: "API response time"
    }
    
    slo ErrorRate {
        target: "< 0.1%"
        measurement: "5xx errors per request"
    }
    
    slo DataConsistency {
        target: "eventual consistency < 5s"
        measurement: "replication lag"
    }
}
```

**Code Generation Use Cases**:
- Generate monitoring dashboards (Grafana)
- Generate alerting rules (Prometheus AlertManager)
- Generate SLA documentation
- Generate capacity planning reports
- Configure load testing scenarios

**Validation**:
- Warn if critical context has no SLOs
- Info hint for standard SLO templates
- Future: Validate metric format

**Rationale**: 
- Documents operational requirements
- Enables DevOps automation
- Supports SRE practices
- Improves reliability engineering

### ❌ FR-4.4: Lifecycle Markers [NOT IMPLEMENTED]

**Status**: **NOT IMPLEMENTED** - No status annotations exist.

**Current Gap**: 
Models don't indicate which contexts are stable, deprecated, or experimental.

**Requirement**:

Add annotation-style lifecycle markers:

```langium
// Add to grammar entry point
Type:
    annotations+=Annotation*
    (Domain | BoundedContext | Team | Classification)
;

Annotation:
    '@' name=ID ('(' value=STRING ')')?
;
```

**Predefined Annotations**:
- `@deprecated(reason)` - Context is being phased out
- `@experimental` - Context is under development
- `@stable` - Context is production-ready
- `@internal` - Context is not for external use
- `@beta` - Context is in beta testing

**Example Usage**:
```dlang
@deprecated("Use NewOrderService instead. Migration guide: https://wiki/orders-v2")
BC LegacyOrders for Sales {
    description: "Legacy order management system"
}

@experimental
BC AIRecommendations for Marketing {
    description: "AI-powered product recommendations"
}

@stable
BC Checkout for Sales {
    description: "Checkout and payment processing"
}

@internal
BC AdminTools for Operations {
    description: "Internal administration tools"
}

@beta
BC MobileAPI for Sales {
    description: "Mobile-optimized API endpoints"
}
```

**Validation**:
- Warning: Deprecated context referenced by stable context
- Info: Experimental context used in production
- Error: Internal context referenced by external system (future)

**IDE Features**:
- Strikethrough text for @deprecated
- Warning icon for @experimental
- Lock icon for @internal
- Beta badge for @beta
- Hover shows full annotation message

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
- Add annotation support to Type definitions
- Keep metadata optional to avoid breaking changes

**Validation Strategy**:
- No strict validation initially (freeform)
- Future: Catalogs of known technologies
- Future: Compatibility checking

**Code Generation Impact**:
- Metadata directly supports infrastructure generation
- Clear mapping to deployment artifacts
- Technology-agnostic design

### Related ADRs

**Proposed**:
- ADR-006: Implementation Metadata Design (to be created)
- ADR-007: Code Generation Architecture (to be created)

**References**:
- [ADR-002: Architectural Review 2025](../adr/002-architectural-review-2025.md)

## Acceptance Testing

### TS-4.1: Implementation Metadata Parsing
**Given** a BoundedContext with implementation block
**When** file is parsed
**Then** AST contains implementation metadata
**And** hover shows technology stack
**And** code generator can access metadata

### TS-4.2: API Endpoint Validation
**Given** two API endpoints with same path and method
**When** file is validated
**Then** warning appears about duplicate endpoint
**And** suggestion provided to use different paths

### TS-4.3: SLO Documentation
**Given** a BoundedContext with SLO definitions
**When** documentation is generated
**Then** SLOs appear in system documentation
**And** monitoring configuration is created

### TS-4.4: Deprecated Context Warning
**Given** a stable context referencing a deprecated context
**When** file is validated
**Then** warning appears about deprecated dependency
**And** migration message from @deprecated is shown

### TS-4.5: Lifecycle Visualization
**Given** a model with various lifecycle annotations
**When** rendered in diagram
**Then** deprecated contexts are shown as strikethrough
**And** experimental contexts have warning badges
**And** stable contexts appear normal

## Dependencies

**Requires**:
- PRS-003: Tactical DDD Patterns (for API event publishing)
- Langium 4.x (existing)
- TypeScript 5.8+ (existing)

**Blocks**:
- Infrastructure code generation
- Deployment automation
- Monitoring configuration generation

**Related**:
- Code generation framework design
- DevOps tooling integration

## Implementation Phases

### Phase 1: Implementation Metadata (1 week)
- [ ] Add implementation block to grammar
- [ ] Update AST generation
- [ ] Add parsing tests
- [ ] Add hover provider support
- [ ] Create examples

### Phase 2: API Specifications (1 week)
- [ ] Add API block to grammar
- [ ] Implement endpoint parsing
- [ ] Add validation for duplicate endpoints
- [ ] Add event publishing syntax
- [ ] Create API examples

### Phase 3: SLOs (1 week)
- [ ] Add SLO block to grammar
- [ ] Implement SLO parsing
- [ ] Add standard SLO templates
- [ ] Create SLO examples
- [ ] Document SLO best practices

### Phase 4: Lifecycle Markers (1 week)
- [ ] Add annotation support to grammar
- [ ] Implement lifecycle annotations
- [ ] Add validation for deprecated references
- [ ] Add IDE visual indicators
- [ ] Update diagrams to show lifecycle

**Total Effort**: 4 weeks

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Implementation metadata support | 0% | 100% |
| API contract definitions | 0% | Full REST/GraphQL |
| SLO definitions | 0% | Common metrics |
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

### Q2: API Specification Depth
**Question**: How detailed should API specifications be?
**Options**:
- A) Paths and methods only
- B) Add request/response schemas
- C) Full OpenAPI compatibility

**Recommendation**: Option A initially, Option B in future phases.

### Q3: SLO Format
**Question**: Should SLOs use structured format or freeform text?
**Options**:
- A) Freeform text (flexible but not machine-readable)
- B) Structured format (strict but code-generable)
- C) Hybrid (templates with overrides)

**Recommendation**: Option A initially, Option C in future for automation.

## References

- [Original PRS-001](./001-language-design-improvements.md)
- [PRS-003: Tactical DDD Patterns](./003-tactical-ddd-patterns.md)
- [OpenAPI Specification](https://swagger.io/specification/)
- [AsyncAPI Specification](https://www.asyncapi.com/)
- [Google SRE Book - SLOs](https://sre.google/sre-book/service-level-objectives/)

---

**Document Version:** 1.0  
**Last Updated:** January 11, 2026  
**Status:** Planned  
**Next Review:** After PRS-003 completion
