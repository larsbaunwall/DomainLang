/**
 * Grammar Completeness Tests
 * 
 * These tests ensure every grammar rule can be parsed successfully.
 * Organized by the 8 sections defined in domain-lang.langium:
 * 
 * 1. Entry Point & Model Structure
 * 2. DDD Strategic Design (Domains, Bounded Contexts)  
 * 3. DDD Tactical Design (Teams, Classifications)
 * 4. Architecture Mapping (Context Maps, Domain Maps)
 * 5. Relationships & Integration Patterns
 * 6. Documentation & Governance (Decisions, Terminology)
 * 7. Module System (Imports & Namespaces)
 * 8. Terminals & Lexical Grammar
 */

import { describe, test, beforeAll } from 'vitest';
import type { TestServices } from '../test-helpers.js';
import { setupTestSuite, expectGrammarRuleParsesSuccessfully, s } from '../test-helpers.js';

describe('Grammar Completeness Tests', () => {
    let testServices: TestServices;

    beforeAll(() => {
        testServices = setupTestSuite();
    });

    // ========================================================================
    // SECTION 1: ENTRY POINT & MODEL STRUCTURE
    // ========================================================================

    describe('Section 1: Entry Point & Model Structure', () => {
        test('Model (entry point) - empty model', async () => {
            await expectGrammarRuleParsesSuccessfully(
                testServices.parse,
                `// Empty model`,
                'Model'
            );
        });

        test('Model - with imports and children', async () => {
            await expectGrammarRuleParsesSuccessfully(
                testServices.parse,
                s`
                    import "./types.dlang"
                    Domain Test {}
                    Team TestTeam
                `,
                'Model'
            );
        });

        test('StructureElement - all variants', async () => {
            await expectGrammarRuleParsesSuccessfully(
                testServices.parse,
                s`
                    Domain TestDomain {}
                    BoundedContext TestBC for TestDomain
                    Team TestTeam
                    Classification TestClass
                    ContextMap TestMap { contains TestBC }
                    DomainMap TestDomainMap { contains TestDomain }
                    Namespace grouped {
                        Namespace nested {
                            Domain NestedDomain {}
                        }
                    }
                    Namespace test.pkg { Domain PkgDomain {} }
                `,
                'StructureElement'
            );
        });
    });

    // ========================================================================
    // SECTION 2: DDD STRATEGIC DESIGN - DOMAINS & BOUNDED CONTEXTS
    // ========================================================================

    describe('Section 2: DDD Strategic Design', () => {
        test('Domain - minimal syntax', async () => {
            await expectGrammarRuleParsesSuccessfully(
                testServices.parse,
                `Domain Test {}`,
                'Domain'
            );
        });

        test('Domain - with parent domain', async () => {
            await expectGrammarRuleParsesSuccessfully(
                testServices.parse,
                s`
                    Domain Parent {}
                    Domain Child in Parent {}
                `,
                'Domain with parent'
            );
        });

        test('Domain - with qualified parent name', async () => {
            await expectGrammarRuleParsesSuccessfully(
                testServices.parse,
                s`
                    Namespace com.example {
                        Domain Parent {}
                    }
                    Domain Child in com.example.Parent {}
                `,
                'Domain with qualified parent'
            );
        });

        test('Domain - all documentation blocks', async () => {
            await expectGrammarRuleParsesSuccessfully(
                testServices.parse,
                s`
                    Classification Core
                    
                    Domain Test {
                        description: "Test domain"
                        vision: "Test vision"
                        classification: Core
                    }
                `,
                'Domain with documentation'
            );
        });

        test('BoundedContext - minimal syntax', async () => {
            await expectGrammarRuleParsesSuccessfully(
                testServices.parse,
                s`
                    Domain Test {}
                    BoundedContext TestBC for Test
                `,
                'BoundedContext minimal'
            );
        });

        test('BoundedContext - shorthand "BC"', async () => {
            await expectGrammarRuleParsesSuccessfully(
                testServices.parse,
                s`
                    Domain Test {}
                    bc TestBC for Test
                `,
                'BoundedContext shorthand'
            );
        });

        test('BoundedContext - with inline role and team', async () => {
            await expectGrammarRuleParsesSuccessfully(
                testServices.parse,
                s`
                    Domain Test {}
                    Team TestTeam
                    Classification Core
                    
                    BoundedContext TestBC for Test as Core by TestTeam
                `,
                'BoundedContext with inline assignments'
            );
        });

        test('BoundedContext - all documentation blocks', async () => {
            await expectGrammarRuleParsesSuccessfully(
                testServices.parse,
                s`
                    Domain Test {}
                    Team TestTeam
                    Classification Core
                    Classification SaaS
                    Classification Mature
                    Classification Architectural
                    Classification Business
                    Classification Technical
                    
                    BoundedContext TestBC for Test {
                        description: "Test context"
                        team: TestTeam
                        role: Core
                        businessModel: SaaS
                        lifecycle: Mature
                        
                        classifications {
                            role: Core
                            businessModel: SaaS
                            lifecycle: Mature
                        }
                        
                        relationships {
                            [OHS] this -> [CF] TestBC : CustomerSupplier
                        }
                        
                        terminology {
                            term Order: "Customer order"
                            Term Product: "Item for sale" aka Item examples "Laptop", "Mouse"
                        }
                        
                        decisions {
                            decision [Architectural] EventSourcing: "Use event sourcing"
                            policy [Business] Returns: "30-day returns"
                            rule [Technical] Validation: "Validate inputs"
                        }
                    }
                `,
                'BoundedContext with all documentation'
            );
        });
    });

    // ========================================================================
    // SECTION 3: DDD TACTICAL DESIGN - TEAMS & CLASSIFICATIONS
    // ========================================================================

    describe('Section 3: DDD Tactical Design', () => {
        test('Team - basic syntax', async () => {
            await expectGrammarRuleParsesSuccessfully(
                testServices.parse,
                `Team TestTeam`,
                'Team'
            );
        });

        test('Classification - basic syntax', async () => {
            await expectGrammarRuleParsesSuccessfully(
                testServices.parse,
                `Classification Core`,
                'Classification'
            );
        });
    });

    // ========================================================================
    // SECTION 4: ARCHITECTURE MAPPING - CONTEXT MAPS & DOMAIN MAPS
    // ========================================================================

    describe('Section 4: Architecture Mapping', () => {
        test('ContextMap - basic', async () => {
            await expectGrammarRuleParsesSuccessfully(
                testServices.parse,
                s`
                    Domain Test {}
                    BoundedContext BC1 for Test
                    BoundedContext BC2 for Test
                    
                    ContextMap TestMap {
                        contains BC1, BC2
                    }
                `,
                'ContextMap basic'
            );
        });

        test('ContextMap - with relationships', async () => {
            await expectGrammarRuleParsesSuccessfully(
                testServices.parse,
                s`
                    Domain Test {}
                    BoundedContext BC1 for Test
                    BoundedContext BC2 for Test
                    
                    ContextMap TestMap {
                        contains BC1, BC2
                        [OHS] BC1 -> [CF] BC2 : CustomerSupplier
                        BC1 <-> BC2 : Partnership
                    }
                `,
                'ContextMap with relationships'
            );
        });

        test('DomainMap - basic', async () => {
            await expectGrammarRuleParsesSuccessfully(
                testServices.parse,
                s`
                    Domain Domain1 {}
                    Domain Domain2 {}
                    
                    DomainMap TestMap {
                        contains Domain1, Domain2
                    }
                `,
                'DomainMap'
            );
        });
    });

    // ========================================================================
    // SECTION 5: RELATIONSHIPS & INTEGRATION PATTERNS
    // ========================================================================

    describe('Section 5: Relationships & Integration Patterns', () => {
        test('Relationship - all arrow types', async () => {
            await expectGrammarRuleParsesSuccessfully(
                testServices.parse,
                s`
                    Domain Test {}
                    BoundedContext BC1 for Test
                    BoundedContext BC2 for Test
                    
                    ContextMap TestMap {
                        contains BC1, BC2
                        BC1 -> BC2
                        BC1 <- BC2
                        BC1 <-> BC2
                        BC1 >< BC2
                    }
                `,
                'Relationship arrows'
            );
        });

        test('Relationship - all DDD patterns', async () => {
            await expectGrammarRuleParsesSuccessfully(
                testServices.parse,
                s`
                    Domain Test {}
                    BoundedContext BC1 for Test
                    BoundedContext BC2 for Test
                    
                    ContextMap TestMap {
                        contains BC1, BC2
                        [PL] BC1 -> BC2
                        [OHS] BC1 -> BC2
                        [CF] BC1 -> BC2
                        [ACL] BC1 -> BC2
                        [P] BC1 -> BC2
                        [SK] BC1 -> BC2
                        [BBoM] BC1 -> BC2
                    }
                `,
                'Relationship DDD patterns'
            );
        });

        test('Relationship - all relationship types', async () => {
            await expectGrammarRuleParsesSuccessfully(
                testServices.parse,
                s`
                    Domain Test {}
                    BoundedContext BC1 for Test
                    BoundedContext BC2 for Test
                    
                    ContextMap TestMap {
                        contains BC1, BC2
                        BC1 -> BC2 : Partnership
                        BC1 -> BC2 : SharedKernel
                        BC1 -> BC2 : CustomerSupplier
                        BC1 -> BC2 : UpstreamDownstream
                        BC1 -> BC2 : SeparateWays
                    }
                `,
                'Relationship types'
            );
        });

        test('BoundedContextRef - this reference', async () => {
            await expectGrammarRuleParsesSuccessfully(
                testServices.parse,
                s`
                    Domain Test {}
                    BoundedContext TestBC for Test {
                        relationships {
                            [OHS] this -> [CF] TestBC
                        }
                    }
                `,
                'BoundedContextRef this'
            );
        });
    });

    // ========================================================================
    // SECTION 6: DOCUMENTATION & GOVERNANCE
    // ========================================================================

    describe('Section 6: Documentation & Governance', () => {
        test('DomainTerm - all variants', async () => {
            await expectGrammarRuleParsesSuccessfully(
                testServices.parse,
                s`
                    Domain Test {}
                    BoundedContext TestBC for Test {
                        terminology {
                            term Order
                            Term Customer: "Person who buys"
                            term Product: "Item for sale"
                            term Service aka Offering, Alternative
                            term Feature synonyms Capability, Function
                            term Invoice examples "INV-001", "INV-002"
                            Term Payment: "Money transfer" aka Transaction examples "Credit Card", "PayPal"
                        }
                    }
                `,
                'DomainTerm variants'
            );
        });

        test('Decision - all categories', async () => {
            await expectGrammarRuleParsesSuccessfully(
                testServices.parse,
                s`
                    Classification Architectural
                    Classification Business
                    Classification Technical
                    Classification Compliance
                    Classification Security
                    Classification Operational
                    
                    Domain Test {}
                    BoundedContext TestBC for Test {
                        decisions {
                            decision ArchDecision: "Basic decision"
                            Decision [Architectural] EventSourcing: "Use event sourcing"
                            decision [Business] Pricing: "Subscription model"
                            decision [Technical] Database: "Use PostgreSQL"
                            decision [Compliance] GDPR: "Follow GDPR"
                            decision [Security] Auth: "Use OAuth2"
                            decision [Operational] Monitoring: "Use Prometheus"
                        }
                    }
                `,
                'Decision categories'
            );
        });

        test('Policy - all categories', async () => {
            await expectGrammarRuleParsesSuccessfully(
                testServices.parse,
                s`
                    Classification Business
                    Classification Compliance
                    Classification Security
                    
                    Domain Test {}
                    BoundedContext TestBC for Test {
                        decisions {
                            policy DefaultPolicy: "Basic policy"
                            Policy [Business] Returns: "30-day returns"
                            policy [Compliance] DataRetention: "Keep data 7 years"
                            policy [Security] Passwords: "Strong passwords required"
                        }
                    }
                `,
                'Policy categories'
            );
        });

        test('BusinessRule - all categories', async () => {
            await expectGrammarRuleParsesSuccessfully(
                testServices.parse,
                s`
                    Classification Technical
                    Classification Business
                    
                    Domain Test {}
                    BoundedContext TestBC for Test {
                        decisions {
                            rule DefaultRule: "Basic rule"
                            Rule [Technical] Validation: "Validate all inputs"
                            rule [Business] Discounts: "Max 50% discount"
                        }
                    }
                `,
                'BusinessRule categories'
            );
        });
    });

    // ========================================================================
    // SECTION 7: MODULE SYSTEM - IMPORTS & NAMESPACES
    // ========================================================================

    describe('Section 7: Module System', () => {
        test('ImportStatement - all formats', async () => {
            await expectGrammarRuleParsesSuccessfully(
                testServices.parse,
                s`
                    import "./local/file.dlang"
                    import "~/workspace/file.dlang"
                    import "owner/repo@v1.0.0"
                    import "https://github.com/owner/repo@v1.0.0"
                    import "owner/repo@v1.0.0" as Alias
                    import "owner/repo@v1.0.0" integrity "sha256-abcd1234"
                    import { Symbol1, Symbol2 } from "./file.dlang"
                    
                    Domain Test {}
                `,
                'ImportStatement formats'
            );
        });

        test('Namespace - nested structure', async () => {
            await expectGrammarRuleParsesSuccessfully(
                testServices.parse,
                s`
                    Namespace com.example.sales {
                        Domain Sales {}
                        Team SalesTeam
                        
                        Namespace orders {
                            BoundedContext OrderContext for Sales
                        }
                    }
                `,
                'Namespace nested structure'
            );
        });

        test('Namespace - nested namespaces', async () => {
            await expectGrammarRuleParsesSuccessfully(
                testServices.parse,
                s`
                    Namespace TopLevel {
                        Domain ParentDomain {}
                        
                        Namespace Nested {
                            Domain ChildDomain in ParentDomain {}
                        }
                    }
                `,
                'Namespace nested namespaces'
            );
        });

        test('QualifiedName - complex names', async () => {
            await expectGrammarRuleParsesSuccessfully(
                testServices.parse,
                s`
                    Namespace com.example.deep.pkg.name {
                        Domain Test {}
                    }
                    
                    BoundedContext TestBC for com.example.deep.pkg.name.Test
                `,
                'QualifiedName'
            );
        });
    });

    // ========================================================================
    // SECTION 8: TERMINALS & LEXICAL GRAMMAR
    // ========================================================================

    describe('Section 8: Terminals & Lexical Grammar', () => {
        test('ID terminal - various formats', async () => {
            await expectGrammarRuleParsesSuccessfully(
                testServices.parse,
                s`
                    Domain simple {}
                    Domain with_underscores {}
                    Domain with-hyphens {}
                    Domain MixedCase123 {}
                    Domain _startsWithUnderscore {}
                `,
                'ID terminal'
            );
        });

        test('STRING terminal - both quote types', async () => {
            await expectGrammarRuleParsesSuccessfully(
                testServices.parse,
                s`
                    Domain Test {
                        description: "Double quoted string with \\"escaped\\" quotes"
                        vision: 'Single quoted string with \\'escaped\\' quotes'
                    }
                `,
                'STRING terminal'
            );
        });

        test('Comments - single and multi-line', async () => {
            await expectGrammarRuleParsesSuccessfully(
                testServices.parse,
                s`
                    // Single line comment
                    /* Multi-line
                       comment */
                    Domain Test {
                        // Inline comment
                        description: "Test" /* Another comment */
                    }
                `,
                'Comments'
            );
        });

        test('Assignment operators', async () => {
            await expectGrammarRuleParsesSuccessfully(
                testServices.parse,
                s`
                    Classification Core
                    
                    Domain Test {
                        description: "Using colon"
                        vision is "Using is keyword"  
                        classification = Core
                    }
                `,
                'Assignment operators'
            );
        });
    });
});
