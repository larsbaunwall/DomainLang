/**
 * Keyword explanations for DomainLang hover documentation.
 * 
 * This dictionary provides fallback hover content for keywords that don't have
 * JSDoc comments in the grammar file, or for providing richer DDD pattern explanations.
 * 
 * Basic keyword documentation (domain, boundedcontext, etc.) is now in the grammar file
 * as JSDoc comments. This dictionary focuses on DDD integration patterns and advanced concepts.
 * 
 * @see src/language/domain-lang.langium for basic keyword JSDoc
 * @see ddd-pattern-explanations.ts for role patterns and relationship types
 */
export const keywordExplanations: Record<string, string> = {
    // Advanced syntax keywords
    implements: "**implements** - Declares that a Bounded Context or type implements a Domain or interface.",
    as: "**as** - Used for aliasing or renaming imports or types.",
    from: "**from** - Specifies the source module or file for an import statement.",
    type: "**type** - Declares a new type or alias in the model.",
    map: "**map** - Defines a mapping or transformation between elements.",
    this: "**this** - Refers to the current context or object.",
    
    // DDD Classifiers
    entity: "**Entity** - Domain object with distinct identity that runs through time.",
    valueobject: "**Value Object** - Immutable object that describes a characteristic.",
    aggregate: "**Aggregate** - Cluster of domain objects with a root and boundary.",
    service: "**Service** - Stateless domain operation.",
    event: "**Event** - Significant domain occurrence or state change.",
    businessrule: "**Business Rule** - Rule that constrains business behavior.",
    
    // DDD Integration Patterns
    acl: "**ACL (Anti-Corruption Layer)** - Translation layer protecting downstream context from upstream changes.",
    ohs: "**OHS (Open Host Service)** - Well-defined protocol providing access to a subsystem.",
    pl: "**PL (Published Language)** - Documented shared language for context communication.",
    cf: "**CF (Conformist)** - Downstream adopts upstream model without translation.",
    bbom: "**BBoM (Big Ball of Mud)** - System with tangled architecture and no clear boundaries.",
    sk: "**SK (Shared Kernel)** - Shared domain model subset requiring coordination.",
    p: "**P (Partnership)** - Teams collaborate closely with shared success/failure.",
    
    // DDD Relationship Types
    separateways: "**Separate Ways** - No connection between contexts, each solves problems independently.",
    partnership: "**Partnership** - Teams share risks and rewards with close collaboration.",
    sharedkernel: "**Shared Kernel** - Shared domain model subset requiring coordination.",
    customersupplier: "**Customer-Supplier** - Upstream prioritizes downstream needs.",
    upstreamdownstream: "**Upstream-Downstream** - Upstream changes affect downstream.",
    
    // Relationship arrows
    '<->': "**Bidirectional** - Two contexts connected in both directions.",
    '->': "**Upstream → Downstream** - Left depends on right.",
    '<-': "**Downstream ← Upstream** - Right depends on left.",
}; 
