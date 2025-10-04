// DomainLang Grammar for Domain-Driven Design (DDD) Specification Language
// Copyright (c) 2025, Lars Baunwall. All rights reserved.
//
// This grammar defines a DSL inspired by ContextMapper DSL, designed for diagrams-as-code and semantic modeling of DDD architectures.
// It supports IDE features, diagramming, and model exploration. See validation pipeline for semantic checks.
//
// Best practices:
// - Each rule is documented with its purpose and example usage.
// - Cross-references are explained in comments.
// - Documentation blocks reference semantic validation.
//
// For more, see project documentation.

grammar DomainLang

/**
 * Entry point for DomainLang models.
 *
 * Semantics:
 *   - Aggregates all top-level elements (domains, contexts, groups, maps, etc.).
 *   - Produces the root AST node (`Model`).
 *   - Serves as the entry rule for parsing `.dlang` files.
 *
 * Example:
 *   Domain Sales { ... }
 *   BoundedContext SalesContext { ... }
 *   Group Shared { ... }
 */
entry Model: 
    imports+=ImportStatement*
    (children+=StructureElement)*
;

type Container = GroupDeclaration | Model | PackageDeclaration;

/**
 * Represents any top-level structure in the model.
 *
 * Semantics:
 *   - Unifies all major DDD elements (types, maps, groups, packages) for flexible ordering.
 *   - Enables nesting and grouping.
 *
 * AST Impact:
 *   - Used as a union type for children in Model and GroupDeclaration.
 */
StructureElement: 
    Type |
    ObjectMap |
    GroupDeclaration |
    PackageDeclaration |
    ContextGroup
;

/**
 * Union of all main DDD type constructs.
 *
 * Semantics:
 *   - Allows Domains, BoundedContexts, Teams, and Classifications to appear at the top level or within groups.
 *   - Each type creates a distinct AST node.
 */
Type:
    BoundedContext | 
    Domain | 
    Team |
    Classification
;

/**
 * Hierarchical grouping for namespacing and modularity.
 *
 * Semantics:
 *   - Allows nesting of elements under a qualified name.
 *   - Supports FQN disambiguation and avoids naming collisions.
 *   - Groups can be nested arbitrarily.
 *
 * Example:
 *   Group Shared {
 *     Domain Common { ... }
 *     BoundedContext CommonContext { ... }
 *   }
 *
 * AST Impact:
 *   - Creates a `GroupDeclaration` node with its own children.
 */
GroupDeclaration:
    ('Group' | 'group') name=QualifiedName '{'
        (children+=StructureElement)*
    '}'
;

/**
 * Package declarations for organizing large models.
 *
 * Semantics:
 *   - Provides namespace isolation for DDD elements.
 *   - Supports qualified name resolution across packages.
 *   - Enables modular architecture organization.
 *
 * Example:
 *   package acme.sales {
 *     Domain Sales { ... }
 *     BC Orders { ... }
 *   }
 *
 * AST Impact:
 *   - Creates a `PackageDeclaration` node with qualified name and children.
 */
PackageDeclaration:
    'package' name=QualifiedName '{'
        (children+=StructureElement)*
    '}'
;

/**
 * Groups bounded contexts by strategic role or pattern.
 *
 * Semantics:
 *   - Organizes contexts by DDD patterns (Core, Supporting, Generic).
 *   - Can reference a domain for scoping.
 *   - Useful for architecture visualization and governance.
 *
 * Example:
 *   ContextGroup CoreDomain for Sales {
 *     role: Core
 *     contains Orders, Pricing, Catalog
 *   }
 *
 * AST Impact:
 *   - Creates a `ContextGroup` node with role and context references.
 */
ContextGroup:
    ('ContextGroup' | 'contextgroup') name=ID 
    (('for' | 'in') domain=[Domain:QualifiedName])?
    '{'
        ('role' Assignment roleClassifier=[Classification:QualifiedName])?
        (('contexts' | 'contains') contexts+=[BoundedContext:QualifiedName] 
            (',' contexts+=[BoundedContext:QualifiedName])*)?
    '}'
;

