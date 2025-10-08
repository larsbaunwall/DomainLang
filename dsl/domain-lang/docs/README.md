# DomainLang Documentation

Welcome to the DomainLang documentation! This guide will help you find what you need.

## 📚 Documentation Structure

### For New Users

**Start here if you're new to DomainLang:**

1. **[Getting Started](./getting-started.md)** ⭐ **Start Here**
   - 30-minute hands-on tutorial
   - Build your first domain model
   - Learn core concepts step-by-step
   - **Time:** 30-60 minutes

2. **[Quick Reference](./quick-reference.md)** 📄 **Cheat Sheet**
   - One-page syntax reference
   - All keywords and patterns
   - Common code snippets
   - **Time:** 5 minutes to scan, keep open while coding

3. **[Syntax Examples](./syntax-examples.md)** 📖 **Deep Dive**
   - Comprehensive examples of every feature
   - Multiple variations and alternatives
   - Best practices and patterns
   - **Time:** 1-2 hours to read through

### Language Reference

4. **[Language Reference](./language.md)** 📐 **Complete Specification**
   - Complete grammar specification
   - Formal syntax rules
   - Semantic details
   - Import system explained
   - **Time:** Reference material, read sections as needed

### Real-World Examples

5. **[Example Models](../examples/)** 💼 **Production-Ready Examples**
   - [Customer-Facing Platform](../examples/customer-facing.dlang) - E-commerce
   - [Banking System](../examples/banking-system.dlang) - Financial services
   - [Healthcare System](../examples/healthcare-system.dlang) - Hospital management
   - [Multi-Reference Demo](../examples/multi-reference-demo.dlang) - Advanced features

### Advanced Topics

6. **[DDD Compliance Audit](./DDD_COMPLIANCE_AUDIT.md)** 🎯 **DDD Best Practices**
   - Domain-Driven Design pattern coverage
   - Strategic vs tactical DDD
   - How DomainLang implements DDD concepts
   - **Audience:** DDD practitioners, architects

7. **[Multi-Reference Explained](./MULTIREFERENCE_EXPLAINED.md)** 🔗 **Advanced Feature**
   - How multi-references work
   - When to use them
   - Modular architecture patterns
   - **Audience:** Advanced users, large-scale modeling

### Technical Documentation (Implementation Details)

8. **[Grammar Review 2025](./GRAMMAR_REVIEW_2025.md)** 🔍 **Language Design**
   - Grammar design decisions
   - Language design rationale
   - Future enhancements
   - **Audience:** Language designers, contributors

9. **[Linguistic Grammar Analysis](./LINGUISTIC_GRAMMAR_ANALYSIS_2025.md)** 🗣️ **Linguistic Patterns**
   - Natural language aspects
   - Operator semantics
   - Assignment styles
   - **Audience:** Language researchers, designers

10. **[Hover Implementation](./HOVER_IMPLEMENTATION.md)** 💡 **LSP Features**
    - How hover tooltips work
    - IDE integration details
    - **Audience:** Tool developers

11. **[JSDoc Migration](./GRAMMAR_JSDOC_MIGRATION.md)** 📝 **Documentation Standards**
    - Grammar documentation approach
    - JSDoc in grammar files
    - **Audience:** Contributors

### Migration Guides

12. **[Langium 4 Migration](./LANGIUM_4_MIGRATION_COMPLETE.md)** ⚡ **Version Upgrade**
    - Langium 3 → 4 migration details
    - Breaking changes
    - **Audience:** Maintainers, contributors

13. **[Phase 4 Enhancements](./PHASE_4_ENHANCEMENTS_COMPLETE.md)** 🚀 **Feature History**
    - Recent feature additions
    - Implementation notes
    - **Audience:** Maintainers

---

## 🎯 Quick Navigation by Task

### I want to...

#### Learn DomainLang
- **First time?** → [Getting Started](./getting-started.md)
- **Need syntax help?** → [Quick Reference](./quick-reference.md)
- **Want examples?** → [Syntax Examples](./syntax-examples.md)
- **Need full docs?** → [Language Reference](./language.md)

#### See Real Examples
- **E-commerce:** [Customer-Facing Platform](../examples/customer-facing.dlang)
- **Finance:** [Banking System](../examples/banking-system.dlang)
- **Healthcare:** [Healthcare System](../examples/healthcare-system.dlang)
- **Advanced features:** [Multi-Reference Demo](../examples/multi-reference-demo.dlang)

