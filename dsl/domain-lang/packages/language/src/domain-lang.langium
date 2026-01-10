// ============================================================================
// DomainLang Grammar - Domain-Driven Design Specification Language
// ============================================================================
// Copyright (c) 2025, Lars Baunwall. All rights reserved.
//
// A Langium-based DSL for modeling DDD architectures with diagrams-as-code.
// Inspired by ContextMapper DSL with first-class IDE support.
//
// Organization:
//   1. Entry Point & Model Structure
//   2. DDD Strategic Design (Domains, Bounded Contexts)
//   3. DDD Tactical Design (Teams, Classifications)
//   4. Architecture Mapping (Context Maps, Domain Maps)
//   5. Relationships & Integration Patterns
//   6. Documentation & Governance (Decisions, Terminology)
//   7. Module System (Imports & Namespaces)
//   8. Terminals & Lexical Grammar
// ============================================================================

grammar DomainLang

// ============================================================================
// SECTION 1: ENTRY POINT & MODEL STRUCTURE
// ============================================================================

/**
 * Root AST node - aggregates all top-level DDD elements.
 * Produces the entry point for parsing .dlang files.
 */
entry Model: 
    imports+=ImportStatement*
    (children+=StructureElement)*
;

type Container = NamespaceDeclaration | Model;

/**
 * Top-level elements that can appear in the model.
 * Unifies all major DDD constructs for flexible ordering.
 */
StructureElement: 
    Type |
    ObjectMap |
    NamespaceDeclaration
;

/**
 * Union of all main DDD type constructs.
 */
Type:
    Domain | 
    BoundedContext | 
    Team |
    Classification
;

// ============================================================================
// SECTION 2: DDD STRATEGIC DESIGN - DOMAINS & BOUNDED CONTEXTS
// ============================================================================

/**
 * Domain - A sphere of knowledge or activity in DDD.
 * Can be nested via `in` to show subdomain hierarchy.
 * Use `classifier` to indicate Core, Supporting, or Generic.
 */
Domain:
    (/** A Domain represents a sphere of knowledge, influence, or activity. In DDD, it is the subject area to which the user applies a program. Example: Sales, Shipping, Accounting. */ 'Domain' | 'domain') name=ID ('in' parent=[Domain:QualifiedName])?
    '{'
        documentation+=DomainDocumentationBlock*
    '}'
;

DomainDocumentationBlock:
      {DescriptionBlock} 'description' Assignment description=STRING
    | {VisionBlock} 'vision' Assignment vision=STRING
    | {ClassifierBlock} 'classifier' Assignment classifier=[Classification]
;

/**
 * Bounded Context - A boundary within which a domain model is defined.
 * Central pattern in DDD for managing complexity and team boundaries.
 * Belongs to exactly ONE domain (fundamental DDD principle).
 */
BoundedContext:
    (/** A Bounded Context defines the boundary within which a particular domain model is defined and applicable. It is a central pattern in DDD for managing complexity. Example: SalesContext, SupportContext. */ 'BoundedContext' | 'boundedcontext' | 'BC') name=ID 
    ('for' domain=[Domain:QualifiedName])?
    (
        ('as' role=[Classification:QualifiedName])?
        ('by' team=[Team:QualifiedName])?
    )?
    ('{' documentation+=BoundedContextDocumentationBlock* '}')?
;

BoundedContextDocumentationBlock:
      {DescriptionBlock} 'description' Assignment description=STRING
    | {TeamBlock} TeamAssignment Assignment owner=[Team:QualifiedName]
    | {RoleBlock} 'role' Assignment role=[Classification:QualifiedName]
    | {BusinessModelBlock} ('businessModel' | ('business' 'model')) Assignment businessModel=[Classification:QualifiedName]
    | {EvolutionBlock} ('evolution' | 'maturity') Assignment evolution=[Classification:QualifiedName]
    | {ClassifiersBlock} 'classifiers' '{'
        (RoleAssignment Assignment role=[Classification:QualifiedName])?
        (BusinessModelAssignment Assignment businessModel=[Classification:QualifiedName])?
        (EvolutionAssignment Assignment evolution=[Classification:QualifiedName])?
      '}'
    | {RelationshipsBlock} ('relationships' | 'integrations' | 'connections') '{' (relationships += Relationship ((",")? relationships += Relationship)*)* '}'
    | {TerminologyBlock} ('terminology' | 'language' | 'glossary' | ('ubiquitous' 'language')) '{' (terms += DomainTerm (",")?)* '}'
    | {DecisionsBlock} ('decisions' | 'constraints' | 'rules' | 'policies') '{' (decisions += AbstractDecision (',')?)* '}'
