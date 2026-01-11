# MultiReference: How It Works & Why It's Useful

## The Core Concept

With Langium 4.0's `[+Type]` syntax, **one reference can point to multiple AST nodes** that have the same name. Think of it as a "smart reference" that finds ALL matching targets, not just the first one.

## Visual Example

```
┌─────────────────────────────────────────────────────────────────┐
│  Your DomainLang File                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Domain Sales {}                                                │
│  Domain Support {}                                              │
│                                                                 │
│  bc CustomerManagement for Sales {        ┐                    │
│      description: "Leads & deals"         │ Same name!         │
│  }                                         │                    │
│                                            │                    │
│  bc CustomerManagement for Support {      │                    │
│      description: "Tickets & SLAs"        ┘                    │
│  }                                                               │
│                                                                 │
│  ContextGroup CustomerServices {                                │
│      contains CustomerManagement  ← ONE reference              │
│  }                                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

                           ↓  Resolution

┌─────────────────────────────────────────────────────────────────┐
│  MultiReference Structure                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  contextGroup.contexts[0]  ← The reference                     │
│      ↓                                                          │
│      items: [                                                   │
│          {                                                      │
│              ref: bc CustomerManagement (Sales)    ← Target 1  │
│          },                                                     │
│          {                                                      │
│              ref: bc CustomerManagement (Support)  ← Target 2  │
│          }                                                      │
│      ]                                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Comparison: Before vs After

### Before (Single Reference)

```dlang
// OLD: If you had two BCs named "Orders", you'd get an error or ambiguity
Domain Sales {}
Domain Billing {}

bc Orders for Sales {}
bc Orders for Billing {}  // ⚠️ Name conflict!

ContextMap AllOrders {
    contains Orders  // ❌ Which one? Ambiguous!
}
```

### After (MultiReference)

```dlang
// NEW: Both BCs are included automatically!
Domain Sales {}
Domain Billing {}

bc Orders for Sales {}
bc Orders for Billing {}

ContextMap AllOrders {
    contains Orders  // ✅ References BOTH! 🎉
}
```

## Real-World Use Cases

### 1. **Team-Based Modeling** (Conway's Law)

Different teams model the same concept from their perspective:

```dlang
// Team A (Sales perspective)
bc Customer for Sales {
    description: "Lead tracking, conversion, deals"
}

// Team B (Support perspective)  
bc Customer for Support {
    description: "Ticket history, satisfaction scores"
}

// Team C (Marketing perspective)
bc Customer for Marketing {
    description: "Segments, campaigns, preferences"
}

// Aggregate ALL team perspectives in one view
ContextGroup CustomerExperience {
    contains Customer  // All 3 BCs included!
}
```

**Benefit**: Each team owns their model, but you can create unified architectural views.

### 2. **Import Scenarios**

When importing models from different sources:

```dlang
// file: sales-contexts.dlang
bc Checkout for Sales {}

// file: billing-contexts.dlang  
bc Checkout for Billing {}

// file: architecture.dlang
import "./sales-contexts.dlang"
import "./billing-contexts.dlang"

ContextMap PaymentFlow {
    contains Checkout  // Both Checkout BCs are referenced!
}
```

**Benefit**: No naming conflicts when merging models from distributed teams.

### 3. **Package-Based Architecture**

Organizing by business capability with qualified names:

```dlang
package acme.sales {
    bc OrderManagement {}
}

package acme.fulfillment {
    bc OrderManagement {}  // Different package, same name
}

ContextMap SupplyChain {
    contains acme.sales.OrderManagement, acme.fulfillment.OrderManagement
}
```

**Benefit**: Clear separation of concerns with namespace support.

### 4. **Partial Definitions**

Split a bc definition across multiple files (future feature):

```dlang
// file: customer-sales.dlang
bc Customer for Sales {
    terminology {
        term Lead: "Potential customer"
    }
}

// file: customer-support.dlang
bc Customer for Support {
    terminology {
        term Ticket: "Support request"
    }
}

