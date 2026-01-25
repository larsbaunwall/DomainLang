# Import System

The import system lets you split your DomainLang model across multiple files, making large models manageable and enabling code reuse.

## Basic Import

Import another `.dlang` file:

```dlang
import "./shared/teams.dlang"
import "./shared/classifications.dlang"

bc Orders for Sales as CoreDomain by SalesTeam { }
```

## Import Syntax

```dlang
// Relative paths
import "./teams.dlang"
import "../shared/common.dlang"

// Package imports (from model.yaml)
import "acme/shared-definitions@1.0.0"
```

## File Organization

A typical multi-file project structure:

```
my-project/
├── model.yaml           # Project manifest
├── index.dlang          # Main entry point
├── domains/
│   ├── sales.dlang
│   └── shipping.dlang
└── shared/
    ├── teams.dlang
    └── classifications.dlang
```

### shared/teams.dlang

```dlang
Team SalesTeam
Team ShippingTeam
Team PlatformTeam
```

### shared/classifications.dlang

```dlang
Classification CoreDomain
Classification SupportingDomain
Classification GenericSubdomain
```

### domains/sales.dlang

```dlang
import "../shared/teams.dlang"
import "../shared/classifications.dlang"

Domain Sales {
    description: "Revenue generation"
}

bc Orders for Sales as CoreDomain by SalesTeam {
    description: "Order lifecycle"
}
```

### index.dlang

```dlang
import "./shared/teams.dlang"
import "./shared/classifications.dlang"
import "./domains/sales.dlang"
import "./domains/shipping.dlang"

ContextMap System {
    contains Orders, Shipping
    Orders -> Shipping
}
```

## Project Manifest

For larger projects, use a `model.yaml` manifest:

```yaml
name: acme-domain-model
version: 1.0.0
description: Acme Corp domain model

entry: index.dlang

dependencies:
  acme/shared-definitions: "^1.0.0"
```

## Import Resolution

1. **Relative paths** (`./`, `../`) — resolved relative to the importing file
2. **Package imports** — resolved from `dependencies` in `model.yaml`

## What Gets Imported

When you import a file, all its top-level elements become available:

- Domains
- Bounded Contexts
- Teams
- Classifications
- Context Maps
- Namespaces and their contents

## Best Practices

::: tip One Concept Per File
Keep files focused. Put related teams in one file, classifications in another, each domain in its own file.
:::

::: tip Use a Shared Folder
Create a `shared/` folder for reusable definitions like teams and classifications that multiple files need.
:::

::: warning Avoid Circular Imports
If file A imports file B, file B should not import file A. Restructure to break cycles.
:::

::: tip Index Files
Use an `index.dlang` as the main entry point that imports all other files and defines the system-level context map.
:::

## Example: Large Enterprise Model

```
enterprise-model/
├── model.yaml
├── index.dlang
├── shared/
│   ├── teams.dlang
│   ├── classifications.dlang
│   └── patterns.dlang
├── divisions/
│   ├── sales/
│   │   ├── index.dlang
│   │   ├── domains.dlang
│   │   └── contexts.dlang
│   ├── platform/
│   │   ├── index.dlang
│   │   └── infrastructure.dlang
│   └── analytics/
│       └── index.dlang
└── maps/
    ├── enterprise-map.dlang
    └── integration-map.dlang
```

### model.yaml

```yaml
name: enterprise-model
version: 2.0.0
description: Enterprise-wide domain model

entry: index.dlang
```

### index.dlang

```dlang
import "./shared/teams.dlang"
import "./shared/classifications.dlang"
import "./divisions/sales/index.dlang"
import "./divisions/platform/index.dlang"
import "./divisions/analytics/index.dlang"
import "./maps/enterprise-map.dlang"
```

## Next Steps

- [Language Reference](/reference/language) — complete syntax documentation
- [Examples](/examples/) — see multi-file projects in action
