grammar DomainLang

// === Entry Point ===
entry Model: 
    (children+=StructureElement)*
;

type Container = PackageDeclaration | Model;

// === Core Structure ===
StructureElement: 
    Type |
    ObjectMap |
    PackageDeclaration
;

Type:
    BoundedContext | 
    Domain | 
    Role |
    Team |
    Classification
;

PackageDeclaration:
    'package' name=QualifiedName '{'
        (children+=StructureElement)*
    '}'
;

// === Domain Concepts ===
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
interface RelationshipsBlock {
    relationships: Relationship[]
}
interface ClassifiersBlock {
    roleClassifier?: @Role
    businessModel?: @Classification
    evolution?: @Classification
}
interface TerminologyBlock {
    domainTerminology: DomainTerm[]
}
interface DecisionsBlock {
    decisions: AbstractDecision[]
}

Domain:
    ('Domain' | 'domain') name=ID ('in' parentDomain=[Domain:QualifiedName])?
    '{'
        documentation+=DomainDocumentationBlock*
    '}'
;

DomainDocumentationBlock:
      {DescriptionBlock} 'description' Assignment description=STRING
    | {VisionBlock} 'vision' Assignment vision=STRING
    | {ClassifierBlock} 'classifier' Assignment classifier=[Classification]
;

BoundedContext:
    ('BoundedContext' | 'boundedcontext') name=ID ('implements' (domain=[Domain:QualifiedName]))?
    '{'
        documentation+=BoundedContextDocumentationBlock*
    '}'
;

BoundedContextDocumentationBlock:
      {DescriptionBlock} 'description' Assignment description=STRING
    | {TeamBlock} TeamAssignment Assignment team=[Team:QualifiedName]
    | {RelationshipsBlock} 'relationships' '{' (relationships += Relationship ((",")? relationships += Relationship)*)* '}'
    | {ClassifiersBlock} 'classifiers' '{'
        (RoleAssignment Assignment roleClassifier=[Role:QualifiedName])?
        (BusinessModelAssignment Assignment businessModel=[Classification:QualifiedName])?
        (EvolutionAssignment Assignment evolution=[Classification:QualifiedName])?
      '}'
    | {TerminologyBlock} 'terminology' '{' (domainTerminology += DomainTerm (",")?)* '}'
    | {DecisionsBlock} 'decisions' '{' (decisions += AbstractDecision (',')?)* '}'
;

fragment RoleAssignment returns string: 'role';
fragment BusinessModelAssignment returns string: 'businessModel';
fragment EvolutionAssignment returns string: 'evolution';
fragment TeamAssignment returns string: 'team';

Classification:
    ('Classification' | 'classification') name=ID
;

Role:
    ('Role' | 'role') name=ID
;

Team: 
    ('Team' | 'team') name=ID
;

// === Maps ===
ObjectMap: 
    ContextMap | 
    DomainMap
;

ContextMap:
    ('ContextMap' | 'contextmap') name=ID
    '{'
        ('contains' boundedContexts += [BoundedContext:QualifiedName] ((",")? boundedContexts += [BoundedContext:QualifiedName])*)*
        (relationships += Relationship ((",")? relationships += Relationship)*)*
    '}'
;

DomainMap:
    ('DomainMap' | 'domainmap') name=ID
    '{'
        ('contains' domains += [Domain:QualifiedName] ((",")? domains += [Domain:QualifiedName])*)*
    '}'
;

// === Relationships ===
Relationship:
    ( '[' leftRoles+=RoleEnum (',' leftRoles+=RoleEnum)* ']' )? left=BoundedContextRef ( '[' leftRoles+=RoleEnum (',' leftRoles+=RoleEnum)* ']' )?
    arrow=('<->' | '->' | '<-' | '><')
    ( '[' leftRoles+=RoleEnum (',' leftRoles+=RoleEnum)* ']' )? right=BoundedContextRef ( '[' rightRoles+=RoleEnum (',' rightRoles+=RoleEnum)* ']' )?
    (':' type=RelationshipType)?
;

RoleEnum returns string:
    'PL' | 'OHS' | 'CF' | 'ACL' | 'P' | 'SK' | 'BBoM'
;

RelationshipType returns string:
    'Partnership' | 'SharedKernel' | 'CustomerSupplier' | 'UpstreamDownstream' | 'SeparateWays'
;

// === Ubiquitous Language Definitions ===
AbstractDecision: 
    Decision | 
    Policy | 
    BusinessRule
;

Decision:
    ('decision' | 'Decision') name=ID Assignment value=STRING
;
Policy:
    ('policy' | 'Policy') name=ID Assignment value=STRING
;
BusinessRule:
    ('rule' | 'Rule') name=ID Assignment value=STRING
;

DomainTerm:
    ('term' | 'Term') name=ID (Assignment meaning=STRING)
;

// === Fragments and Data Types ===
fragment Assignment returns string: 
    (':' | 'is' | '=')
;

QualifiedName returns string:
    ID ('.' ID)*
;

BoundedContextRef:
    {infer ThisRef} 'this' | link=[BoundedContext:QualifiedName]
;

// === Terminals ===
hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_-]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