/**
 * Documentation and metadata blocks for attaching rich semantics to elements.
 *
 * Semantics:
 *   - Used as interfaces for attaching descriptions, visions, classifiers, teams, relationships, etc.
 *   - These blocks are validated semantically in the validation pipeline (e.g., classifier existence, team assignment).
 *
 * AST Impact:
 *   - Each block creates a distinct node or property on its parent.
 *
 * Example (in Domain):
 *   description: "Handles all sales operations."
 *   vision: "Be the market leader in digital sales."
 */
interface DescriptionBlock {
    description: string
}
interface VisionBlock {
    vision: string
}
/**
 * ClassifierBlock attaches a reference to a Classification.
 *
 * Semantics:
 *   - classifier is a cross-reference to a Classification node.
 *   - Used for semantic tagging and validation.
 */
interface ClassifierBlock {
    classifier?: @Classification // Cross-reference to Classification
}

/**
 * TeamBlock attaches a reference to a Team.
 *
 * Semantics:
 *   - team is a cross-reference to a Team node.
 *   - Used for responsibility assignment and validation.
 */
interface TeamBlock {
    team?: @Team // Cross-reference to Team
}

/**
 * Individual classifier blocks for flat syntax.
 */
interface RoleBlock {
    roleClassifier?: @Classification
}
interface BusinessModelBlock {
    businessModel?: @Classification
}
interface EvolutionBlock {
    evolution?: @Classification
}

interface RelationshipsBlock {
    relationships: Relationship[]
}
/**
 * ClassifiersBlock allows multiple classifier assignments.
 *
 * Semantics:
 *   - roleClassifier, businessModel, and evolution are cross-references to Classification nodes.
 *   - Used for advanced DDD patterns and validation.
 */
interface ClassifiersBlock {
    roleClassifier?: @Classification
    businessModel?: @Classification
    evolution?: @Classification
}
interface TerminologyBlock {
    domainTerminology: DomainTerm[]
}
interface DecisionsBlock {
    decisions: AbstractDecision[]
}

/**
 * Defines a DDD Domain, optionally referencing a parent domain.
 *
 * Semantics:
 *   - Domains represent bounded spheres of knowledge or activity.
 *   - Can be nested via the `in` parentDomain cross-reference.
 *   - Documentation blocks provide rich metadata.
 *
 * Example:
 *   Domain Sales in Corporate {
 *     description: "Handles all sales operations."
 *     classifier: Strategic
 *   }
 *
 * AST Impact:
 *   - Creates a `Domain` node with documentation and parent reference.
 */
Domain:
    ('Domain' | 'domain') name=ID ('in' parentDomain=[Domain:QualifiedName])? // Cross-reference to Domain
    '{'
        documentation+=DomainDocumentationBlock*
    '}'
;

/**
 * Documentation blocks for Domain. See validation for semantic checks.
 */
DomainDocumentationBlock:
      {DescriptionBlock} 'description' Assignment description=STRING
    | {VisionBlock} 'vision' Assignment vision=STRING
    | {ClassifierBlock} 'classifier' Assignment classifier=[Classification] // Cross-reference
;

/**
 * Defines a DDD Bounded Context, optionally implementing a Domain.
 *
 * Semantics:
 *   - Bounded Contexts define boundaries for models and teams.
 *   - Can reference a Domain via `implements` or `for` (cross-reference).
 *   - Supports inline team and role assignment for brevity.
 *   - Inline assignments can be combined with documentation blocks for flexibility.
 *   - Documentation blocks provide metadata, relationships, classifiers, terminology, and decisions.
 *
 * Examples:
 *   BC SalesContext for Sales as Core by SalesTeam
 *   BC SalesContext for Sales as Core by SalesTeam {
 *     description: "Handles sales workflows."
 *   }
 *   BoundedContext SalesContext implements Sales {
 *     description: "Handles sales workflows."
 *     team: SalesTeam
 *     role: Core
 *   }
 *
 * AST Impact:
 *   - Creates a `BoundedContext` node with documentation and domain reference.
 */
