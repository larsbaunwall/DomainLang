# PRS-006: Standard Library (stdlib)

Status: Planned
Priority: Medium
Target Version: 2.2.0
Parent: None
Created: January 11, 2026
Effort Estimate: 3-4 weeks
Dependencies: None

## Overview

This PRS defines a **DomainLang Standard Library** (stdlib) that provides reusable Classifications, patterns, and conventions for DDD modeling. The stdlib leverages DomainLang's existing git-native import system, requiring no new language features. The IDE/LSP will recognize standard types and provide enhanced validation, warnings, and code intelligence.

This acts as DomainLang's equivalent of a Base Class Library (BCL), establishing conventions and patterns that the community can build upon.

## Implementation Status Summary

| Requirement | Status | Notes |
|------------|--------|-------|
| FR-6.1: Standard Library Repository | ❌ Not Implemented | Create domainlang/stdlib repo |
| FR-6.2: Core Classifications | ❌ Not Implemented | Lifecycle, domain types, patterns |
| FR-6.3: DDD Pattern Library | ❌ Not Implemented | Integration patterns, roles |
| FR-6.4: LSP Standard Type Recognition | ❌ Not Implemented | IDE awareness of stdlib types |
| FR-6.5: Standard Type Validation | ❌ Not Implemented | Deprecated warnings, etc. |

**Overall Status**: NOT implemented. This is a foundational enhancement for ecosystem growth.

## User Stories

### US-1: Domain Modeler
As a domain modeler,
I want to import standard lifecycle Classifications,
So that I don't have to define them in every project.

### US-2: Team Lead
As a team lead,
I want all team members to use consistent terminology,
So that models are easier to understand across projects.

### US-3: Tool Developer
As a tool developer building DomainLang extensions,
I want to recognize standard patterns programmatically,
So that I can provide specialized behavior for common cases.

### US-4: IDE User
As an IDE user,
I want warnings when referencing deprecated contexts,
So that I'm aware of architectural migration needs.

### US-5: Library Author
As a library author,
I want to publish reusable domain patterns,
So that the community can share DDD knowledge.

## Functional Requirements

### ❌ FR-6.1: Standard Library Repository [NOT IMPLEMENTED]

**Status**: **NOT IMPLEMENTED** - No standard library exists.

**Current Gap**: 
Every project must define its own Classifications for common concepts (Deprecated, Core, Supporting, etc.).

**Requirement**:

Create official `domainlang/stdlib` GitHub repository with versioned releases.

**Repository Structure**:
```
domainlang/stdlib/
├── dlang.toml              # Package metadata
├── index.dlang             # Main entry point
├── README.md               # Documentation
├── CHANGELOG.md            # Version history
├── lifecycle/
│   └── index.dlang         # Lifecycle Classifications
├── domain-types/
│   └── index.dlang         # Subdomain Classifications
├── ddd-patterns/
│   ├── strategic.dlang     # Strategic DDD patterns
│   └── integration.dlang   # Integration patterns
└── examples/
    └── quickstart.dlang    # Usage examples
```

**dlang.toml**:
```toml
[package]
name = "domainlang-stdlib"
version = "1.0.0"
entry = "index.dlang"
description = "DomainLang Standard Library - Core Classifications and DDD Patterns"
repository = "https://github.com/domainlang/stdlib"
license = "MIT"

[metadata]
authors = ["DomainLang Core Team"]
keywords = ["ddd", "patterns", "classifications", "standard-library"]
```

**Usage**:
```dlang
// Import entire stdlib
import "domainlang/stdlib@v1.0.0" as Std

// Use standard Classifications
bc Orders lifecycle Std.Deprecated { ... }

// Or import specific modules
import "domainlang/stdlib/lifecycle@v1.0.0" as Lifecycle

bc Orders lifecycle Lifecycle.Deprecated { ... }
```

**Versioning Strategy**:
- Semantic versioning (major.minor.patch)
- Breaking changes = major version bump
- New Classifications = minor version bump
- Documentation/fixes = patch version bump
- Minimum version: v1.0.0 (stable API contract)

**Governance**:
- Core team maintains stdlib
- Community contributions via PRs
- RFC process for major additions
- Backward compatibility commitment

**Rationale**: 
- Establishes conventions across projects
- Reduces boilerplate in models
- Enables ecosystem tools to recognize patterns
- Git-native distribution aligns with existing import system

