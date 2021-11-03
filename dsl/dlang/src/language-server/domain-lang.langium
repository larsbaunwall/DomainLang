grammar DomainLang
hidden(WS, SL_COMMENT, ML_COMMENT)

DomainLang: (
        (fileComment=SL_COMMENT | fileComment=ML_COMMENT)?
        (imports+=Import)*
        (definitions+=StructureElement)*
    )
;

Import:
    'import' importURI=STRING;

StructureElement: 
    ContextMapRule | 
    BoundedContextRule | 
    DomainRule | 
    RoleRule |
    AbstractDecisionRule;

ContextMapRule:
    (comment=SL_COMMENT | comment=ML_COMMENT)?
    'ContextMap' name=ID
    '{'
        ('contains' boundedContexts += [BoundedContextRule] ("," boundedContexts += [BoundedContextRule])*)*
    '}'
;

BoundedContextRule:
    (comment=SL_COMMENT | comment=ML_COMMENT)?
    'BoundedContext' name=ID ('in' (inDomain+=[DomainRule]) ("," inDomain+=[DomainRule])*)?
    '{'
        ('description' ('is')? description=STRING)?
        ('classifiers' '{'
            ('role' ('is')? roleClassifier=[RoleRule])?
            ('domain' ('is')? domainClassifier=[ClassificationRule])?
            ('business' ('is')? businessModel=[ClassificationRule])?
            ('evolution' ('is')? evolution=[ClassificationRule])?
        '}')?
        ('terminology' '{' 
            domainTerminology += DomainTerm ("," domainTerminology += DomainTerm)* 
        '}')?
        ('decisions' '{' 
            decisions += AbstractDecisionRule ("," decisions += AbstractDecisionRule)* 
        '}')?
    '}'
;

DomainRule:
    (comment=SL_COMMENT | comment=ML_COMMENT)?
    'Domain' name=ID ('partof' parentDomain=[DomainRule])?
    '{'
        ('description' ('is')? description=STRING)?
        ('classifier' ('is')? classifier=[ClassificationRule])?
    '}'
;

/*
Classifications
*/
ClassificationRule:
    (comment=SL_COMMENT | comment=ML_COMMENT)?
    'Classification' name=ID
;

RoleRule:
    (comment=SL_COMMENT | comment=ML_COMMENT)?
    'Role' name=ID
;


/* 
Ubiquitous language definitions
*/
AbstractDecisionRule:
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



terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"[^"]*"|'[^']*'/;

terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
terminal SL_COMMENT: /\/\/[^\n\r]*/;