BoundedContext:
    ('BoundedContext' | 'boundedcontext' | 'BC' | 'Context') name=ID 
    (('implements' | 'for') domain=[Domain:QualifiedName])? // Cross-reference
    (
        // Inline assignments (can appear in any order)
        (('as' | 'tagged:') inlineRole=[Classification:QualifiedName])?
        (('by' | 'owner:') inlineTeam=[Team:QualifiedName])?
    )?
    // Optional documentation block (can be combined with inline assignments)
    ('{' documentation+=BoundedContextDocumentationBlock* '}')?
;

/**
 * Documentation blocks for BoundedContext. See validation for semantic checks.
 * Supports both flat and nested syntax for flexibility.
 */
BoundedContextDocumentationBlock:
      {DescriptionBlock} 'description' Assignment description=STRING
    | {TeamBlock} (TeamAssignment | 'owner' | ('managed' 'by')) Assignment team=[Team:QualifiedName] // Cross-reference
    
    // Flat classifier assignments (new, DDD-friendly)
    | {RoleBlock} ('role' | ('domain' 'role')) Assignment roleClassifier=[Classification:QualifiedName]
    | {BusinessModelBlock} ('businessModel' | ('business' 'model')) Assignment businessModel=[Classification:QualifiedName]
    | {EvolutionBlock} ('evolution' | 'maturity') Assignment evolution=[Classification:QualifiedName]
    
    // Nested classifiers block (kept for organization)
    | {ClassifiersBlock} 'classifiers' '{'
        (RoleAssignment Assignment roleClassifier=[Classification:QualifiedName])?
        (BusinessModelAssignment Assignment businessModel=[Classification:QualifiedName])?
        (EvolutionAssignment Assignment evolution=[Classification:QualifiedName])?
      '}'
    
    // Alternative block names for relationships and terminology
    | {RelationshipsBlock} ('relationships' | 'integrations' | 'connections') '{' (relationships += Relationship ((",")? relationships += Relationship)*)* '}'
    | {TerminologyBlock} ('terminology' | 'language' | 'glossary' | ('ubiquitous' 'language')) '{' (domainTerminology += DomainTerm (",")?)* '}'
    | {DecisionsBlock} ('decisions' | 'constraints' | 'rules' | 'policies') '{' (decisions += AbstractDecision (',')?)* '}'
;

/**
 * Assignment fragments for classifier and team blocks.
 *
 * Semantics:
 *   - Used to disambiguate assignments in classifiers and team blocks.
 *   - Not part of the AST; only for grammar readability and maintainability.
 */
fragment RoleAssignment returns string: 'role';
fragment BusinessModelAssignment returns string: 'businessModel';
fragment EvolutionAssignment returns string: 'evolution';
fragment TeamAssignment returns string: 'team';

/**
 * Defines a Classification for semantic tagging.
 *
 * Semantics:
 *   - Used to classify domains, contexts, or roles (e.g., Strategic, Supporting).
 *   - Referenced by classifier blocks and classifiers in BoundedContext.
 *
 * Example:
 *   Classification Strategic
 */
Classification:
    ('Classification' | 'classification') name=ID
;

/**
 * Defines a Team responsible for a context or domain.
 *
 * Semantics:
 *   - Used for team assignment and validation.
 *   - Referenced by team blocks in BoundedContext.
 *
 * Example:
 *   Team SalesTeam
 */
Team: 
    ('Team' | 'team') name=ID
;

/**
 * Union of ContextMap and DomainMap for mapping relationships.
 *
 * Semantics:
 *   - Enables modeling of context and domain relationships in a unified way.
 *   - Used as a child in Model or GroupDeclaration.
 */
ObjectMap: 
    ContextMap | 
    DomainMap
;

/**
 * Defines a map of Bounded Contexts and their relationships.
 *
 * Semantics:
 *   - Contains references to BoundedContexts (cross-references).
 *   - Defines relationships between contexts, including roles and types.
 *
 * Example:
 *   ContextMap MainMap {
 *     contains SalesContext, SupportContext
 *     relationships [PL] SalesContext <-> SupportContext : Partnership
 *   }
 *
 * AST Impact:
 *   - Creates a `ContextMap` node with boundedContexts and relationships.
 */
