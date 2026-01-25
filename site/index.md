---
layout: home

hero:
  name: DomainLang
  text: A DSL for Domain-Driven Design
  tagline: Keep domains, bounded contexts, ownership, and terminology close to the codebase
  image:
    src: /logo.svg
    alt: DomainLang
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://domainlang.net

features:
  - icon: 🎯
    title: DDD-Aligned Language
    details: Express domains, bounded contexts, context maps, and ubiquitous language in a clean, readable syntax.
  - icon: 🛠️
    title: First-Class IDE Support
    details: VS Code extension with syntax highlighting, validation, completion, hover, and go-to-definition.
  - icon: 📦
    title: Version Control Friendly
    details: Plain text files that live in your repo—easy to review in pull requests and track changes over time.
  - icon: 🔍
    title: Built-in Validation
    details: Catch common modeling issues early with real-time validation and helpful error messages.
  - icon: 🧩
    title: Model Query SDK
    details: Programmatic access to your DDD models for analysis, documentation generation, and automation.
  - icon: 📚
    title: Multi-File Support
    details: Split models across files with imports, namespaces, and dependencies for large codebases.
---

## Quick Example

```dlang
Classification CoreDomain
Team SalesTeam

Domain Sales {
    description: "Revenue generation and customer acquisition"
    vision: "Make it easy to buy"
}

bc Orders for Sales as CoreDomain by SalesTeam {
    description: "Order lifecycle and orchestration"

    terminology {
        term Order: "A customer's request to purchase"
    }
}

ContextMap SalesLandscape {
    contains Orders
}
```

## Who is DomainLang for?

<div class="vp-features">

**Architects and Tech Leads**  
Who want lightweight, reviewable DDD models that live in the codebase.

**Teams Doing DDD**  
Who need a shared ubiquitous language documented alongside the code.

**Developers**  
Who want IDE feedback while evolving architecture and domain models.

</div>
