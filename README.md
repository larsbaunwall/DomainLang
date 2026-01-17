<img src="images/icon.png" width="100" />

# DomainLang

[![Tests](https://github.com/larsbaunwall/DomainLang/actions/workflows/build.yml/badge.svg)](https://github.com/larsbaunwall/DomainLang/actions/workflows/build.yml) [![Visual Studio Marketplace](https://vsmarketplacebadges.dev/version/thinkability.domain-lang.svg)](https://marketplace.visualstudio.com/items?itemName=thinkability.domain-lang)

**DomainLang** is a domain-specific language (DSL) for modeling software architectures using Domain-Driven Design (DDD) principles. Write your architecture as code, validate it with tooling, and generate artifacts for your teams.

```dlang
Domain Sales {
    description: "Revenue generation and customer acquisition"
}

BoundedContext OrderProcessing for Sales as CoreDomain by SalesTeam {
    description: "Handles customer order lifecycle"
    
    terminology {
        term Order: "A customer's request to purchase products"
    }
}
```

---

## ✨ Features

- 📝 **Architecture as code** — Express DDD concepts in a clean, readable syntax
- 🔍 **Validation** — Catch design issues early with built-in rules
- 💡 **IDE support** — Syntax highlighting, auto-completion, hover docs, and go-to-definition
- 🤝 **Collaboration** — Shared language between business experts and developers
- 📊 **Visualization** — Generate context maps and diagrams
- 🔌 **Query SDK** — Programmatic access to models with fluent API and O(1) lookups

---

## 🚀 Quick Start

### Try it Online

Experience DomainLang instantly in the [**online editor**](https://larsbaunwall.github.io/DomainLang/index.html) — no installation required.

### Install the VS Code Extension

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "DomainLang"
4. Click Install

### Your First Model

Create a file named `my-domain.dlang`:

```dlang
Classification CoreDomain
Team ProductTeam

Domain ECommerce {
    description: "Online shopping platform"
}

BoundedContext Catalog for ECommerce as CoreDomain by ProductTeam {
    description: "Product catalog management"
}

BoundedContext Orders for ECommerce as CoreDomain by ProductTeam {
    description: "Order processing"
}

ContextMap Platform {
    contains Catalog, Orders
    Catalog -> Orders
}
```

---

## 📖 Documentation

| Resource | Description |
| -------- | ----------- |
| [**Getting Started**](./dsl/domain-lang/docs/getting-started.md) | Hands-on tutorial (30 min) |
| [**Quick Reference**](./dsl/domain-lang/docs/quick-reference.md) | Syntax cheat sheet |
| [**Syntax Examples**](./dsl/domain-lang/docs/syntax-examples.md) | Copy-paste patterns |
| [**Language Reference**](./dsl/domain-lang/docs/language.md) | Complete grammar specification |
| [**Model Query SDK**](./dsl/domain-lang/packages/language/src/sdk/README.md) | Programmatic API for querying models |
| [**Documentation Hub**](./dsl/domain-lang/docs/README.md) | Full documentation index |

---

## 📁 Project Structure

```text
DomainLang/
├── dsl/domain-lang/           # Main DSL implementation
│   ├── packages/
│   │   ├── language/          # Grammar and language services
│   │   │   └── src/sdk/       # Model Query SDK
│   │   ├── cli/               # Command-line interface
│   │   └── extension/         # VS Code extension
│   ├── docs/                  # Documentation
│   └── examples/              # Example models
├── adr/                       # Architecture Decision Records
└── requirements/              # Product requirements
```

---

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm 9+

### Build from Source

```bash
cd dsl/domain-lang
npm install
npm run langium:generate   # Generate from grammar
npm run build              # Compile TypeScript
npm test                   # Run tests
```

### Grammar

The language is built with [Langium](https://langium.org/). The grammar definition is at:
[`packages/language/src/domain-lang.langium`](./dsl/domain-lang/packages/language/src/domain-lang.langium)

Interactive syntax diagram: [Railway diagram](./dsl/domain-lang/docs/syntax-diagram.html)

---

## 💡 Background

Inspired by the [ContextMapper DSL](https://github.com/ContextMapper/context-mapper-dsl), DomainLang aims to provide a more complete DDD specification language—one that serves both as diagrams-as-code and as a semantic, compilable model of domain-driven architecture.

---

## 🤝 Contributing

We welcome contributions! Whether it's bug reports, feature requests, or pull requests.

- 🐛 **Found a bug?** [Open an issue](https://github.com/larsbaunwall/DomainLang/issues)
- 💡 **Have an idea?** [Start a discussion](https://github.com/larsbaunwall/DomainLang/discussions)
- 📖 **Improve docs?** PRs are always welcome

---

## 📬 Get in Touch

I'd love to hear from you! Please submit an issue, and I'll get back to you as soon as possible.

Feedback is especially welcome if you have experience with language design or domain-driven design.

---

## 📄 License

[Apache 2.0](./LICENSE)