ContextMap:
    ('ContextMap' | 'contextmap') name=ID
    '{'
        ('contains' boundedContexts += [BoundedContext:QualifiedName] ((",")? boundedContexts += [BoundedContext:QualifiedName])*)* // Cross-reference
        (relationships += Relationship ((",")? relationships += Relationship)*)*
    '}'
;

/**
 * Defines a map of Domains.
 *
 * Semantics:
 *   - Contains references to Domain nodes (cross-references).
 *   - Used for high-level domain mapping and visualization.
 *
 * Example:
 *   DomainMap Corporate {
 *     contains Sales, Support
 *   }
 */
DomainMap:
    ('DomainMap' | 'domainmap') name=ID
    '{'
        ('contains' domains += [Domain:QualifiedName] ((",")? domains += [Domain:QualifiedName])*)* // Cross-reference
    '}'
;

/**
 * Defines a relationship between two Bounded Contexts, with optional roles and type.
 *
 * Semantics:
 *   - Supports role annotations (e.g., [PL], [SK]) and relationship types (e.g., Partnership).
 *   - Roles appear BEFORE each context for clarity.
 *   - left and right are BoundedContextRef, which can be a reference or 'this'.
 *   - Supports both arrow and named relationship types.
 *
 * Examples:
 *   [PL] SalesContext <-> SupportContext : Partnership
 *   [PL, SK] SalesContext -> [ACL] SupportContext
 *   SalesContext U/D PaymentContext
 *
 * AST Impact:
 *   - Creates a `Relationship` node with roles, references, and type.
 */
Relationship:
    ('[' leftRoles+=RoleEnum (',' leftRoles+=RoleEnum)* ']')? 
    left=BoundedContextRef
    arrow=RelationshipArrow
    ('[' rightRoles+=RoleEnum (',' rightRoles+=RoleEnum)* ']')? 
    right=BoundedContextRef
    (':' type=RelationshipType)?
;

/**
 * Relationship arrows - supports both symbolic and named types.
 */
RelationshipArrow returns string:
    '<->' | '->' | '<-' | '><'
    | 'U/D' | 'u/d'  // UpstreamDownstream shorthand
    | 'C/S' | 'c/s'  // CustomerSupplier shorthand
;

/**
 * Enumerates possible roles in a relationship.
 *
 * Semantics:
 *   - Used to annotate relationships with DDD patterns (e.g., PL, SK, ACL).
 *   - Impacts relationship inference and validation.
 *
 * Example:
 *   [PL, SK] SalesContext <-> SupportContext
 */
RoleEnum returns string:
    'PL' | 'OHS' | 'CF' | 'ACL' | 'P' | 'SK' | 'BBoM'
;

/**
 * Enumerates possible relationship types.
 *
 * Semantics:
 *   - Used to specify the nature of a relationship (e.g., Partnership, SharedKernel).
 *   - Impacts code generation and diagramming.
 *
 * Example:
 *   SalesContext <-> SupportContext : Partnership
 */
RelationshipType returns string:
    'Partnership' | 'SharedKernel' | 'CustomerSupplier' | 'UpstreamDownstream' | 'SeparateWays'
;

/**
 * Abstracts over Decision, Policy, and BusinessRule for ubiquitous language.
 *
 * Semantics:
 *   - Enables documentation of decisions, policies, and rules in the model.
 *   - Supports optional categorization for better organization.
 *   - All types are interchangeable - use what reads best for your domain.
 *
 * Examples:
 *   decision UseMicroservices: "Adopt microservices for scalability"
 *   decision [architectural] UseMicroservices: "..."
 *   policy [business] RefundPolicy: "Refunds within 30 days"
 *   rule [compliance] DataRetention: "Keep data for 7 years"
 */
AbstractDecision: 
    Decision | 
    Policy | 
    BusinessRule
;

/**
 * Documents a decision in the model with optional category.
 */
Decision:
    ('decision' | 'Decision') 
    ('[' category=DecisionCategory ']')?
    name=ID Assignment value=STRING
;

/**
 * Documents a business policy with optional category.
 */
