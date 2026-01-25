# Context Maps

A **context map** visualizes the relationships between bounded contexts. It shows how contexts integrate and which patterns govern their interactions.

## Basic Syntax

```dlang
ContextMap SalesSystem {
    contains Orders, Billing, Shipping
}
```

## Relationships

Define how contexts relate to each other:

```dlang
ContextMap SalesSystem {
    contains Orders, Billing, Shipping
    
    Orders -> Billing
    Orders -> Shipping
}
```

The arrow shows the direction of dependency or data flow.

## Integration Patterns

Annotate relationships with DDD integration patterns:

```dlang
ContextMap SalesSystem {
    contains Orders, Billing, Shipping
    
    [OHS] Orders -> [CF] Billing
    [ACL] Shipping <- Orders
}
```

### Available Patterns

| Pattern | Keyword | Description |
|---------|---------|-------------|
| Open Host Service | `[OHS]` | Provides a well-defined protocol for others to consume |
| Conformist | `[CF]` | Adopts the upstream model without translation |
| Anti-Corruption Layer | `[ACL]` | Translates between models to protect the downstream context |
| Published Language | `[PL]` | Uses a shared, documented language for integration |
| Shared Kernel | `[SK]` | Shares a subset of the domain model |
| Partnership | `[P]` | Two contexts coordinate development together |

## Pattern Combinations

Patterns can be on either or both sides:

```dlang
ContextMap Integration {
    contains A, B, C, D
    
    // Upstream provides OHS, downstream conforms
    [OHS] A -> [CF] B
    
    // Downstream protects itself with ACL
    [ACL] C <- D
    
    // Partnership between equals
    [P] A <-> [P] B
}
```

## Bidirectional Relationships

Use `<->` for mutual dependencies:

```dlang
ContextMap Partnership {
    contains Frontend, Backend
    
    [P] Frontend <-> [P] Backend
}
```

## Multiple Context Maps

Large systems often have multiple maps for different views:

```dlang
// Technical integration view
ContextMap TechnicalIntegration {
    contains Orders, Inventory, Payments
    
    Orders -> Inventory
    Orders -> Payments
}

// Team communication view
ContextMap TeamDependencies {
    contains OrderContext, InventoryContext
    
    [P] OrderContext <-> [P] InventoryContext
}
```

## Best Practices

::: tip Keep Maps Focused
Create separate context maps for different concerns: technical integration, team dependencies, data flow. Don't try to show everything in one map.
:::

::: warning Avoid God Maps
If your context map has too many contexts (more than 7-10), consider breaking it into focused sub-maps or reviewing your context boundaries.
:::

## Examples

### E-Commerce System

```dlang
ContextMap ECommerceSystem {
    contains Catalog, Orders, Payments, Shipping, Notifications
    
    // Orders orchestrates the flow
    [OHS] Orders -> [CF] Payments
    [OHS] Orders -> [CF] Shipping
    [OHS] Orders -> [CF] Notifications
    
    // Catalog provides product data
    [OHS,PL] Catalog -> [CF] Orders
    
    // Shipping protects from external carrier APIs
    [ACL] Shipping <- ExternalCarriers
}
```

### Microservices Integration

```dlang
ContextMap MicroservicesMap {
    contains UserService, OrderService, ProductService, NotificationService
    
    [OHS] UserService -> [CF] OrderService
    [OHS] ProductService -> [CF] OrderService
    [OHS] OrderService -> [ACL] NotificationService
}
```

## Next Steps

- [Teams & Classifications](/guide/teams-classifications) — assign ownership and strategic importance
- [Namespaces](/guide/namespaces) — organize large models
- [Language Reference](/reference/language) — complete syntax details