#### Understand DDD
- **DDD patterns:** [DDD Compliance Audit](./DDD_COMPLIANCE_AUDIT.md)
- **Strategic design:** [Language Reference - Context Maps](./language.md#context-maps-and-relationships)
- **Tactical patterns:** Coming in Phase 2 (see [Requirements](../../requirements/001-language-design-improvements.md))

#### Contribute
- **Language design:** [Grammar Review](./GRAMMAR_REVIEW_2025.md)
- **Documentation:** [JSDoc Migration](./GRAMMAR_JSDOC_MIGRATION.md)
- **Project setup:** [Main README](../README.md)

---

## 📖 Learning Path

### Level 1: Essentials (30 minutes - 1 hour)
**Goal:** Create your first domain model

1. Read [Getting Started](./getting-started.md) Steps 1-4
2. Create a simple domain with one bounded context
3. Add terminology and team ownership
4. Keep [Quick Reference](./quick-reference.md) open

**You'll learn:** Domain, BoundedContext, Team, Classifications, basic properties

### Level 2: Strategic DDD (2-4 hours)
**Goal:** Model complex systems with multiple contexts

1. Complete [Getting Started](./getting-started.md) Steps 5-7
2. Study [Syntax Examples - Context Maps](./syntax-examples.md#context-maps-and-relationships)
3. Review [Banking Example](../examples/banking-system.dlang)
4. Read [DDD Compliance Audit](./DDD_COMPLIANCE_AUDIT.md)

**You'll learn:** Context Maps, Relationships, DDD patterns (OHS, ACL, SK), Strategic design

### Level 3: Advanced (8+ hours)
**Goal:** Master imports, packages, and large-scale modeling

1. Read [Language Reference - Imports](./language.md#imports)
2. Study [Healthcare Example](../examples/healthcare-system.dlang)
3. Learn [Multi-Reference](./MULTIREFERENCE_EXPLAINED.md)
4. Read [Grammar Review](./GRAMMAR_REVIEW_2025.md)
5. Explore workspace management in [Main README](../README.md)

**You'll learn:** Imports, packages, governance, dependency management, advanced patterns

---

## 📂 File Organization

```
docs/
├── README.md                              ← You are here
├── getting-started.md                     ← Start here (tutorial)
├── quick-reference.md                     ← Cheat sheet
├── syntax-examples.md                     ← All features with examples
├── language.md                            ← Complete grammar reference
│
├── DDD_COMPLIANCE_AUDIT.md                ← DDD best practices
├── MULTIREFERENCE_EXPLAINED.md            ← Advanced feature
│
├── GRAMMAR_REVIEW_2025.md                 ← Language design rationale
├── LINGUISTIC_GRAMMAR_ANALYSIS_2025.md    ← Linguistic analysis
├── HOVER_IMPLEMENTATION.md                ← LSP implementation
├── GRAMMAR_JSDOC_MIGRATION.md             ← Documentation approach
│
├── LANGIUM_4_MIGRATION_COMPLETE.md        ← Version upgrade guide
├── PHASE_4_ENHANCEMENTS_COMPLETE.md       ← Feature history
└── syntax-diagram.html                    ← Interactive grammar diagram

examples/
├── customer-facing.dlang                  ← E-commerce example
├── banking-system.dlang                   ← Banking example
├── healthcare-system.dlang                ← Healthcare example
├── multi-reference-demo.dlang             ← Advanced features
├── domains.dlang                          ← Domain hierarchy
└── other.dlang                            ← Misc patterns
```

---

## 🆘 Common Questions

### How do I define a domain?
```dlang
Domain Sales {
    description: "Handles all sales operations"
}
```
See [Getting Started - Step 1](./getting-started.md#step-1-define-your-first-domain)

### How do I create a bounded context?
```dlang
BC Orders for Sales {
    description: "Order processing"
}
```
See [Getting Started - Step 2](./getting-started.md#step-2-add-a-bounded-context)

### How do I show relationships between contexts?
```dlang
ContextMap System {
    contains Orders, Catalog
    Catalog -> Orders : ProductLookup
}
```
See [Syntax Examples - Context Maps](./syntax-examples.md#context-maps-and-relationships)

### How do I import from another file?
```dlang
import "./shared.dlang"
import "~/contexts/sales.dlang"
import "owner/repo@v1.0.0" as External
```
See [Language Reference - Imports](./language.md#imports)

### What's the difference between Domain and BoundedContext?
- **Domain** = Strategic business area (Sales, Marketing, Support)
- **BoundedContext** = Model boundary (Orders, Catalog, Checkout)

See [Getting Started](./getting-started.md) for detailed explanation

### How do I document ubiquitous language?
```dlang
BC Orders {
    terminology {
        term Order: "Customer purchase request"
            aka: PurchaseOrder
            examples: "Order #12345"
    }
}
```
See [Getting Started - Step 3](./getting-started.md#step-3-add-terminology)

---

## 🛠️ Tools and IDE Support

### VS Code Extension
- Syntax highlighting
- Auto-completion
- Hover documentation
- Go-to-definition
- Real-time validation

See [Main README](../README.md) for installation

### CLI Commands
```bash
domainlang validate model.dlang
domainlang generate model.dlang
domainlang model add <name> <repo> <version>
domainlang model tree
```
See [Main README - CLI Essentials](../README.md#cli-essentials)

---

## 📝 Contributing

Want to improve the docs?

1. **Found an error?** Open an issue
2. **Have a suggestion?** Open an issue or PR
3. **Want to add examples?** PRs welcome!

See [Main README - Contributing](../README.md#contributing--roadmap)

---

## 🔗 External Resources

- [Domain-Driven Design by Eric Evans](https://www.domainlanguage.com/ddd/)
- [Implementing Domain-Driven Design by Vaughn Vernon](https://vaughnvernon.com/implementing-domain-driven-design/)
- [Context Mapping](https://www.infoq.com/articles/ddd-contextmapping/)
- [Langium Documentation](https://langium.org/docs/)
- [GitHub Repository](https://github.com/larsbaunwall/domainlang)

---

## 📞 Getting Help

- **Documentation:** You're reading it!
- **Examples:** [../examples/](../examples/)
- **Issues:** [GitHub Issues](https://github.com/larsbaunwall/domainlang/issues)
- **Discussions:** [GitHub Discussions](https://github.com/larsbaunwall/domainlang/discussions)

---

**Happy modeling!** 🎉

*This documentation is maintained alongside the project. Last major update: October 2025*
