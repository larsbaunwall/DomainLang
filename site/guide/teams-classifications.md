# Teams & Classifications

Teams and classifications provide organizational context for your domain model—who owns what, and how strategically important each piece is.

## Classifications

Classifications indicate the strategic importance of a bounded context:

```dlang
Classification CoreDomain
Classification SupportingDomain  
Classification GenericSubdomain
```

### Strategic Classification Types

| Type | Description | Typical Investment |
|------|-------------|-------------------|
| **Core** | Differentiates your business from competitors | High: best engineers, custom solutions |
| **Supporting** | Necessary but not differentiating | Medium: good solutions, possibly outsourced |
| **Generic** | Common to many businesses | Low: buy or use commodity solutions |

### Using Classifications

Reference classifications with `as` in the bounded context header:

```dlang
Classification CoreDomain
Classification SupportingDomain
Classification GenericSubdomain

bc Orders for Sales as CoreDomain { }
bc Reporting for Sales as SupportingDomain { }
bc Authentication for Platform as GenericSubdomain { }
```

## Teams

Teams represent the people responsible for bounded contexts:

```dlang
Team OrderTeam
Team PlatformTeam
Team DataTeam
```

### Using Teams

Reference teams with `by` in the bounded context header:

```dlang
Team OrderTeam
Team PlatformTeam

bc Orders for Sales by OrderTeam { }
bc UserManagement for Platform by PlatformTeam { }
```

## Combined Example

```dlang
// Define organizational elements
Classification CoreDomain
Classification SupportingDomain
Classification GenericSubdomain

Team SalesTeam
Team PlatformTeam
Team DataTeam

// Define domains
Domain Sales { description: "Revenue generation" }
Domain Platform { description: "Shared infrastructure" }

// Bounded contexts with full context
bc Orders for Sales as CoreDomain by SalesTeam {
    description: "Order lifecycle—our competitive advantage"
}

bc Analytics for Sales as SupportingDomain by DataTeam {
    description: "Sales analytics and reporting"
}

bc Authentication for Platform as GenericSubdomain by PlatformTeam {
    description: "User authentication—use standard solutions"
}
```

## Team Metadata

Add details about teams:

```dlang
Team OrderTeam {
    metadata {
        slack: "#order-team"
        oncall: "order-oncall@company.com"
        lead: "Jane Smith"
    }
}
```

## Classification Metadata

Add details about classifications:

```dlang
Classification CoreDomain {
    metadata {
        investment: "High"
        strategy: "Build custom, hire best talent"
    }
}
```

## Best Practices

::: tip Start Simple
Begin with just `CoreDomain`, `SupportingDomain`, and `GenericSubdomain`. Add custom classifications only when needed.
:::

::: warning Align with Reality
Classifications should reflect actual strategic importance, not aspirations. If you treat everything as "Core," you're not making real strategic decisions.
:::

::: tip Team Boundaries
Ideally, team boundaries align with bounded context boundaries. If one team owns multiple contexts, ensure they're closely related.
:::

## Complete Example

```dlang
// Classifications
Classification CoreDomain
Classification SupportingDomain
Classification GenericSubdomain

// Teams
Team ProductTeam
Team OrderTeam
Team PlatformTeam
Team AnalyticsTeam

// Domains
Domain Catalog { description: "Product catalog" }
Domain Sales { description: "Sales and orders" }
Domain Platform { description: "Shared infrastructure" }

// Core bounded contexts—competitive advantage
bc ProductCatalog for Catalog as CoreDomain by ProductTeam {
    description: "Our curated product experience"
}

bc OrderManagement for Sales as CoreDomain by OrderTeam {
    description: "Seamless order experience"
}

// Supporting bounded contexts—necessary but not differentiating
bc SalesReporting for Sales as SupportingDomain by AnalyticsTeam {
    description: "Sales metrics and dashboards"
}

// Generic bounded contexts—commodity
bc UserAuth for Platform as GenericSubdomain by PlatformTeam {
    description: "Authentication and authorization"
}

bc EmailService for Platform as GenericSubdomain by PlatformTeam {
    description: "Transactional email delivery"
}
```

## Next Steps

- [Namespaces](/guide/namespaces) — organize large models
- [Import System](/guide/imports) — split models across files
