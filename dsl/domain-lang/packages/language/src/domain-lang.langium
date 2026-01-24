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
    Classification |
    Metadata
;

// ============================================================================
// SECTION 2: DDD STRATEGIC DESIGN - DOMAINS & BOUNDED CONTEXTS
// ============================================================================

/**
 * Domain - A sphere of knowledge or activity in DDD.
 * Can be nested via `in` to show subdomain hierarchy.
 * The `type` property indicates strategic importance (Core, Supporting, Generic) per Bounded Context Canvas.
 * Body is optional - allows header-only Domain definitions.
 */
Domain:
    (/** A Domain represents a sphere of knowledge, influence, or activity. In DDD, it is the subject area to which the user applies a program. Example: Sales, Shipping, Accounting. */ 'Domain' | 'dom') name=ID ('in' parent=[Domain:QualifiedName])?
    ('{'
        (
            ('description' Assignment description=STRING) |
            ('vision' Assignment vision=STRING) |
            ('type' Assignment type=[Classification:QualifiedName]) 
        )*
    '}')?
;

/**
 * Bounded Context - A boundary within which a domain model is defined.
 * Central pattern in DDD for managing complexity and team boundaries.
 * Belongs to exactly ONE domain (fundamental DDD principle).
 * Body properties can appear in any order. Validation enforces at-most-once constraint.
 * The `classification` property indicates strategic importance per Bounded Context Canvas.
 * The `evolution` property indicates maturity stage per Wardley Maps/BC Canvas.
 * The `archetype` property indicates behavioral role per DDD archetypes (Gateway, Execution, etc).
 */
BoundedContext:
    (/** A Bounded Context defines the boundary within which a particular domain model is defined and applicable. It is a central pattern in DDD for managing complexity. Example: SalesContext, SupportContext. */ 'BoundedContext' | 'bc') name=ID 
    ('for' domain=[Domain:QualifiedName])?
    (
        ('as' classification+=[Classification:QualifiedName])?
        ('by' team+=[Team:QualifiedName])?
    )?
    ('{' 
        (
            ('description' Assignment description=STRING) |
            ('classification' Assignment classification+=[Classification:QualifiedName]) |
            ('team' Assignment team+=[Team:QualifiedName]) |
            ('businessModel' Assignment businessModel=[Classification:QualifiedName]) |
            ('evolution' Assignment evolution=[Classification:QualifiedName]) |
            ('archetype' Assignment archetype=[Classification:QualifiedName]) |
            (('metadata' | 'meta') '{' (metadata+=MetadataEntry)* '}') |
            (('relationships' | 'integrations') '{' 
                (relationships += Relationship ((",")? relationships += Relationship)*)*
            '}') |
            (('terminology' | 'glossary') '{' 
                (terminology += DomainTerm (",")?)* 
            '}') |
            (('decisions' | 'rules') '{' 
                (decisions += AbstractDecision (',')?)* 
            '}')
        )*
    '}')?
;

MetadataEntry:
    key=[Metadata:QualifiedName] Assignment value=STRING
;


// ============================================================================
// SECTION 3: DDD TACTICAL DESIGN - TEAMS & CLASSIFICATIONS
// ============================================================================

/**
 * Team - People responsible for a Bounded Context or Domain.
 * Represents organizational boundaries in DDD.
 */
Team:
    (/** A Team represents the people responsible for a Bounded Context or Domain. */ 'Team') name=ID
;

/**
 * Classification - Reusable label for categorizing elements.
 * Examples: Core, Supporting, Generic, Strategic, Commodity, Architectural, Business, Technical.
 */
Classification:
    (/** A Classification is a reusable label for categorizing domains, contexts, patterns, and decisions (e.g., Core, Supporting, Generic, Architectural, Business, Technical). */ 'Classification') name=ID
;

/**
 * Metadata - Defines a key that can be used in metadata blocks.
 * Examples: Language, Framework, Database, Repository.
 * Can be defined locally or imported from stdlib.
 */