;

// ============================================================================
// SECTION 3: DDD TACTICAL DESIGN - TEAMS & CLASSIFICATIONS
// ============================================================================

/**
 * Team - People responsible for a Bounded Context or Domain.
 * Represents organizational boundaries in DDD.
 */
Team:
    (/** A Team represents the people responsible for a Bounded Context or Domain. */ 'Team' | 'team') name=ID
;

/**
 * Classification - Reusable label for categorizing elements.
 * Examples: Core, Supporting, Generic, Strategic, Commodity, Architectural, Business, Technical.
 */
Classification:
    (/** A Classification is a reusable label for categorizing domains, contexts, patterns, and decisions (e.g., Core, Supporting, Generic, Architectural, Business, Technical). */ 'Classification' | 'classification') name=ID
;

// ============================================================================
// SECTION 4: ARCHITECTURE MAPPING - CONTEXT MAPS & DOMAIN MAPS
// ============================================================================

/**
 * Union of mapping constructs for visualizing architecture.
 */
ObjectMap: 
    ContextMap | 
    DomainMap
;

/**
 * Context Map - Visualizes relationships between Bounded Contexts.
 * Shows integration patterns and team interactions.
 */
ContextMap:
    (/** A Context Map visualizes and documents the relationships between Bounded Contexts, including their integration patterns. */ 'ContextMap' | 'contextmap') name=ID
    '{'
        ('contains' boundedContexts += [+BoundedContext:QualifiedName] ((",")? boundedContexts += [+BoundedContext:QualifiedName])*)*
        (relationships += Relationship ((",")? relationships += Relationship)*)*
    '}'
;

/**
 * Domain Map - Visualizes relationships between Domains.
 * Shows high-level domain organization and subdomain structure.
 */
DomainMap:
    (/** A Domain Map visualizes and documents the relationships between Domains. */ 'DomainMap' | 'domainmap') name=ID
    '{'
        ('contains' domains += [+Domain:QualifiedName] ((",")? domains += [+Domain:QualifiedName])*)*
    '}'
;

// ============================================================================
// SECTION 5: RELATIONSHIPS & INTEGRATION PATTERNS
// ============================================================================

/**
 * Relationship - Connection between two Bounded Contexts.
 * Supports DDD integration patterns (ACL, OHS, PL, etc.) and relationship types.
 */
Relationship:
    ('[' leftRoles+=RoleEnum (',' leftRoles+=RoleEnum)* ']')? 
    left=BoundedContextRef
    arrow=RelationshipArrow
    ('[' rightRoles+=RoleEnum (',' rightRoles+=RoleEnum)* ']')? 
    right=BoundedContextRef
    (Assignment type=RelationshipType)?
;

/**
 * Context reference - can be 'this' (self-reference) or a qualified name.
 */
BoundedContextRef:
    {infer ThisRef} 'this' | link=[BoundedContext:QualifiedName]
;

/**
 * Relationship arrows - symbolic and named types.
 * 
 * Arrow semantics:
 *   ->   Upstream to downstream (left provides, right consumes)
 *   <-   Downstream to upstream (right provides, left consumes)
 *   <->  Bidirectional/Partnership (mutual dependency)
 *   ><   Separate Ways (no integration, teams go their own way)
 */
RelationshipArrow returns string:
    '<->' | '->' | '<-' | '><'  // Separate Ways
    | 'U/D' | 'u/d'  // UpstreamDownstream
    | 'C/S' | 'c/s'  // CustomerSupplier
;

/**
 * DDD Integration Patterns (roles in relationships).
 */
RoleEnum returns string:
    'PL'    // Published Language
    | 'OHS' // Open Host Service
    | 'CF'  // Conformist
    | 'ACL' // Anti-Corruption Layer
    | 'P'   // Partnership
    | 'SK'  // Shared Kernel
    | 'BBoM' // Big Ball of Mud
;

/**
 * DDD Relationship Types.
 */
RelationshipType returns string:
    'Partnership' 
    | 'SharedKernel' 
    | 'CustomerSupplier' 
    | 'UpstreamDownstream' 
    | 'SeparateWays'
;

// ============================================================================
// SECTION 6: DOCUMENTATION & GOVERNANCE
// ============================================================================

