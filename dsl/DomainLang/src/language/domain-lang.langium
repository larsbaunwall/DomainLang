grammar DomainLang

entry Model: 
        (elements+=StructureElement)*
;

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
        (elements+=StructureElement)*
    '}'
;

ContextMap:
    'ContextMap' name=ID
    '{'
        ('contains' boundedContexts += [BoundedContext:QualifiedName] ("," boundedContexts += [BoundedContext:QualifiedName])*)*
    '}'
;

BoundedContext:
    'BoundedContext' name=ID ('in' (domain=[Domain:QualifiedName]))?
    '{'
        ('description' ('is')? description=STRING)?
        ('classifiers' '{'
            ('role' ('is')? roleClassifier=[Role])?
            ('domain' ('is')? domainClassifier=[Classification])?
            ('businessModel' ('is')? businessModel=[Classification])?
            ('evolution' ('is')? evolution=[Classification])?
        '}')?
        ('terminology' '{' 
            domainTerminology += DomainTerm ("," domainTerminology += DomainTerm)* 
        '}')?
        ('decisions' '{' 
            decisions += AbstractDecision
        '}')?
    '}'
;

Domain:
    'Domain' name=ID ('partof' parentDomain=[Domain:QualifiedName])?
    '{'
        ('description' ('is')? description=STRING)?
        ('classifier' ('is')? classifier=[Classification])?
    '}'
;

/*
Classifications
*/
Classification:
    'Classification' name=ID
;

Role:
    'Role' name=ID
;

/* 
Ubiquitous language definitions
*/
AbstractDecision: 
    Decision | 
    Policy | 
    BusinessRule;

Decision:
    'decision' name=ID 'where' value=STRING
;
Policy:
    'policy' name=ID 'where' value=STRING
;
BusinessRule:
    'rule' name=ID 'where' value=STRING
;

DomainTerm:
    'term' name=ID ('means' meaning=STRING)
;

QualifiedName returns string:
    ID ('.' ID)*
;

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
