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

StructureElement: 
    Type |
    ObjectMap
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
 *   - Can reference a Domain via `implements` (cross-reference).
 *   - Documentation blocks provide metadata, relationships, classifiers, terminology, and decisions.
 *
 * Example:
 *   BoundedContext SalesContext implements Sales {
 *     description: "Handles sales workflows."
 *     team: SalesTeam
 *     relationships { ... }
 *     classifiers { ... }
 *     terminology { ... }
 *     decisions { ... }
 *   }
 *
 * AST Impact:
 *   - Creates a `BoundedContext` node with documentation and domain reference.
 */
BoundedContext:
    ('BoundedContext' | 'boundedcontext') name=ID ('implements' (domain=[Domain:QualifiedName]))? // Cross-reference
    '{'
        documentation+=BoundedContextDocumentationBlock*
    '}'
;

/**
 * Documentation blocks for BoundedContext. See validation for semantic checks.
 */
BoundedContextDocumentationBlock:
      {DescriptionBlock} 'description' Assignment description=STRING
    | {TeamBlock} TeamAssignment Assignment team=[Team:QualifiedName] // Cross-reference
    | {RelationshipsBlock} 'relationships' '{' (relationships += Relationship ((",")? relationships += Relationship)*)* '}'
    | {ClassifiersBlock} 'classifiers' '{'
        (RoleAssignment Assignment roleClassifier=[Classification:QualifiedName])?
        (BusinessModelAssignment Assignment businessModel=[Classification:QualifiedName])?
        (EvolutionAssignment Assignment evolution=[Classification:QualifiedName])?
      '}'
    | {TerminologyBlock} 'terminology' '{' (domainTerminology += DomainTerm (",")?)* '}'
    | {DecisionsBlock} 'decisions' '{' (decisions += AbstractDecision (',')?)* '}'
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
 *   - left and right are BoundedContextRef, which can be a reference or 'this'.
 *   - Used in ContextMap and relationships blocks.
 *
 * Example:
 *   [PL] SalesContext <-> SupportContext : Partnership
 *
 * AST Impact:
 *   - Creates a `Relationship` node with roles, references, and type.
 */
Relationship:
    ( '[' leftRoles+=RoleEnum (',' leftRoles+=RoleEnum)* ']' )? left=BoundedContextRef ( '[' leftRoles+=RoleEnum (',' leftRoles+=RoleEnum)* ']' )?
    arrow=('<->' | '->' | '<-' | '><')
    ( '[' leftRoles+=RoleEnum (',' leftRoles+=RoleEnum)* ']' )? right=BoundedContextRef ( '[' rightRoles+=RoleEnum (',' rightRoles+=RoleEnum)* ']' )?
    (':' type=RelationshipType)?
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
 *   - Used in decisions blocks in BoundedContext.
 */
AbstractDecision: 
    Decision | 
    Policy | 
    BusinessRule
;

/**
 * Documents a decision in the model.
 *
 * Semantics:
 *   - Used for traceability and documentation.
 *
 * Example:
 *   decision UseMicroservices: "Adopt microservices for scalability."
 */
Decision:
    ('decision' | 'Decision') name=ID Assignment value=STRING
;
/**
 * Documents a business policy.
 *
 * Example:
 *   policy RefundPolicy: "Refunds allowed within 30 days."
 */
Policy:
    ('policy' | 'Policy') name=ID Assignment value=STRING
;
/**
 * Documents a business rule.
 *
 * Example:
 *   rule UniqueOrderID: "Order IDs must be unique."
 */
BusinessRule:
    ('rule' | 'Rule') name=ID Assignment value=STRING
;

/**
 * Defines a term in the ubiquitous language.
 *
 * Semantics:
 *   - Used for terminology blocks in BoundedContext.
 *   - Associates a name with a meaning.
 *
 * Example:
 *   term Invoice: "A bill sent to a customer."
 */
DomainTerm:
    ('term' | 'Term') name=ID (Assignment meaning=STRING)
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

/**
 * Import statement for external models.
 *
 * Semantics:
 *   - Allows importing models from external sources.
 *   - Supports aliasing for clarity.
 * 
 * Example:
 *   import "github.com/acme/ddd/types.dlang"
 *   import "./local-types.dlang" as local
 */
ImportStatement:
    'import' uri=STRING ('as' alias=ID)?
;

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_-]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;