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
    // Advanced syntax keywords (not primary DDD concepts)
    implements: "**implements**\n\nDeclares that a Bounded Context or type implements a Domain or interface.",
    as: "**as**\n\nUsed for aliasing or renaming imports or types.",
    from: "**from**\n\nSpecifies the source module or file for an import statement.",
    type: "**type**\n\nDeclares a new type or alias in the model.",
    map: "**map**\n\nDefines a mapping or transformation between elements.",
    this: "**this**\n\nRefers to the current context or object.",
    
    // DDD Classifiers - keep richer explanations here
    entity: "**Entity**\n\nA domain object with a distinct identity that runs through time and different states.",
    valueobject: "**Value Object**\n\nAn object that describes some characteristic or attribute but has no conceptual identity.",
    aggregate: "**Aggregate**\n\nA cluster of domain objects that can be treated as a single unit. An aggregate has a root and a boundary.",
    service: "**Service**\n\nA stateless operation or domain logic that does not naturally fit within an Entity or Value Object.",
    event: "**Event**\n\nA significant occurrence or change in state that is relevant to the domain.",
    businessrule: "**Business Rule**\n\nA specific rule that constrains or influences business behavior.",
    
    // DDD Integration Patterns - these deserve richer explanations than basic grammar JSDoc
    acl: "**ACL (Anti-Corruption Layer)**\n\nA defensive pattern that creates a translation layer between two bounded contexts to prevent concepts from one context polluting the other.\n\n---\n\n*Example: A layer that translates legacy system data formats into modern domain models.*",
    ohs: "**OHS (Open Host Service)**\n\nA protocol or interface that provides access to a subsystem as a set of services, making integration easier for other contexts.\n\n---\n\n*Example: A well-documented REST API that other contexts can consume.*",
    pl: "**PL (Published Language)**\n\nA well-documented shared language that helps multiple contexts communicate. Often used with Open Host Service.\n\n---\n\n*Example: A standardized XML schema or JSON format for data exchange.*",
    cf: "**CF (Conformist)**\n\nA pattern where a downstream team fully adopts the model of the upstream team, without translation.\n\n---\n\n*Example: A new service that exactly matches the data model of an existing system.*",
    bbom: "**BBoM (Big Ball of Mud)**\n\nA system with little or no perceivable architecture, typically resulting from rapid growth without architectural governance.\n\n---\n\n*Example: A monolithic application with tangled dependencies and no clear boundaries.*",
    sk: "**SK (Shared Kernel)**\n\nA subset of the domain model that is shared between multiple bounded contexts and maintained in close coordination.\n\n---\n\n*Example: Common data structures shared between Sales and Billing contexts.*",
    p: "**P (Partnership)**\n\nA relationship where two teams succeed or fail together, requiring close collaboration and shared goals.\n\n---\n\n*Example: Two teams jointly developing interconnected features.*",
    
    // DDD Relationship Types - richer than grammar JSDoc
    separateways: "**Separate Ways**\n\nA relationship pattern where two contexts decide to have no connection, each solving similar problems differently.\n\n---\n\n*Example: Different departments maintaining separate customer databases.*",
    partnership: "**Partnership**\n\nA relationship where teams share both risks and rewards, requiring close collaboration and joint decision-making.\n\n---\n\n*Example: Two teams working together on a critical business capability.*",
    sharedkernel: "**Shared Kernel**\n\nA pattern where multiple bounded contexts share a common subset of the domain model, requiring careful coordination for changes.\n\n---\n\n*Example: Common validation rules shared across multiple contexts.*",
    customersupplier: "**Customer-Supplier**\n\nA relationship where the upstream team prioritizes the downstream team's needs, but still maintains independence.\n\n---\n\n*Example: An API team prioritizing features needed by consuming teams.*",
    upstreamdownstream: "**Upstream-Downstream**\n\nA relationship where changes in the upstream context can affect the downstream context, but not vice versa.\n\n---\n\n*Example: A core service (upstream) used by multiple dependent services (downstream).*",
    
    // Relationship arrows
    '<->': "**Bi-directional**\n\nA relationship where two contexts are connected in both directions.\n\n---\n\n*Example: Two contexts that need to exchange data and events.*",
    '->': "**Upstream/Downstream**\n\nA relationship where the left context depends on the right context.\n\n---\n\n*Example: A context that depends on another context.*",
    '<-': "**Downstream/Upstream**\n\nA relationship where the right context depends on the left context.\n\n---\n\n*Example: A context that is depended on by another context.*",
}; 
