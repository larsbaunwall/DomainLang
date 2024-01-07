grammar DomainLang

entry Model: 
        (children+=StructureElement)*
;

type Container = PackageDeclaration | Model;

StructureElement: 
    Type |
    PackageDeclaration
;

Type:
    ContextMap | 
    BoundedContext | 
    Domain | 
    Role |
    Classification
;

PackageDeclaration:
    'package' name=QualifiedName '{'
        (children+=StructureElement)*
    '}'
;

ContextMap:
    'ContextMap' name=ID
    '{'
        ('contains' boundedContexts += [BoundedContext:QualifiedName] ((",")? boundedContexts += [BoundedContext:QualifiedName])*)*
    '}'
;

BoundedContext:
    'BoundedContext' name=ID ('implements' (domain=[Domain:QualifiedName]))?
    '{'
        ('description'Assignment description=STRING)?
        ('relationships' '{' 
            relationships += Relationship ((",")? relationships += Relationship)*
        '}')?
        ('classifiers' '{'
            ('role' Assignment roleClassifier=[Role])?
            ('domain' Assignment domainClassifier=[Classification])?
            ('businessModel' Assignment businessModel=[Classification])?
            ('evolution' Assignment evolution=[Classification])?
        '}')?
        ('terminology' '{' 
            (domainTerminology += DomainTerm (",")?)* 
        '}')?
        ('decisions' '{' 
            (decisions += AbstractDecision (',')?)*
        '}')?
    '}'
;

Domain:
    'Domain' name=ID ('partof' parentDomain=[Domain:QualifiedName])?
    '{'
        ('vision' Assignment vision=STRING)?
        ('classifier' Assignment classifier=[Classification])?
    '}'
;

fragment Assignment returns string: (':' | 'is');

/*
Classifications
*/
Classification:
    'Classification' name=ID
;

Role:
    'Role' name=ID
;

Relationship:
    Acl | Conformist | UpstreamDownstream;

UpstreamDownstream:
    'upstream' 'for' downstream=[BoundedContext:QualifiedName] | 'downstream' 'for' upstream=[BoundedContext:QualifiedName];

Acl: 'ACL' name='ACL';
Conformist: 'CF' name='CF';

/* 
Ubiquitous language definitions
*/
AbstractDecision: 
    Decision | 
    Policy | 
    BusinessRule;

Decision:
    'decision' name=ID Assignment value=STRING
;
Policy:
    'policy' name=ID Assignment value=STRING
;
BusinessRule:
    'rule' name=ID Assignment value=STRING
;

DomainTerm:
    'term' name=ID (Assignment meaning=STRING)
;

QualifiedName returns string:
    ID ('.' ID)*
;

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_-]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
