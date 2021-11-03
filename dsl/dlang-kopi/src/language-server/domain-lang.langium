grammar DomainLang hidden(WS, SL_COMMENT, ML_COMMENT)

terminal WS: /\s+/;
terminal ID returns string: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"[^"]*"|'[^']*'/;

terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
terminal SL_COMMENT: /\/\/[^\n\r]*/;

DomainLang: (
        (fileComment=SL_COMMENT | fileComment=ML_COMMENT)?
        /*(imports+=Import)**/
        (definitions+=StructureElement)*
        /*
        (boundedContexts+=BoundedContext)*
        (domains+=Domain)*
        (contextMaps+=ContextMap)*
        (roles+=Role)*
        */
    )
;

/*
Import:
    'import' importURI=STRING;
*/

StructureElement: 
    ContextMap | 
    BoundedContext | 
    Domain | 
    Role |
    AbstractDecision;

ContextMap:
    (comment=SL_COMMENT | comment=ML_COMMENT)?
    'ContextMap' name=ID
    '{'
        ('contains' boundedContexts += [BoundedContext] ("," boundedContexts += [BoundedContext])*)*
    '}'
;

BoundedContext:
    (comment=SL_COMMENT | comment=ML_COMMENT)?
    'BoundedContext' name=ID ('in' (inDomain+=[Domain]) ("," inDomain+=[Domain])*)?
    '{'
        ('description' ('is')? description=STRING)?
        ('classifiers' '{'
            ('role' ('is')? roleClassifier=[Role])?
            ('domainClassifier' ('is')? domainClassifier=[Classification])?
            ('businessModel' ('is')? businessModel=[Classification])?
            ('evolution' ('is')? evolution=[Classification])?
        '}')?
        ('terminology' '{' 
            domainTerminology += DomainTerm ("," domainTerminology += DomainTerm)* 
        '}')?
        ('decisions' '{' 
            decisions += AbstractDecision ("," decisions += AbstractDecision)* 
        '}')?
    '}'
;

Domain:
    (comment=SL_COMMENT | comment=ML_COMMENT)?
    'Domain' name=ID ('partof' parentDomain=[Domain])?
    '{'
        ('description' ('is')? description=STRING)?
        ('classifier' ('is')? classifier=[Classification])?
    '}'
;

/*
Classifications
*/
Classification:
    (comment=SL_COMMENT | comment=ML_COMMENT)?
    'Classification' name=ID
;

Role:
    (comment=SL_COMMENT | comment=ML_COMMENT)?
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