// Both definitions contribute to the complete "Customer" BC
```

**Benefit**: Large BCs can be maintained by multiple teams in separate files.

## How to Work with MultiReference

### In DomainLang (DSL)

Just write the name once:

```dlang
ContextGroup MyGroup {
    contains SomeBoundedContext  // Automatically finds all matches
}
```

### In TypeScript (Generated Code)

Access all resolved targets:

```typescript
import { ContextGroup } from './generated/ast.js';

function analyzeGroup(group: ContextGroup) {
    // Iterate over all references
    group.contexts.forEach(multiRef => {
        console.log(`Reference text: "${multiRef.$refText}"`);
        
        // Access all resolved targets
        multiRef.items.forEach((item, idx) => {
            console.log(`  Target ${idx + 1}: ${item.ref?.name}`);
            console.log(`    Domain: ${item.ref?.domain?.items[0]?.ref?.name}`);
        });
    });
}
```

### In LSP Hover (VS Code)

When you hover over a reference, you'll see information about **all** resolved targets:

```
Hover on "CustomerManagement":
┌─────────────────────────────────────────────┐
│ 📕 CustomerManagement                       │
├─────────────────────────────────────────────┤
│ Resolves to 2 bounded contexts:             │
│                                             │
│ 1. CustomerManagement (Sales)               │
│    "Manages sales leads and opportunities"  │
│                                             │
│ 2. CustomerManagement (Support)             │
│    "Manages support tickets and SLAs"       │
└─────────────────────────────────────────────┘
```

## Technical Implementation

The grammar uses the `[+Type]` syntax:

```langium
// Before (single reference)
ContextGroup:
    'ContextGroup' name=ID '{'
        ('contains' contexts+=[BoundedContext:QualifiedName] ...)*
    '}'
;

// After (multi-target reference)
ContextGroup:
    'ContextGroup' name=ID '{'
        ('contains' contexts+=[+BoundedContext:QualifiedName] ...)*
    '}'                           ↑ Plus sign enables multi-target
;
```

This generates:

```typescript
// Generated TypeScript interface
interface ContextGroup {
    contexts: Array<MultiReference<BoundedContext>>;  // Not Reference!
}

interface MultiReference<T> {
    $refText: string;  // The text that was written ("CustomerManagement")
    items: Array<{     // All matching AST nodes
        ref: T;
    }>;
    error?: LinkingError;
}
```

## Summary

**MultiReference enables:**
- ✅ Distributed modeling across teams
- ✅ Namespace-aware architecture  
- ✅ Unified views from partial definitions
- ✅ No naming conflicts in imports
- ✅ Rich hover information showing all matches

**Where it's used in DomainLang:**
1. `ContextGroup.contexts` - Aggregate BCs in a group ✅
2. `ContextMap.boundedContexts` - Reference contexts in maps ✅
3. `DomainMap.domains` - Reference domains in maps ✅

**Where it's NOT used (DDD Compliance):**
- ❌ `BoundedContext.domain` - A bc can only belong to **ONE** domain (fundamental DDD principle)

## Why BC.domain is Single Reference

In Domain-Driven Design, a **Bounded Context defines a boundary** within which a particular model is valid. This boundary is inherently singular—a bc cannot span multiple domains without violating its core purpose of establishing clear boundaries.

**DDD Principles:**
- A Bounded Context belongs to exactly one Domain (or subdomain)
- Multiple domains = unclear boundaries = context boundary violation
- If you need the same concept in different domains, create separate BCs

**Correct approach:**
```dlang
// ✅ Two separate BCs for different domains
bc CustomerManagement for Sales {
    description: "Manages sales leads"
}

bc CustomerManagement for Support {
    description: "Manages support tickets"
}

// ✅ ContextGroup can reference both (uses MultiReference)
ContextGroup CustomerServices {
    contains CustomerManagement  // Resolves to both BCs
}
```

**Incorrect approach:**
```dlang
// ❌ Would violate DDD if allowed
bc CustomerManagement for Sales, Support {  // NOT SUPPORTED!
    // Which domain's model applies? Unclear boundaries!
}
```

**The key insight**: Instead of forcing unique names everywhere, MultiReference embraces the reality that different teams might use the same name for different things, and provides tools to work with that productively—but only where it makes semantic sense (aggregation, visualization), not where it would violate DDD principles (bc boundary definition).
