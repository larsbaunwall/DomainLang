grammar DomainLang

entry Model: 
        (children+=StructureElement)*
;

type Container = PackageDeclaration | Model;

StructureElement: 
    Type |
    ObjectMap |
    PackageDeclaration
;

ObjectMap: 
    ContextMap | 
    DomainMap
;

Type:
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
        (relationships += Relationship ((",")? relationships += Relationship)*)*
    '}'
;

DomainMap:
    ('DomainMap' | 'domainmap') name=ID
    '{'
        ('contains' domains += [Domain:QualifiedName] ((",")? domains += [Domain:QualifiedName])*)*
    '}'
;

/*
A Bounded Context is the logical encapsulation of a Domain Model
*/
BoundedContext:
    'BoundedContext' name=ID ('implements' (domain=[Domain:QualifiedName]))?
    '{'
        ('description' Assignment description=STRING)?
        ('team' Assignment description=STRING)?
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
    ('Domain' | 'domain') name=ID ('in' parentDomain=[Domain:QualifiedName])?
    '{'
        ('vision' Assignment vision=STRING)?
        ('classifier' Assignment classifier=[Classification])?
    '}'
;

Team: 
    'Team' name=ID;

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

/*
Relationships
*/

Relationship:
	SymmetricRelationship | UpstreamDownstreamRelationship
;

SymmetricRelationship:
	Partnership | SharedKernel
;

Partnership:
	(
		(participant1 = [BoundedContext:QualifiedName] '[''P'']' '<->' '[''P'']' participant2 = [BoundedContext:QualifiedName]) |
		('[''P'']' participant1 = [BoundedContext:QualifiedName] '<->' '[''P'']' participant2 = [BoundedContext:QualifiedName]) |
		(participant1 = [BoundedContext:QualifiedName] '[''P'']' '<->' participant2 = [BoundedContext:QualifiedName] '[''P'']') |
		('[''P'']' participant1 = [BoundedContext:QualifiedName] '<->' participant2 = [BoundedContext:QualifiedName] '[''P'']') |
		(participant1 = [BoundedContext:QualifiedName] 'Partnership' participant2 = [BoundedContext:QualifiedName])
	)
;

SharedKernel:
	(
		(participant1 = [BoundedContext:QualifiedName] '[''SK'']' '<->' '[''SK'']' participant2 = [BoundedContext:QualifiedName]) |
		('[''SK'']' participant1 = [BoundedContext:QualifiedName] '<->' '[''SK'']' participant2 = [BoundedContext:QualifiedName]) |
		(participant1 = [BoundedContext:QualifiedName] '[''SK'']' '<->' participant2 = [BoundedContext:QualifiedName] '[''SK'']') |
		('[''SK'']' participant1 = [BoundedContext:QualifiedName] '<->' participant2 = [BoundedContext:QualifiedName] '[''SK'']') |
		(participant1 = [BoundedContext:QualifiedName] 'Shared-Kernel' participant2 = [BoundedContext:QualifiedName]) |
		(participant1 = [BoundedContext:QualifiedName] '<->' participant2 = [BoundedContext:QualifiedName])
	)
;


UpstreamDownstreamRelationship:
	CustomerSupplierRelationship |
	(
        (upstream = [BoundedContext:QualifiedName] ('[' ('U' | (('U,')?(upstreamRoles+=UpstreamRole (',')?)*)) ']') '->' ('[''D'']' | '['('D'',')?(downstreamRoles+=DownstreamRole (',')?)*']') downstream = [BoundedContext:QualifiedName]) |
        (downstream = [BoundedContext:QualifiedName] ('[''D'']' | '['('D'',')?(downstreamRoles+=DownstreamRole (',')?)*']')? '<-' ('[''U'']' | '['('U'',')?(upstreamRoles+=UpstreamRole (',')?)*']')? upstream = [BoundedContext:QualifiedName]) |
        (upstream = [BoundedContext:QualifiedName] ('['(upstreamRoles+=UpstreamRole (',')?)*']')?'Upstream-Downstream'('['(downstreamRoles+=DownstreamRole (',')?)*']')? downstream = [BoundedContext:QualifiedName]) |
        (downstream = [BoundedContext:QualifiedName] ('['(downstreamRoles+=DownstreamRole (',')?)*']')?'Downstream-Upstream'('['(upstreamRoles+=UpstreamRole (',')?)*']')? upstream = [BoundedContext:QualifiedName])
	)
;

CustomerSupplierRelationship:
    (
        (
            (upstream = [BoundedContext:QualifiedName] '['('U'',')?'S'(','(upstreamRoles+=UpstreamRole) ("," upstreamRoles+=UpstreamRole)*)?']' '->' '['('D'',')?'C'(','(downstreamRoles+=DownstreamRole) ("," downstreamRoles+=DownstreamRole)*)?']' downstream = [BoundedContext:QualifiedName]) |
            (downstream = [BoundedContext:QualifiedName] '['('D'',')?'C'(','(downstreamRoles+=DownstreamRole) ("," downstreamRoles+=DownstreamRole)*)?']' '<-' '['('U'',')?'S'(','(upstreamRoles+=UpstreamRole) ("," upstreamRoles+=UpstreamRole)*)?']' upstream = [BoundedContext:QualifiedName]) |
            (downstream = [BoundedContext:QualifiedName] ('['((downstreamRoles+=DownstreamRole) ("," downstreamRoles+=DownstreamRole)*)?']')?'Customer-Supplier'('['((upstreamRoles+=UpstreamRole) ("," upstreamRoles+=UpstreamRole)*)?']')? upstream = [BoundedContext:QualifiedName]) |
            (upstream = [BoundedContext:QualifiedName] ('['((upstreamRoles+=UpstreamRole) ("," upstreamRoles+=UpstreamRole)*)?']')?'Supplier-Customer'('['((downstreamRoles+=DownstreamRole) ("," downstreamRoles+=DownstreamRole)*)?']')? downstream = [BoundedContext:QualifiedName])
        )
	)
;


Acl returns string: 'ACL';
Conformist returns string: 'CF';
PublishedLanguage returns string: 'PL';
OpenHostService returns string: 'OHS';

UpstreamRole returns string: PublishedLanguage | OpenHostService
;

DownstreamRole returns string: Acl | Conformist
;


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
