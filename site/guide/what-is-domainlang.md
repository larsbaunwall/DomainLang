# What is DomainLang?

DomainLang is a **domain-specific language (DSL)** for expressing Domain-Driven Design (DDD) architecture models. It provides a clean, readable syntax for defining domains, bounded contexts, context maps, teams, and ubiquitous language—all in plain text files that live in your repository.

## Why DomainLang?

### The Problem

DDD models are often:
- **Locked in proprietary tools** — hard to version control or review
- **Scattered across documents** — wikis, Confluence pages, diagrams
- **Quickly outdated** — disconnected from the codebase they describe
- **Hard to validate** — no tooling to catch inconsistencies

### The Solution

DomainLang keeps your DDD models:
- **In the repo** — version controlled alongside code
- **Reviewable** — changes visible in pull requests
- **Validated** — IDE catches issues as you type
- **Programmable** — query and analyze with the SDK

## Key Features

### DDD-Aligned Syntax

Express DDD concepts naturally:

```dlang
Domain Sales {
    description: "Revenue generation"
    vision: "Make it easy to buy"
}

bc Orders for Sales as CoreDomain by SalesTeam {
    description: "Order lifecycle"
    
    terminology {
        term Order: "A customer's request to purchase"
    }
}
```

### IDE Support

The VS Code extension provides:
- Syntax highlighting for `.dlang` files
- Real-time validation and error messages
- Code completion for keywords and references
- Hover information and documentation
- Go-to-definition navigation

### Context Maps

Model relationships between bounded contexts:

```dlang
ContextMap SalesSystem {
    contains Orders, Billing, Shipping
    
    [OHS] Orders -> [CF] Billing
    [ACL] Shipping <- Orders
}
```

### Multi-File Models

Scale to large systems with imports and namespaces:

```dlang
import "./shared/teams.dlang"
import "./shared/classifications.dlang"

Namespace Acme.Sales {
    bc Orders for Sales { }
}
```

## Getting Started

Ready to try DomainLang?

1. [Install the VS Code extension](https://marketplace.visualstudio.com/items?itemName=thinkability.domain-lang)
2. Follow the [Getting Started guide](/guide/getting-started)
3. Explore the [Examples](/examples/)

## Community

- **Questions & Ideas**: [GitHub Discussions](https://github.com/larsbaunwall/DomainLang/discussions)
- **Bug Reports**: [GitHub Issues](https://github.com/larsbaunwall/DomainLang/issues)
- **Source Code**: [GitHub Repository](https://github.com/larsbaunwall/DomainLang)
