# DomainLang for VS Code

A Domain-Driven Design modeling language with first-class VS Code support. Define domains, bounded contexts, context maps, and team ownership in a concise, readable syntax.

## Features

- **Syntax highlighting** for `.dlang` files
- **IntelliSense** with auto-completion for keywords, references, and patterns
- **Go to definition** and **Find references** for domains, contexts, and teams
- **Hover documentation** showing element details
- **Real-time validation** with helpful error messages
- **Code formatting** to keep models consistent

## Quick Start

1. Install the extension from the VS Code Marketplace
2. Create a file with the `.dlang` extension
3. Start modeling your domain:

```dlang
Domain Bookstore {
    description: "Online bookstore platform"
    vision: "Make books easy to discover and buy"
}

Team CatalogTeam
Team OrderTeam
Classification CoreDomain

bc Catalog for Bookstore as CoreDomain by CatalogTeam {
    description: "Product catalog and inventory"
    
    terminology {
        term Book: "A product available for purchase"
        term ISBN: "International Standard Book Number"
    }
}

bc Orders for Bookstore as CoreDomain by OrderTeam {
    description: "Order lifecycle and fulfillment"
}

ContextMap BookstoreIntegration {
    contains Catalog, Orders
    Catalog -> Orders
}
```

## Language Highlights

### Domains and Subdomains

```dlang
Domain Enterprise { description: "Company-wide" }

Domain Sales in Enterprise {
    description: "Revenue generation"
    vision: "Make buying easy"
}
```

### Bounded Contexts with Ownership

```dlang
bc Checkout for Sales as CoreDomain by PaymentsTeam {
    description: "Checkout and payment orchestration"
}
```

### Context Maps and Relationships

```dlang
ContextMap Integration {
    contains Orders, Payments, Shipping
    
    [OHS] Orders -> [ACL] Payments
    Orders -> Shipping
    [SK] Payments <-> Billing : SharedKernel
}
```

Supported DDD patterns: `OHS` (Open Host Service), `ACL` (Anti-Corruption Layer), `CF` (Conformist), `PL` (Published Language), `SK` (Shared Kernel), `P` (Partnership).

### Terminology (Ubiquitous Language)

```dlang
bc Orders for Sales {
    terminology {
        term Order: "A customer's request to purchase items"
            aka: PurchaseOrder
            examples: "Order #12345"
        term OrderLine: "A single line item within an order"
    }
}
```

### Decisions and Policies

```dlang
bc Orders for Sales {
    decisions {
        decision EventSourcing: "Capture every state change"
        policy Refunds: "Allow refunds within 30 days"
        rule MinOrder: "Minimum order value is $10"
    }
}
```

### Namespaces and Imports

```dlang
import "./shared-definitions.dlang"

namespace Acme.Sales {
    bc Checkout for Sales { }
}
```

## Documentation

- [Getting Started Guide](https://github.com/larsbaunwall/DomainLang/blob/main/dsl/domain-lang/docs/getting-started.md)
- [Quick Reference](https://github.com/larsbaunwall/DomainLang/blob/main/dsl/domain-lang/docs/quick-reference.md)
- [Full Language Reference](https://github.com/larsbaunwall/DomainLang/blob/main/dsl/domain-lang/docs/language.md)
- [Example Models](https://github.com/larsbaunwall/DomainLang/tree/main/dsl/domain-lang/examples)

## Requirements

- VS Code 1.67.0 or later

## Extension Settings

This extension contributes the following settings:

- Language support for `.dlang` files

## Known Issues

Report issues at [GitHub Issues](https://github.com/larsbaunwall/DomainLang/issues).

## Contributing

Contributions are welcome! See the [repository](https://github.com/larsbaunwall/DomainLang) for development setup.

## License

Apache License 2.0 - See [LICENSE](https://github.com/larsbaunwall/DomainLang/blob/main/LICENSE) for details.