### ❌ FR-6.2: Core Classifications [NOT IMPLEMENTED]

**Status**: **NOT IMPLEMENTED** - No standard Classifications exist.

**Current Gap**: 
No standardized Classification names; every project invents its own.

**Requirement**:

Define standard Classifications in stdlib covering common DDD concepts.

**lifecycle/index.dlang**:
```dlang
// Lifecycle States
Classification Deprecated
Classification Experimental
Classification Stable
Classification Beta
Classification Alpha
Classification Legacy
Classification Sunset

// Visibility
Classification Internal
Classification External
Classification Public
Classification Private

// Maturity
Classification ProductionReady
Classification Development
Classification Prototype
```

**domain-types/index.dlang**:
```dlang
// Subdomain Types (DDD Strategic Design)
Classification CoreDomain
Classification SupportingDomain
Classification GenericDomain

// Business Criticality
Classification MissionCritical
Classification BusinessCritical
Classification Supporting
Classification Commodity

// Domain Ownership
Classification Differentiator
Classification Essential
Classification Utility
```

**ddd-patterns/strategic.dlang**:
```dlang
// Bounded Context Roles (DDD Patterns)
Classification AggregateRoot
Classification Entity
Classification ValueObject
Classification Service
Classification Repository
Classification Factory

// Team Patterns
Classification AutonomousTeam
Classification PlatformTeam
Classification EnablingTeam
Classification ComplicatedSubsystemTeam
```

**ddd-patterns/integration.dlang**:
```dlang
// Integration Pattern Roles
Classification OpenHostService
Classification AntiCorruptionLayer
Classification ConformistConsumer
Classification PublishedLanguage
Classification SharedKernel
Classification CustomerSupplier
Classification Partnership
```

**index.dlang** (Main Entry Point):
```dlang
// DomainLang Standard Library v1.0.0
// 
// This library provides standard Classifications and patterns
// for Domain-Driven Design modeling.
//
// Usage:
//   import "domainlang/stdlib@v1.0.0" as Std
//
// Documentation: https://domainlang.org/stdlib

namespace Std {
    // Re-export all standard Classifications
    
    // Lifecycle
    Classification Deprecated
    Classification Experimental
    Classification Stable
    Classification Beta
    Classification Internal
    Classification External
    
    // Domain Types
    Classification CoreDomain
    Classification SupportingDomain
    Classification GenericDomain
    
    // Business Criticality
    Classification MissionCritical
    Classification BusinessCritical
    
    // Team Patterns
    Classification AutonomousTeam
    Classification PlatformTeam
}
```

**Documentation Requirements**:
- JSDoc comments on each Classification
- Usage examples for each pattern
- Links to DDD literature
- Migration guides between versions

**Rationale**: 
- Standardizes terminology across projects
- Reduces learning curve for DDD newcomers
- Enables tooling to recognize semantic meaning
- Aligns with DDD ubiquitous language

### ❌ FR-6.3: Community Pattern Libraries [NOT IMPLEMENTED]

**Status**: **NOT IMPLEMENTED** - No pattern library infrastructure exists.

**Current Gap**: 
No ecosystem for sharing domain-specific pattern libraries.

**Requirement**:

Enable community-contributed pattern libraries following stdlib conventions.

**Naming Convention**:
- Official: `domainlang/{name}` (e.g., `domainlang/stdlib`)
- Community: `{org}/{name}` (e.g., `acme/retail-patterns`)
- Personal: `{username}/{name}` (e.g., `johndoe/ddd-patterns`)

**Example Community Libraries**:
```dlang
// E-commerce patterns
import "ddd-community/ecommerce-patterns@v2.1.0" as ECommerce

bc Checkout lifecycle ECommerce.CheckoutProcess { ... }

// Healthcare patterns (HIPAA compliance)
import "healthcare/hipaa-patterns@v1.0.0" as HIPAA

bc PatientRecords 
    for HealthcareDomain
    as HIPAA.HIPAACompliant { ... }

// Microservices patterns
import "microservices/cloud-patterns@v3.0.0" as Cloud

bc OrderService 
    as Cloud.StatelessService
    lifecycle Cloud.ContainerReady { ... }
```

**Registry Concept** (Future):
- Optional central registry at domainlang.org/registry
- Searchable by keywords, patterns, domain
- Quality badges (maintained, documented, tested)
- Download statistics
- GitHub integration (automatic indexing)

