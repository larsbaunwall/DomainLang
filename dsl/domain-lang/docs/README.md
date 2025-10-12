# DomainLang Documentation

## 🎯 Quick Navigation by Task

### I Want To

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
- **Namespace walkthrough:** Review the namespace notes embedded at the top of each example file

#### Understand DDD

- [DDD Compliance Audit](./DDD_COMPLIANCE_AUDIT.md)
- [Language Reference – Context Maps](./language.md#context-maps-and-relationships)
- [Namespace organisation](./language.md#namespaces) – new unified container model

#### Contribute

- **Language design:** [Grammar Review](./GRAMMAR_REVIEW_2025.md)
- **Documentation:** [JSDoc Migration](./GRAMMAR_JSDOC_MIGRATION.md)
- **Project setup:** [Main README](../README.md)

---

## 📖 Learning Path

### Level 1: Essentials (30 minutes – 1 hour)

**Goal:** Create your first domain model

1. Read [Getting Started](./getting-started.md) Steps 1-4
1. Create a simple domain with one bounded context
1. Add terminology and team ownership
1. Keep [Quick Reference](./quick-reference.md) open

**You'll learn:** Domain, BoundedContext, Team, Classifications, basic properties

### Level 2: Strategic DDD (2–4 hours)

**Goal:** Model complex systems with multiple contexts

1. Complete [Getting Started](./getting-started.md) Steps 5-7
1. Study [Syntax Examples – Context Maps](./syntax-examples.md#context-maps-and-relationships)
1. Review [Banking Example](../examples/banking-system.dlang)
1. Read [DDD Compliance Audit](./DDD_COMPLIANCE_AUDIT.md)

**You'll learn:** Context Maps, Relationships, DDD patterns (OHS, ACL, SK), strategic design

### Level 3: Advanced (8+ hours)

**Goal:** Master imports, namespaces, and large-scale modeling

1. Read [Language Reference – Imports](./language.md#imports)
1. Study [Healthcare Example](../examples/healthcare-system.dlang)
1. Learn [Multi-Reference](./MULTIREFERENCE_EXPLAINED.md)
1. Read [Grammar Review](./GRAMMAR_REVIEW_2025.md)
1. Explore workspace management in [Main README](../README.md)
1. Practice namespace modelling with the updated examples and naming regression tests

**You'll learn:** Imports, namespaces, governance, dependency management, advanced patterns

---

## 📂 File Organization

```text
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

See [Getting Started – Step 1](./getting-started.md#step-1-define-your-first-domain)

### How do I create a bounded context?

```dlang
BC Orders for Sales {
   description: "Order processing"
}
```

See [Getting Started – Step 2](./getting-started.md#step-2-add-a-bounded-context)

### How do I show relationships between contexts?

```dlang
ContextMap System {
   contains Orders, Catalog
   Catalog -> Orders
}
```

See [Syntax Examples – Context Maps](./syntax-examples.md#context-maps-and-relationships)

### How do I import from another file?

```dlang
import "./shared.dlang"
import "~/contexts/sales.dlang"
import "owner/repo@v1.0.0" as External
```

See [Language Reference – Imports](./language.md#imports)

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

See [Getting Started – Step 3](./getting-started.md#step-3-add-terminology)

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

See [Main README – CLI Essentials](../README.md#cli-essentials)

---

## 📝 Contributing

Want to improve the docs?

1. **Found an error?** Open an issue
1. **Have a suggestion?** Open an issue or PR
1. **Want to add examples?** PRs welcome!

See [Main README – Contributing](../README.md#contributing--roadmap)

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

Last major update: October 2025 (namespace unification, multi-workspace tooling, naming regression tests)
