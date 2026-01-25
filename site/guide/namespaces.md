# Namespaces

Namespaces organize your model into logical groups and create qualified names for elements. They're essential for large models and multi-team environments.

## Keywords

| Keyword | Alias |
| ------- | ----- |
| `Namespace` | `ns` |

## Basic Syntax

```dlang
Namespace Acme.Sales {
    Domain Sales { }
    
    bc Orders for Sales { }
    bc Billing for Sales { }
}
```

Elements inside the namespace get qualified names like `Acme.Sales.Orders`.

## Why Use Namespaces?

1. **Avoid name collisions** — Different teams can use the same names
2. **Organize large models** — Group related concepts together
3. **Mirror code structure** — Align with package/module organization
4. **Enable imports** — Reference elements from other namespaces

## Referencing Elements

### Within the Same Namespace

Use simple names:

```dlang
Namespace Acme.Sales {
    bc Orders for Sales { }
    bc Billing for Sales { }
    
    ContextMap SalesMap {
        contains Orders, Billing
    }
}
```

### Across Namespaces

Use fully qualified names:

```dlang
Namespace Acme.Sales {
    bc Orders for Sales { }
}

Namespace Acme.Shipping {
    bc Delivery for Logistics { }
}

ContextMap Integration {
    contains Acme.Sales.Orders, Acme.Shipping.Delivery
    Acme.Sales.Orders -> Acme.Shipping.Delivery
}
```

## Nested Namespaces

Namespaces can be nested:

```dlang
Namespace Acme {
    Namespace Sales {
        bc Orders for Sales { }
    }
    
    Namespace Shipping {
        bc Delivery for Logistics { }
    }
}
```

Or use dot notation:

```dlang
Namespace Acme.Sales {
    bc Orders for Sales { }
}

Namespace Acme.Shipping {
    bc Delivery for Logistics { }
}
```

## Shared Elements

Define reusable elements at a higher namespace level:

```dlang
Namespace Acme {
    // Shared across all Acme namespaces
    Classification CoreDomain
    Classification SupportingDomain
    
    Team PlatformTeam
}

Namespace Acme.Sales {
    Team SalesTeam
    
    bc Orders for Sales as Acme.CoreDomain by SalesTeam { }
}

Namespace Acme.Platform {
    bc Auth for Platform as Acme.SupportingDomain by Acme.PlatformTeam { }
}
```

## Best Practices

::: tip Mirror Your Organization
Align namespace structure with your organizational structure or codebase layout. This makes it easier to find and maintain models.
:::

::: tip Keep It Shallow
Avoid deeply nested namespaces. Two or three levels is usually enough: `Company.Division.Team` or `Product.Module`.
:::

::: warning Don't Over-Namespace
For small models, namespaces add complexity without benefit. Start without them and add as needed.
:::

## Example: Multi-Team Organization

```dlang
// Shared definitions
Namespace Acme.Shared {
    Classification CoreDomain
    Classification SupportingDomain
    Classification GenericSubdomain
}

// Sales division
Namespace Acme.Sales {
    Team OrderTeam
    Team PricingTeam
    
    Domain Sales { description: "Revenue generation" }
    
    bc Orders for Sales as Acme.Shared.CoreDomain by OrderTeam {
        description: "Order management"
    }
    
    bc Pricing for Sales as Acme.Shared.CoreDomain by PricingTeam {
        description: "Dynamic pricing"
    }
}

// Platform division
Namespace Acme.Platform {
    Team PlatformTeam
    
    Domain Platform { description: "Shared infrastructure" }
    
    bc Identity for Platform as Acme.Shared.GenericSubdomain by PlatformTeam {
        description: "Authentication and authorization"
    }
}

// Integration map at company level
Namespace Acme {
    ContextMap CompanyWide {
        contains Sales.Orders, Sales.Pricing, Platform.Identity
        
        Platform.Identity -> Sales.Orders
        Platform.Identity -> Sales.Pricing
    }
}
```

## Next Steps

- [Import System](/guide/imports) — split models across multiple files

## See Also

- [Namespaces Reference](/reference/language#namespaces) — complete syntax details
