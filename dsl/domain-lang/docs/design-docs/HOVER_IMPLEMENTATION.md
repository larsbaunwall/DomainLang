# Hover Implementation - Hybrid Approach

## Overview

DomainLang uses a **hybrid hover system** that combines Langium 4.0's automatic keyword documentation (from PR #1842) with custom DDD pattern dictionaries for rich educational content.

## Implementation Details

### Proper API Usage (No Type Casting)

The implementation follows the exact pattern from [Langium PR #1842](https://github.com/eclipse-langium/langium/pull/1842) using proper Langium APIs:

**Imports** (`src/language/lsp/hover/domain-lang-hover.ts`):
```typescript
import { CstUtils, isReference, isAstNodeWithComment, isJSDoc, parseJSDoc } from "langium";
```

**Key Functions Used**:
- `isAstNodeWithComment(node)` - Type guard for nodes with `$comment` property
- `CstUtils.findCommentNode(node.$cstNode, ['ML_COMMENT'])` - Finds multiline comments in CST
- `isJSDoc(comment)` - Checks if comment is JSDoc format
- `parseJSDoc(comment).toMarkdown()` - Converts JSDoc to markdown

### The `getKeywordHoverContent` Method

Located in `DomainLangHoverProvider` class (lines 401-438):

```typescript
protected override getKeywordHoverContent(node: AstNode): MaybePromise<Hover | undefined> {
    // First: Check if the grammar node has a $comment property (from JSDoc)
    let comment = isAstNodeWithComment(node) ? node.$comment : undefined;
    
    // Fallback: Look for multiline comments in the CST
    if (!comment) {
        comment = CstUtils.findCommentNode(node.$cstNode, ['ML_COMMENT'])?.text;
    }
    
    // Parse and convert JSDoc to markdown if found
    if (comment && isJSDoc(comment)) {
        const content = parseJSDoc(comment).toMarkdown();
        if (content) {
            return {
                contents: {
                    kind: 'markdown',
                    value: content
                }
            };
        }
    }
    
    return undefined;
}
```

This method is called from `getHoverContent` (lines 88-105) when a keyword is detected:

```typescript
if (cstNode.grammarSource?.$type === 'Keyword') {
    const keywordHover = this.getKeywordHoverContent(cstNode.grammarSource);
    if (keywordHover) {
        return keywordHover;
    }
    
    // Fallback: Custom DDD pattern dictionary
    const explanation = keywordExplanations[cstNode.text.toLowerCase()];
    if (explanation) {
        return {
            contents: {
                kind: 'markdown',
                value: `💡 ` + explanation
            }
        };
    }
}
```

## Content Sources

### 1. Grammar JSDoc (Future Enhancement)

To add automatic keyword documentation, add JSDoc comments before keywords in the grammar:

```langium
/** A domain represents a sphere of knowledge in DDD */
'domain' name=QualifiedName
```

When hovering over the `domain` keyword, users would see:
> A domain represents a sphere of knowledge in DDD

### 2. Custom Dictionaries (Current Implementation)

#### `src/language/lsp/hover/domain-lang-keywords.ts`
Provides rich DDD educational content for core keywords:
- `domain`, `boundedcontext`, `contextmap`
- Integration patterns: `acl`, `ohs`, `pl`, `cf`, `sk`
- Classifications: `core`, `supporting`, `generic`

#### `src/language/lsp/hover/ddd-pattern-explanations.ts`
Provides explanations for:
- **Role patterns**: `ACL`, `OHS`, `PL`, `CF`, `SK`, `P`, `BBoM`
- **Relationship types**: `Partnership`, `SharedKernel`, `CustomerSupplier`, `Conformist`
- **Context classifications**: `Core`, `Supporting`, `Generic`

### 3. Grammar Rule JSDoc (Instance Hover)

JSDoc comments on grammar rules appear when hovering instances:

```langium
/**
 * A bounded context represents an explicit boundary within which a domain model exists.
 * Teams, codebase, database schemas, and unified language should align with bc boundaries.
 */
BoundedContext:
    'boundedcontext' name=ID
    ...
```

Hovering over `CustomerManagement` (an instance) shows this documentation.

## Benefits of Hybrid Approach

### ✅ Advantages

1. **Best of both worlds**:
   - Automatic grammar-based documentation for syntax elements
   - Rich, DDD-specific explanations for patterns and concepts

2. **Progressive enhancement**:
   - Can add grammar JSDoc incrementally
   - Custom dictionaries remain as fallback and for advanced content

3. **Maintainability**:
   - Simple syntax docs near grammar definitions
   - Complex DDD pattern explanations in dedicated files

4. **Educational value**:
   - Beginners get basic syntax help from grammar JSDoc
   - Advanced users get DDD pattern guidance from dictionaries

### 🎯 Use Cases

| Hover Target | Source | Example Content |
|--------------|--------|-----------------|
| `domain` keyword | Custom dictionary | "💡 DDD Domain: A sphere of knowledge, influence, or activity..." |
| `Enterprise` domain | Grammar JSDoc | "A top-level domain representing the entire business..." |
| `acl` keyword | Custom dictionary | "💡 Anti-Corruption Layer: Translates between two contexts..." |
| `CustomerManagement` BC | Grammar JSDoc | "A bounded context represents an explicit boundary..." |

## Future Enhancements

### Option 1: Add Grammar JSDoc for Basic Keywords
Add JSDoc to frequently used keywords for quick syntax help:

```langium
/** Defines a domain - a sphere of knowledge in DDD */
'domain'

/** Defines a bounded context within a domain */
'boundedcontext'

/** Defines relationships between bounded contexts */
'contextmap'
```

### Option 2: Migrate Dictionary Content to Grammar
Move simpler explanations to grammar, keep complex DDD patterns in dictionaries.

### Option 3: Enhance Dictionary with Examples
Add code examples to dictionary entries for richer learning experience.

## Related Resources

- **Langium PR #1842**: "provide hover documentation on keywords"
  - https://github.com/eclipse-langium/langium/pull/1842
  - Merged April 6, 2024 into Langium 4.0
  - Enables `/** docs */ 'keyword'` syntax for automatic hover

- **DomainLang Grammar**: `src/language/domain-lang.langium`
- **Hover Provider**: `src/language/lsp/hover/domain-lang-hover.ts`
- **Keyword Dictionary**: `src/language/lsp/hover/domain-lang-keywords.ts`
- **Pattern Explanations**: `src/language/lsp/hover/ddd-pattern-explanations.ts`

## Testing Hover Behavior

### In VS Code Extension
1. Open a `.dlang` file
2. Hover over a keyword (e.g., `domain`)
3. Should see custom dictionary content with 💡 emoji
4. Hover over an instance (e.g., `Enterprise`)
5. Should see grammar JSDoc (if defined)

### Manual Testing Checklist
- [ ] Keyword hover shows custom content
- [ ] Instance hover shows JSDoc
- [ ] Missing JSDoc falls back gracefully
- [ ] Markdown formatting renders correctly
- [ ] Multi-line documentation displays properly