Metadata:
    (/** A Metadata defines a key that can be used in metadata blocks. Examples: Language, Framework, Database, Repository. Can be defined locally or imported from stdlib. */ 'Metadata') name=ID
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
    (/** A Context Map visualizes and documents the relationships between Bounded Contexts, including their integration patterns. */ 'ContextMap' | 'cmap') name=ID
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
    (/** A Domain Map visualizes and documents the relationships between Domains. */ 'DomainMap' | 'dmap') name=ID
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
    ('[' leftPatterns+=IntegrationPattern (',' leftPatterns+=IntegrationPattern)* ']')? 
    left=BoundedContextRef
    arrow=RelationshipArrow
    ('[' rightPatterns+=IntegrationPattern (',' rightPatterns+=IntegrationPattern)* ']')? 
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
;

/**
 * DDD Integration Patterns (used in relationships).
 */
IntegrationPattern returns string:
    'PL' | 'PublishedLanguage'       // Published Language
    | 'OHS' | 'OpenHostService'      // Open Host Service
    | 'CF' | 'Conformist'            // Conformist
    | 'ACL' | 'AntiCorruptionLayer'  // Anti-Corruption Layer
    | 'P' | 'Partnership'            // Partnership
    | 'SK' | 'SharedKernel'          // Shared Kernel
    | 'BBoM' | 'BigBallOfMud'        // Big Ball of Mud
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
    ('Term' | 'term') name=ID (Assignment meaning=STRING)?
    (('aka' | 'synonyms') Assignment? synonyms+=ID (',' synonyms+=ID)*)?
    (('examples') Assignment? examples+=STRING (',' examples+=STRING)*)?
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
    (/** A documented choice or rule that affects the model or process. */ 'Decision' | 'decision') 
    ('[' classification=[Classification:QualifiedName] ']')?
    name=ID Assignment value=STRING
;

Policy:
    (/** A business rule or guideline that governs behavior within a context. */ 'Policy' | 'policy') 
    ('[' classification=[Classification:QualifiedName] ']')?
    name=ID Assignment value=STRING
;

BusinessRule:
    (/** A business rule or guideline that governs behavior within a context. */ 'Rule' | 'rule') 
    ('[' classification=[Classification:QualifiedName] ']')?
    name=ID Assignment value=STRING
;

// ============================================================================
// SECTION 7: MODULE SYSTEM - IMPORTS & NAMESPACES
// ============================================================================

/**
 * Import Statement - Manifest-centric import system per PRS-010.
 * 
 * Simplified syntax where import statements use short specifiers:
 *   - External dependencies (from manifest): import "core" as Core
 *   - Local files: import "./shared/types.dlang"
 *   - Workspace-relative: import "~/contexts/sales.dlang"
 * 
 * All resolution details (source, version, integrity) live in model.yaml manifest.
 * Named imports and inline integrity checks have been removed per PRS-010.
 */
ImportStatement:
    /** Imports types or namespaces from another file or module, enabling reuse and modularity. */ ('Import' | 'import') uri=STRING ('as' alias=ID)?
;

/**
 * Namespace Declaration - Hierarchical namespacing for organizing models.
 * Combines package modularity with group-style nesting.
 */
NamespaceDeclaration:
    (/** Namespaces organize large models into hierarchical qualified names for symbol resolution. */ 'Namespace' | 'ns') name=QualifiedName '{'
        (children+=StructureElement)*
    '}'
;

// ============================================================================
// SECTION 8: METADATA INTERFACES (DOCUMENTATION BLOCKS) - REMOVED
// ============================================================================

// Documentation blocks have been replaced by direct properties

// ============================================================================
// SECTION 9: HELPER RULES & FRAGMENTS
// ============================================================================

/**
 * Assignment operators - flexible syntax.
 */
Assignment returns string: 
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