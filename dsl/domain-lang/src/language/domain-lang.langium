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
//   7. Module System (Imports, Packages, Groups)
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

type Container = GroupDeclaration | Model | PackageDeclaration;

/**
 * Top-level elements that can appear in the model.
 * Unifies all major DDD constructs for flexible ordering.
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
    (/** A Domain represents a sphere of knowledge, influence, or activity. In DDD, it is the subject area to which the user applies a program. Example: Sales, Shipping, Accounting. */ 'Domain' | 'domain') name=ID ('in' parentDomain=[Domain:QualifiedName])?
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
    (/** A Bounded Context defines the boundary within which a particular domain model is defined and applicable. It is a central pattern in DDD for managing complexity. Example: SalesContext, SupportContext. */ 'BoundedContext' | 'boundedcontext' | 'BC' | 'Context') name=ID 
    ('for' domain=[Domain:QualifiedName])?
    (
        (('as' | 'tagged:') inlineRole=[Classification:QualifiedName])?
        (('by' | 'owner:') inlineTeam=[Team:QualifiedName])?
    )?
    ('{' documentation+=BoundedContextDocumentationBlock* '}')?
;

BoundedContextDocumentationBlock:
      {DescriptionBlock} 'description' Assignment description=STRING
    | {TeamBlock} (TeamAssignment | 'owner' | ('managed' 'by')) Assignment team=[Team:QualifiedName]
    | {RoleBlock} ('role' | ('domain' 'role')) Assignment roleClassifier=[Classification:QualifiedName]
    | {BusinessModelBlock} ('businessModel' | ('business' 'model')) Assignment businessModel=[Classification:QualifiedName]
    | {EvolutionBlock} ('evolution' | 'maturity') Assignment evolution=[Classification:QualifiedName]
    | {ClassifiersBlock} 'classifiers' '{'
        (RoleAssignment Assignment roleClassifier=[Classification:QualifiedName])?
        (BusinessModelAssignment Assignment businessModel=[Classification:QualifiedName])?
        (EvolutionAssignment Assignment evolution=[Classification:QualifiedName])?
      '}'
    | {RelationshipsBlock} ('relationships' | 'integrations' | 'connections') '{' (relationships += Relationship ((",")? relationships += Relationship)*)* '}'
    | {TerminologyBlock} ('terminology' | 'language' | 'glossary' | ('ubiquitous' 'language')) '{' (domainTerminology += DomainTerm (",")?)* '}'
    | {DecisionsBlock} ('decisions' | 'constraints' | 'rules' | 'policies') '{' (decisions += AbstractDecision (',')?)* '}'
;

/**
 * Context Group - Groups bounded contexts by strategic role or pattern.
 * Useful for organizing contexts by DDD patterns (Core, Supporting, Generic).
 */
ContextGroup:
    ('ContextGroup' | 'contextgroup') name=ID 
    (('for' | 'in') domain=[Domain:QualifiedName])?
    '{'
        ('role' Assignment roleClassifier=[Classification:QualifiedName])?
        (('contexts' | 'contains') contexts+=[+BoundedContext:QualifiedName] 
            (',' contexts+=[+BoundedContext:QualifiedName])*)?
    '}'
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
 * Examples: Core, Supporting, Generic, Strategic, Commodity.
 */
Classification:
    (/** A Classification is a reusable label for categorizing domains, contexts, or patterns (e.g., Core, Supporting, Generic). */ 'Classification' | 'classification') name=ID
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
    (':' type=RelationshipType)?
;

/**
 * Context reference - can be 'this' (self-reference) or a qualified name.
 */
BoundedContextRef:
    {infer ThisRef} 'this' | link=[BoundedContext:QualifiedName]
;

/**
 * Relationship arrows - symbolic and named types.
 */
RelationshipArrow returns string:
    '<->' | '->' | '<-' | '><'
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
    ('term' | 'Term' | 'define') name=ID (Assignment meaning=STRING)?
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
    ('[' category=DecisionCategory ']')?
    name=ID Assignment value=STRING
;

Policy:
    (/** A business rule or guideline that governs behavior within a context. */ 'policy' | 'Policy') 
    ('[' category=DecisionCategory ']')?
    name=ID Assignment value=STRING
;

BusinessRule:
    ('rule' | 'Rule') 
    ('[' category=DecisionCategory ']')?
    name=ID Assignment value=STRING
;

DecisionCategory returns string:
    'architectural' | 'arch'
    | 'business' | 'biz'
    | 'technical' | 'tech'
    | 'compliance'
    | 'security'
    | 'operational' | 'ops'
;

// ============================================================================
// SECTION 7: MODULE SYSTEM - IMPORTS, PACKAGES, GROUPS
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
    /** Imports types or groups from another file or module, enabling reuse and modularity. */ 'import' (
        '{' symbols+=ID (',' symbols+=ID)* '}' 'from' uri=STRING
        | uri=STRING ('as' alias=ID)?
        ('integrity' integrity=STRING)?
    )
;

/**
 * Package Declaration - Namespace isolation for large models.
 * Supports qualified name resolution across packages.
 */
PackageDeclaration:
    /** Package declarations organize large models into namespaces with qualified name resolution. */ 'package' name=QualifiedName '{'
        (children+=StructureElement)*
    '}'
;

/**
 * Group Declaration - Hierarchical grouping for namespacing and modularity.
 * Allows nesting of elements under a qualified name.
 */
GroupDeclaration:
    (/** A group is a namespace for organizing related elements and avoiding naming collisions. Groups can be nested and imported. */ 'Group' | 'group') name=QualifiedName '{'
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
    team?: @Team
}

interface RoleBlock {
    roleClassifier?: @Classification
}

interface BusinessModelBlock {
    businessModel?: @Classification
}

interface EvolutionBlock {
    evolution?: @Classification
}

interface ClassifiersBlock {
    roleClassifier?: @Classification
    businessModel?: @Classification
    evolution?: @Classification
}

interface RelationshipsBlock {
    relationships: Relationship[]
}

interface TerminologyBlock {
    domainTerminology: DomainTerm[]
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
terminal INT returns number: /[0-9]+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;