**Quality Guidelines**:
- Follow stdlib naming conventions
- Include comprehensive documentation
- Provide usage examples
- Semantic versioning
- License declaration (prefer MIT/Apache)
- Changelog maintenance

**Rationale**: 
- Accelerates pattern reuse across organizations
- Builds DDD knowledge commons
- Reduces duplicated effort
- Encourages best practices sharing

### ❌ FR-6.4: LSP Standard Type Recognition [NOT IMPLEMENTED]

**Status**: **NOT IMPLEMENTED** - LSP doesn't recognize standard types.

**Current Gap**: 
IDE treats all Classifications equally; no special behavior for standard types.

**Requirement**:

Enhance LSP to recognize and provide specialized behavior for stdlib types.

**Recognition Strategy**:

```typescript
// services/stdlib-recognizer.ts

export interface StdlibInfo {
    isStdlibType: boolean;
    category: 'lifecycle' | 'domain-type' | 'pattern' | 'unknown';
    semanticMeaning?: string;
    documentationUrl?: string;
}

export class StdlibRecognizer {
    /**
     * Determines if a Classification is from stdlib.
     * 
     * Checks:
     * 1. Imported from domainlang/stdlib
     * 2. Namespace prefix is "Std"
     * 3. Name matches known stdlib Classifications
     */
    isStdlibType(classification: Classification): boolean {
        // Check import source
        const container = AstUtils.getContainerOfType(
            classification, 
            isModel
        );
        
        if (container?.imports) {
            const stdlibImport = container.imports.find(imp => 
                imp.uri?.includes('domainlang/stdlib')
            );
            if (stdlibImport) return true;
        }
        
        // Check namespace prefix
        const qualifiedName = this.getQualifiedName(classification);
        if (qualifiedName.startsWith('Std.')) return true;
        
        // Check against known stdlib names
        return STDLIB_CLASSIFICATIONS.includes(classification.name);
    }
    
    /**
     * Gets semantic information about a stdlib type.
     */
    getStdlibInfo(classification: Classification): StdlibInfo {
        const name = classification.name;
        
        // Lifecycle types
        if (LIFECYCLE_TYPES.includes(name)) {
            return {
                isStdlibType: true,
                category: 'lifecycle',
                semanticMeaning: LIFECYCLE_SEMANTICS[name],
                documentationUrl: `https://domainlang.org/stdlib/lifecycle#${name}`
            };
        }
        
        // Domain types
        if (DOMAIN_TYPES.includes(name)) {
            return {
                isStdlibType: true,
                category: 'domain-type',
                semanticMeaning: DOMAIN_SEMANTICS[name],
                documentationUrl: `https://domainlang.org/stdlib/domains#${name}`
            };
        }
        
        return { isStdlibType: false, category: 'unknown' };
    }
}

// Known stdlib Classifications
const LIFECYCLE_TYPES = [
    'Deprecated', 'Experimental', 'Stable', 'Beta', 
    'Internal', 'External', 'Legacy', 'Sunset'
];

const DOMAIN_TYPES = [
    'CoreDomain', 'SupportingDomain', 'GenericDomain',
    'MissionCritical', 'BusinessCritical'
];

const LIFECYCLE_SEMANTICS: Record<string, string> = {
    'Deprecated': 'Context is being phased out and should not be used in new integrations',
    'Experimental': 'Context is under active development and APIs may change',
    'Stable': 'Context is production-ready with stable APIs',
    'Internal': 'Context is for internal use only and should not be exposed externally',
    // ... etc
};
```

**IDE Features Enabled**:

1. **Enhanced Hover Information**:
```typescript
// When hovering over Std.Deprecated
Std.Deprecated (stdlib)

Marks a Bounded Context as deprecated and scheduled for removal.
Contexts using this lifecycle should not be referenced by new systems.

📚 Documentation: https://domainlang.org/stdlib/lifecycle#deprecated
⚠️  Warning: References to deprecated contexts will generate warnings
```

2. **Icon Decorations**:
- Deprecated: ⚠️ warning triangle
- Experimental: 🧪 flask icon
- Stable: ✅ checkmark
- Internal: 🔒 lock icon

3. **Semantic Validation** (see FR-6.5)

**Rationale**: 
- Provides rich IDE experience for standard types
- Enables semantic validation
- Guides users toward best practices
- Leverages stdlib as source of truth

### ❌ FR-6.5: Standard Type Validation [NOT IMPLEMENTED]

**Status**: **NOT IMPLEMENTED** - No validation for standard type semantics.

**Current Gap**: 
No warnings when violating lifecycle rules (e.g., referencing deprecated contexts).

**Requirement**:

Add semantic validation rules that recognize stdlib types and enforce conventions.

**Validation Rules**:

```typescript
// validation/stdlib-validator.ts