/**
 * Domain Terminology - Ubiquitous language terms with definitions.
 * Supports synonyms and examples for richer glossaries.
 */
DomainTerm:
    ('term' | 'Term') name=ID (Assignment meaning=STRING)?
    (('aka' | 'aka:' | 'synonyms' | 'synonyms:') synonyms+=ID (',' synonyms+=ID)*)?
    (('examples' | 'examples:' | 'e.g.' | 'e.g.:') examples+=STRING (',' examples+=STRING)*)?
;

/**
 * Decisions, Policies, and Business Rules.
 * All types are interchangeable - use what reads best for your domain.
 */
AbstractDecision: 
    Decision | 
    Policy | 
    BusinessRule
;

Decision:
    (/** A documented choice or rule that affects the model or process. */ 'decision' | 'Decision') 
    ('[' classification=[Classification:QualifiedName] ']')?
    name=ID Assignment value=STRING
;

Policy:
    (/** A business rule or guideline that governs behavior within a context. */ 'policy' | 'Policy') 
    ('[' classification=[Classification:QualifiedName] ']')?
    name=ID Assignment value=STRING
;

BusinessRule:
    ('rule' | 'Rule') 
    ('[' classification=[Classification:QualifiedName] ']')?
    name=ID Assignment value=STRING
;

// ============================================================================
// SECTION 7: MODULE SYSTEM - IMPORTS & NAMESPACES
// ============================================================================

/**
 * Import Statement - Git-native import system inspired by Go modules and Deno.
 * 
 * Supported formats:
 *   - Local files: import "./shared/types.dlang"
 *   - Workspace-relative: import "~/contexts/sales.dlang"
 *   - GitHub packages: import "owner/repo@v1.0.0"
 *   - GitLab/Git URLs: import "https://gitlab.com/owner/repo@v1.0.0"
 *   - With aliases: import "ddd-patterns/core@v2.1.0" as DDD
 *   - Named imports: import { OrderContext } from "./contexts.dlang"
 */
ImportStatement:
    /** Imports types or namespaces from another file or module, enabling reuse and modularity. */ 'import' (
        '{' symbols+=ID (',' symbols+=ID)* '}' 'from' uri=STRING
        | uri=STRING
        ('integrity' integrity=STRING)?
        ('as' alias=ID)?
    )
;

/**
 * Namespace Declaration - Hierarchical namespacing for organizing models.
 * Combines package modularity with group-style nesting.
 */
NamespaceDeclaration:
    (/** Namespaces organize large models into hierarchical qualified names for symbol resolution. */ 'namespace' | 'Namespace') name=QualifiedName '{'
        (children+=StructureElement)*
    '}'
;

// ============================================================================
// SECTION 8: METADATA INTERFACES (DOCUMENTATION BLOCKS)
// ============================================================================

/**
 * Interfaces for attaching rich metadata to elements.
 * Used for description, vision, classifiers, teams, relationships, etc.
 */

interface DescriptionBlock {
    description: string
}

interface VisionBlock {
    vision: string
}

interface ClassifierBlock {
    classifier?: @Classification
}

interface TeamBlock {
    owner?: @Team
}

interface RoleBlock {
    role?: @Classification
}

interface BusinessModelBlock {
    businessModel?: @Classification
}

interface EvolutionBlock {
    evolution?: @Classification
}

interface ClassifiersBlock {
    role?: @Classification
    businessModel?: @Classification
    evolution?: @Classification
}

interface RelationshipsBlock {
    relationships: Relationship[]
}

interface TerminologyBlock {
    terms: DomainTerm[]
}

interface DecisionsBlock {
    decisions: AbstractDecision[]
}

// ============================================================================
// SECTION 9: HELPER RULES & FRAGMENTS
// ============================================================================

/**
 * Assignment fragments for classifier and team blocks.
 */
fragment RoleAssignment returns string: 'role';
fragment BusinessModelAssignment returns string: 'businessModel';
fragment EvolutionAssignment returns string: 'evolution';
fragment TeamAssignment returns string: 'team';

/**
 * Assignment operators - flexible syntax.
 */
fragment Assignment returns string: 
    (':' | 'is' | '=')
;

/**
 * Qualified Name - Hierarchical namespacing with dots.
 */
QualifiedName returns string:
    ID ('.' ID)*
;

// ============================================================================
// SECTION 10: TERMINALS & LEXICAL GRAMMAR
// ============================================================================

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_-]*/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;