Policy:
    ('policy' | 'Policy') 
    ('[' category=DecisionCategory ']')?
    name=ID Assignment value=STRING
;

/**
 * Documents a business rule with optional category.
 */
BusinessRule:
    ('rule' | 'Rule') 
    ('[' category=DecisionCategory ']')?
    name=ID Assignment value=STRING
;

/**
 * Categories for decisions, policies, and rules.
 */
DecisionCategory returns string:
    'architectural' | 'arch'
    | 'business' | 'biz'
    | 'technical' | 'tech'
    | 'compliance'
    | 'security'
    | 'operational' | 'ops'
;

/**
 * Defines a term in the ubiquitous language with optional rich metadata.
 *
 * Semantics:
 *   - Used for terminology blocks in BoundedContext.
 *   - Associates a name with a meaning.
 *   - Supports synonyms and examples for richer glossaries.
 *
 * Examples:
 *   term Invoice: "A bill sent to a customer"
 *   term Order: "Customer purchase request"
 *       aka: PurchaseOrder, CustomerOrder
 *       examples: "Web order #12345", "Phone order"
 */
DomainTerm:
    ('term' | 'Term' | 'define') name=ID (Assignment meaning=STRING)?
    (('aka' | 'aka:' | 'synonyms' | 'synonyms:') synonyms+=ID (',' synonyms+=ID)*)?
    (('examples' | 'examples:' | 'e.g.' | 'e.g.:') examples+=STRING (',' examples+=STRING)*)?
;

/**
 * Assignment fragment for flexible assignment syntax.
 *
 * Semantics:
 *   - Allows use of ':', 'is', or '=' for assignments.
 *   - Not part of the AST; only for grammar readability.
 *
 * Example:
 *   description: "..."
 *   description is "..."
 *   description = "..."
 */
fragment Assignment returns string: 
    (':' | 'is' | '=')
;

/**
 * Qualified name for hierarchical namespacing.
 *
 * Semantics:
 *   - Supports FQN disambiguation and cross-package references.
 *   - Used for referencing elements across groups and packages.
 *
 * Example:
 *   acme.sales.Sales
 */
QualifiedName returns string:
    ID ('.' ID)*
;

/**
 * Reference to a BoundedContext, or 'this' for self-reference.
 *
 * Semantics:
 *   - Used in relationships to refer to the current or another context.
 *   - link is a cross-reference to a BoundedContext by qualified name.
 *
 * Example:
 *   [PL] this <-> SupportContext
 */
BoundedContextRef:
    {infer ThisRef} 'this' | link=[BoundedContext:QualifiedName]
;


hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_-]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

/**
 * Import statement supporting local files and git repositories.
 *
 * Modern git-native import system inspired by Go modules and Deno.
 *
 * Supported syntax:
 *   - Local files: import "./shared/types.dlang"
 *   - Workspace-relative: import "~/contexts/sales.dlang"
 *   - GitHub packages: import "owner/repo@v1.0.0"
 *   - Full git URLs: import "https://gitlab.com/owner/repo@v1.0.0"
 *   - With aliases: import "ddd-patterns/core@v2.1.0" as DDD
 *   - Named imports: import { OrderContext } from "./contexts.dlang"
 *
 * Repository imports:
 *   - Imports entire package (not individual files)
 *   - Version specified with @tag, @branch, or @commit
 *   - Package's main entry point (from dlang.toml) is loaded
 *   - Entry point exports public API symbols
 *
 * Examples:
 *   import "./shared/classifications.dlang"           // Local file
 *   import "~/domains/customer.dlang" as Customer    // Workspace file
 *   import "ddd-patterns/core@v2.1.0" as DDD         // GitHub package
 *   import "https://gitlab.com/company/models@v1.0" // GitLab package
 */
ImportStatement:
    'import' (
        // Named imports: import { Symbol1, Symbol2 } from "source"
        '{' symbols+=ID (',' symbols+=ID)* '}' 'from' uri=STRING
        // Simple import with optional alias: import "source" as Alias
        | uri=STRING ('as' alias=ID)?
        // Optional integrity hash for security (future)
        ('integrity' integrity=STRING)?
    )
;