export class StdlibValidator {
    
    /**
     * Rule: Warn when stable context references deprecated context.
     */
    @ValidationRule('check-deprecated-references')
    checkDeprecatedReferences(
        context: BoundedContext, 
        accept: ValidationAcceptor
    ): void {
        const lifecycle = this.getLifecycle(context);
        if (lifecycle?.ref?.name === 'Stable') {
            // Check relationships
            const relationships = this.getRelationships(context);
            for (const rel of relationships) {
                const targetLifecycle = this.getLifecycle(rel.target);
                if (targetLifecycle?.ref?.name === 'Deprecated') {
                    accept('warning', 
                        `Stable context "${context.name}" references deprecated context "${rel.target.name}". ` +
                        `Consider migrating to an alternative.`,
                        { node: rel }
                    );
                }
            }
        }
    }
    
    /**
     * Rule: Info when experimental context is referenced.
     */
    @ValidationRule('check-experimental-usage')
    checkExperimentalUsage(
        context: BoundedContext,
        accept: ValidationAcceptor
    ): void {
        const lifecycle = this.getLifecycle(context);
        if (lifecycle?.ref?.name === 'Experimental') {
            const referencingContexts = this.findReferencingContexts(context);
            if (referencingContexts.length > 0) {
                accept('info',
                    `Experimental context "${context.name}" is referenced by ${referencingContexts.length} context(s). ` +
                    `APIs may change without notice.`,
                    { node: context }
                );
            }
        }
    }
    
    /**
     * Rule: Error when external system references internal context.
     */
    @ValidationRule('check-internal-visibility')
    checkInternalVisibility(
        context: BoundedContext,
        accept: ValidationAcceptor
    ): void {
        const lifecycle = this.getLifecycle(context);
        if (lifecycle?.ref?.name === 'Internal') {
            // Check if referenced by contexts marked as External
            const referencingContexts = this.findReferencingContexts(context);
            for (const ref of referencingContexts) {
                const refLifecycle = this.getLifecycle(ref);
                if (refLifecycle?.ref?.name === 'External') {
                    accept('error',
                        `Internal context "${context.name}" cannot be referenced by external context "${ref.name}". ` +
                        `Use an Anti-Corruption Layer or Published Language.`,
                        { node: ref }
                    );
                }
            }
        }
    }
    
    /**
     * Rule: Suggest adding lifecycle if missing.
     */
    @ValidationRule('suggest-lifecycle')
    suggestLifecycle(
        context: BoundedContext,
        accept: ValidationAcceptor
    ): void {
        const lifecycle = this.getLifecycle(context);
        if (!lifecycle && this.hasStdlibImport(context)) {
            accept('hint',
                `Consider adding a lifecycle classification (e.g., "lifecycle Std.Stable"). ` +
                `This helps document the maturity and visibility of the context.`,
                { node: context }
            );
        }
    }
}
```

**Validation Examples**:

```dlang
import "domainlang/stdlib@v1.0.0" as Std

// ⚠️ WARNING: Stable context references deprecated context
bc NewOrders for Sales
    lifecycle Std.Stable {
    
    relationships {
        [OHS] this -> [ACL] LegacyOrders  // LegacyOrders is Deprecated
    }
}

bc LegacyOrders for Sales
    lifecycle Std.Deprecated {
    description: "Being replaced by NewOrders"
}

// ❌ ERROR: Internal context referenced by external context
bc AdminTools for Operations
    lifecycle Std.Internal {
    description: "Internal admin tooling"
}

bc PublicAPI for Sales
    lifecycle Std.External {
    
    relationships {
        this -> AdminTools  // ERROR: Can't reference Internal from External
    }
}

// ℹ️ INFO: Experimental context is used
bc AIRecommendations for Marketing
    lifecycle Std.Experimental {
    description: "Machine learning recommendations"
}

