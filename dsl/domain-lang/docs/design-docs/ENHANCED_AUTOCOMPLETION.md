# Enhanced LSP Autocompletion

**Status**: Implemented  
**Date**: January 15, 2026  
**Related**: PRS-005 (Developer Experience)

## Overview

Enhanced the LSP completion provider to provide **context-aware keyword suggestions** that intelligently suggest the next logical keywords based on where you are in the document.

## Features Implemented

### 1. Context-Aware Suggestions

The completion provider now analyzes the current AST node and suggests relevant keywords:

#### Inside `BoundedContext` blocks:

When you type inside a BC block, it suggests documentation keywords based on what's missing:

- **`description:`** - if not present
- **`team:`** - if not assigned (inline or block)
- **`role:`** - if not assigned (inline or block)
- **`terminology {}`** - ubiquitous language terms
- **`decisions {}`** - ADRs, policies, rules
- **`relationships {}`** - integration patterns

**Smart Detection**: The provider checks for both inline assignments (`as Core`, `by Team`) and block assignments to avoid duplicate suggestions.

#### Inside `Domain` blocks:

- **`description:`** - what the domain encompasses
- **`vision:`** - strategic vision (recommended by validation)
- **`classification:`** - Core, Supporting, or Generic

#### Inside `ContextMap` blocks:

- **`contains`** - required keyword to list contexts
- **Relationship patterns** - Quick snippets for common patterns:
  - `[OHS] ... -> [ACL] ...` - Open Host with Anti-Corruption Layer
  - `... <-> ... : Partnership` - Bidirectional partnership

#### Inside `DomainMap` blocks:

- **`contains`** - required keyword to list domains

### 2. Sort Order Optimization

Suggestions are sorted with `sortText` to prioritize:
- Required keywords first (e.g., `description`, `vision`)
- Documentation blocks next
- Advanced features last

### 3. Rich Documentation

Each suggestion includes:
- **Documentation**: Explains what the keyword does
- **Detail**: Shows the type (e.g., "Documentation block", "Required")
- **Snippet**: Pre-formatted with placeholders for quick insertion

## Usage Examples

### Example 1: Building a BoundedContext

```dlang
bc Sales for CustomerExperience {
    // Type Ctrl+Space here
    // Suggests: description, team, role, terminology, decisions, relationships
}
```

When you press `Ctrl+Space` inside the block, you'll see:
- ✨ `description` - Add a description explaining the bounded context's responsibility
- ✨ `team` - Assign the team responsible for this context
- ✨ `role` - Assign the strategic role (Core, Supporting, Generic)
- ✨ `terminology` - Define ubiquitous language terms for this context
- ✨ `decisions` - Document architectural decisions, policies, and rules
- ✨ `relationships` - Define relationships with other bounded contexts

### Example 2: Smart Detection

```dlang
bc Sales for CustomerExperience as Core by SalesTeam {
    // Type Ctrl+Space here
    // Will NOT suggest 'role' or 'team' since they're already defined inline
    // Will still suggest: description, terminology, decisions, relationships
}
```

### Example 3: ContextMap Relationships

```dlang
ContextMap ECommerce {
    contains Catalog, Orders
    // Type Ctrl+Space here
    // Suggests relationship patterns:
    // - [OHS] ... -> [ACL] ... (with integration patterns)
    // - ... <-> ... : Partnership
}
```

### Example 4: Domain Documentation

```dlang
Domain Sales {
    // Type Ctrl+Space here
    // Suggests: description, vision, classification
}
```

## Technical Implementation

### Architecture

```typescript
class DomainLangCompletionProvider extends DefaultCompletionProvider {
    
    protected override completionFor(context, next, acceptor) {
        const node = context.node;
        
        // Detect context and add relevant suggestions
        if (ast.isBoundedContext(node)) {
            this.addBoundedContextKeywords(acceptor, context, node);
        } else if (ast.isDomain(node)) {
            this.addDomainKeywords(acceptor, context, node);
        }
        // ... more contexts
        
        // Let Langium provide grammar-based completions
        super.completionFor(context, next, acceptor);
    }
}
```

### Key Methods

- **`addBoundedContextKeywords()`** - Suggests BC documentation blocks
- **`addDomainKeywords()`** - Suggests domain properties
- **`addContextMapKeywords()`** - Suggests map structure and relationships
- **`addDomainMapKeywords()`** - Suggests domain map structure

### Smart Deduplication

Each method checks existing AST nodes to avoid suggesting keywords that are already present:

```typescript
const existingBlocks = new Set(
    node.documentation?.map(doc => doc.$type) ?? []
);

if (!existingBlocks.has('DescriptionBlock')) {
    // Suggest 'description'
}
```

## Benefits

1. **Faster Modeling** - Type less, model more with intelligent suggestions
2. **Discoverable Features** - Users learn about available keywords naturally
3. **Context-Aware** - Only shows relevant options based on location
4. **Prevents Duplication** - Won't suggest what's already defined
5. **Best Practices** - Guides users toward complete documentation

## Future Enhancements

Potential additions:
- Suggest specific Classification names from workspace
- Suggest Team names that exist in the model
- Suggest BoundedContext names in relationships
- Quick fixes to convert inline → block syntax
- Template suggestions based on common patterns

## Related Files

- Implementation: `packages/language/src/lsp/domain-lang-completion.ts`
- Tests: (TODO) `packages/language/test/lsp/completion.test.ts`
- Grammar: `packages/language/src/domain-lang.langium`

## Testing

To test manually:
1. Open a `.dlang` file in VS Code
2. Create a `BoundedContext` block
3. Inside the braces, type `Ctrl+Space`
4. Observe context-aware suggestions

Expected behavior:
- Suggestions are relevant to the context
- Already-defined keywords are not suggested
- Snippets have placeholders for tab navigation
- Documentation is clear and helpful
