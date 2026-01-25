# Domains

A **domain** represents a sphere of knowledge, influence, or activity in your organization. In DDD, domains are the highest-level grouping for your business capabilities.

## Keywords

| Keyword | Alias |
| ------- | ----- |
| `Domain` | `dom` |

## Basic Syntax

```dlang
Domain Sales {
    description: "Revenue generation and customer acquisition"
    vision: "Make it easy to buy"
}
```

## Properties

| Property | Required | Description |
|----------|----------|-------------|
| `description` | No | Brief explanation of what the domain covers |
| `vision` | No | The strategic goal or aspiration for this domain |
| `type` | No | Strategic importance (Core, Supporting, Generic) — see [Classifications](/guide/teams-classifications) |

## Subdomains

Create nested domains using `in`:

```dlang
Domain Retail {
    description: "All retail operations"
}

Domain Sales in Retail {
    description: "Sales activities within retail"
}

Domain Marketing in Retail {
    description: "Marketing activities within retail"
}
```

## Domain Types

Classify domain strategic importance using the `type` property:

```dlang
Classification Core
Classification Supporting
Classification Generic

Domain Sales {
    description: "Revenue generation"
    type: Core
}

Domain Notifications {
    description: "Email and push notifications"
    type: Generic
}
```

See [Teams & Classifications](/guide/teams-classifications) for more on strategic importance.

## Best Practices

::: tip Domain Naming
Use nouns that reflect business capabilities, not technical terms. Good: `Sales`, `Inventory`, `CustomerSupport`. Avoid: `SalesService`, `InventoryDB`.
:::

::: tip Vision Statements
Keep vision statements aspirational and business-focused. They should guide strategic decisions, not describe implementation.
:::

## Examples

### E-Commerce Domains

```dlang
Domain Catalog {
    description: "Product information and inventory"
    vision: "Single source of truth for all products"
}

Domain Orders {
    description: "Order processing and fulfillment"
    vision: "Seamless order experience"
}

Domain Customers {
    description: "Customer data and relationships"
    vision: "Know our customers deeply"
}
```

### Healthcare Domains

```dlang
Domain PatientCare {
    description: "Direct patient treatment and care"
    vision: "Outstanding patient outcomes"
}

Domain Administration {
    description: "Scheduling, billing, and operations"
    vision: "Efficient healthcare delivery"
}
```

## Next Steps

- [Learn about Bounded Contexts](/guide/bounded-contexts) — the concrete implementations within domains
- [Teams & Classifications](/guide/teams-classifications) — assign ownership and strategic importance

## See Also

- [Domains Reference](/reference/language#domains) — complete syntax details