bc ProductCatalog for Sales {
    relationships {
        this -> AIRecommendations  // INFO: Experimental API may change
    }
}
```

**Configuration**:

Allow users to adjust severity levels:

```json
// .vscode/settings.json or dlang.toml
{
    "domainlang.validation": {
        "stdlib.deprecatedReferences": "warning",  // or "error", "info", "off"
        "stdlib.experimentalUsage": "info",
        "stdlib.internalVisibility": "error",
        "stdlib.suggestLifecycle": "hint"
    }
}
```

**Rationale**: 
- Enforces architectural governance rules
- Prevents accidental violations
- Educates users about lifecycle implications
- Customizable to organization needs

## Non-Functional Requirements

### Versioning & Compatibility

- **Semantic Versioning**: stdlib follows semver strictly
- **LTS Support**: Major versions supported for 2 years
- **Deprecation Policy**: 6-month deprecation warning before removal
- **Breaking Changes**: Only in major versions
- **Migration Guides**: Provided for all major versions

### Performance

- **Import Overhead**: < 10ms to load stdlib
- **LSP Recognition**: < 5ms to check if type is stdlib
- **Validation**: Stdlib checks add < 10% to validation time
- **Caching**: LSP caches stdlib metadata in memory

### Documentation

- **API Reference**: Complete reference for all Classifications
- **Usage Examples**: Real-world examples for each pattern
- **Migration Guides**: Version-to-version upgrade paths
- **DDD Literature Links**: References to canonical DDD books
- **Video Tutorials**: Getting started with stdlib

### Quality Assurance

- **Test Coverage**: 100% for core Classifications
- **CI/CD**: Automated testing on every commit
- **Lint Rules**: Consistent formatting and naming
- **Release Process**: Automated via GitHub Actions
- **Changelog**: Maintained for all versions

## Design Considerations

### Architectural Implications

**No Language Changes Required**:
- Stdlib uses existing import system
- No new grammar rules needed
- LSP enhancements are additive
- Backward compatible with all existing models

**LSP Architecture**:
```
┌─────────────────────────────────────────┐
│         DomainLang LSP Server           │
├─────────────────────────────────────────┤
│  Stdlib Recognizer (FR-6.4)            │
│  - Detects stdlib imports               │
│  - Identifies standard Classifications  │
├─────────────────────────────────────────┤
│  Stdlib Validator (FR-6.5)             │
│  - Lifecycle rules                      │
│  - Visibility rules                     │
│  - Convention enforcement               │
├─────────────────────────────────────────┤
│  Enhanced Hover Provider                │
│  - Stdlib type documentation            │
│  - Semantic meaning                     │
│  - Links to docs                        │
└─────────────────────────────────────────┘
```

**Git Repository Layout**:
- Main branch: stable releases only
- Develop branch: active development
- Version tags: v1.0.0, v1.1.0, etc.
- GitHub Releases: Changelog + artifacts

**Extensibility**:
- Plugin system for custom validators
- Hook points for organization-specific rules
- Custom Classification registries

### Related ADRs

**Proposed**:
- ADR-008: Standard Library Architecture (to be created)
- ADR-009: Stdlib Versioning Policy (to be created)
- ADR-010: LSP Standard Type Recognition (to be created)

**References**:
- [ADR-002: Architectural Review 2025](../adr/002-architectural-review-2025.md)

## Acceptance Testing

### TS-6.1: Import Standard Library

**Given** a DomainLang model
**When** user adds `import "domainlang/stdlib@v1.0.0" as Std`
**Then** IDE resolves the import without errors
**And** Std.Deprecated is available for use
**And** Hover on Std.Deprecated shows stdlib documentation

### TS-6.2: Deprecated Context Warning

**Given** a stable context referencing a deprecated context
**When** file is validated
**Then** warning appears: "Stable context references deprecated context"
**And** warning includes suggestion to migrate
**And** warning severity is configurable

### TS-6.3: Internal Visibility Enforcement

**Given** an internal context referenced by external context
**When** file is validated
**Then** error appears: "Internal context cannot be referenced by external"
**And** suggestion provided to use ACL or Published Language

### TS-6.4: Stdlib Type Recognition

**Given** a Classification imported from stdlib
**When** user hovers over the Classification
**Then** hover shows "(stdlib)" indicator
**And** shows semantic meaning
**And** provides link to documentation

### TS-6.5: Community Library Import

**Given** a community library following stdlib conventions
**When** user imports the library
**Then** IDE resolves import successfully
**And** LSP recognizes library types (if configured)
**And** Custom validation rules can be applied

## Dependencies

**Requires**:
- Langium 4.x (existing)
- TypeScript 5.8+ (existing)
- Git command-line tools (existing for import system)

**Blocks**:
- PRS-004: Implementation Bridge (lifecycle markers)
- Community pattern sharing
- Ecosystem growth

**Related**:
- PRS-001: Language Design Improvements
- PRS-004: Implementation Bridge (lifecycle markers depend on stdlib)

## Implementation Phases

### Phase 1: Stdlib Repository Setup (1 week)

- [ ] Create domainlang/stdlib GitHub repository
- [ ] Define repository structure
- [ ] Create dlang.toml package manifest
- [ ] Write core lifecycle Classifications
- [ ] Write domain type Classifications
- [ ] Add README and documentation
- [ ] Set up CI/CD pipeline
- [ ] Publish v1.0.0 release

### Phase 2: LSP Standard Type Recognition (1 week)

- [ ] Implement StdlibRecognizer service
- [ ] Add stdlib import detection
- [ ] Enhance hover provider for stdlib types
- [ ] Add stdlib type icons in IDE
- [ ] Create stdlib metadata cache
- [ ] Add unit tests for recognition
- [ ] Update LSP documentation

### Phase 3: Semantic Validation (1-2 weeks)

- [ ] Implement StdlibValidator service
- [ ] Add deprecated reference check
- [ ] Add experimental usage warnings
- [ ] Add internal visibility enforcement
- [ ] Add lifecycle suggestion hints
- [ ] Make validation rules configurable
- [ ] Add integration tests
- [ ] Document validation rules

### Phase 4: Documentation & Examples (1 week)

- [ ] Create stdlib documentation website
- [ ] Write usage examples for each Classification
- [ ] Create video tutorials
- [ ] Write migration guides
- [ ] Add DDD literature references
- [ ] Create community contribution guide
- [ ] Set up pattern library registry (optional)

**Total Effort**: 4 weeks

## Success Metrics

| Metric | Current | Target |
| ------ | ------- | ------ |
| Stdlib repository created | No | Yes |
| Core Classifications defined | 0 | 30+ |
| LSP recognizes stdlib types | No | Yes |
| Validation rules implemented | 0 | 5+ |
| Documentation coverage | 0% | 100% |
| Community libraries | 0 | 3+ (within 6 months) |
| Projects using stdlib | 0 | 50+ (within 1 year) |

## Open Questions

### Q1: Stdlib Namespace Convention

**Question**: Should stdlib use a namespace, or export at root level?

**Options**:
- A) Namespace: `Std.Deprecated` (requires `as Std`)
- B) Root level: `Deprecated` (no namespace)
- C) Both: Support both patterns

**Recommendation**: Option A (namespace). Prevents naming conflicts and makes stdlib origin explicit.

### Q2: Version Pinning Policy

**Question**: Should we recommend pinning to specific versions or ranges?

**Options**:
- A) Exact pins: `@v1.0.0` (reproducible but inflexible)
- B) Minor ranges: `@v1` (flexible but less reproducible)
- C) Let users decide

**Recommendation**: Option C with guidance: Use exact pins for production, ranges for development.

### Q3: Classification vs. Types

**Question**: Should stdlib eventually include typed constructs (Aggregates, Entities)?

**Options**:
- A) Classifications only (current scope)
- B) Add DDD tactical types (future PRS)
- C) Separate stdlib-tactical library

**Recommendation**: Option A for v1.0.0, Option C for future expansion.

### Q4: Community Registry

**Question**: Should there be a central registry for community libraries?

**Options**:
- A) Central registry at domainlang.org
- B) GitHub-only discovery
- C) Both: registry indexes GitHub

**Recommendation**: Option B initially (GitHub discovery), Option C when ecosystem grows.

## References

- [PRS-004: Implementation Bridge](./004-implementation-bridge.md) (lifecycle markers)
- [Original PRS-001](./001-language-design-improvements.md)
- [Go Modules](https://go.dev/blog/using-go-modules) - Inspiration for git-native imports
- [Deno Standard Library](https://deno.land/std) - Versioned stdlib via URLs
- [Domain-Driven Design (Blue Book)](https://www.domainlanguage.com/ddd/) - DDD patterns
- [Team Topologies](https://teamtopologies.com/) - Team patterns

---

**Document Version:** 1.0  
**Last Updated:** January 11, 2026  
**Status:** Planned  
**Next Review:** After prototype implementation
