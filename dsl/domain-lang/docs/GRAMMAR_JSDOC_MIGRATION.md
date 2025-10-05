# Grammar JSDoc Migration - Complete

## Overview

Successfully migrated basic keyword documentation from TypeScript dictionaries to JSDoc comments in the grammar file itself. This leverages Langium 4.0's automatic keyword hover feature (PR #1842) for cleaner, more maintainable documentation.

## What Was Moved

### ✅ Migrated to Grammar JSDoc

The following keywords now have JSDoc comments directly in `src/language/domain-lang.langium`:

| Keyword | Location | Documentation |
|---------|----------|---------------|
| `domain` | Line 238 | "A Domain represents a sphere of knowledge..." |
| `boundedcontext` | Line 279 | "A Bounded Context defines the boundary..." |
| `group` | Line 87 | "A group is a namespace for organizing..." |
| `package` | Line 110 | "Package declarations organize large models..." |
| `contextmap` | Line 385 | "A Context Map visualizes and documents..." |
| `domainmap` | Line 405 | "A Domain Map visualizes and documents..." |
| `team` | Line 353 | "A Team represents the people responsible..." |
| `classification` | Line 339 | "A Classification is a reusable label..." |
| `decision` | Line 498 | "A documented choice or rule..." |
| `policy` | Line 507 | "A business rule or guideline..." |
| `import` | Statement rule | "Imports types or groups from another file..." |

### 🎯 Kept in Dictionary (Fallback)

The following remain in `domain-lang-keywords.ts` for richer DDD pattern explanations:

**Advanced Syntax Keywords:**
- `implements`, `as`, `from`, `type`, `map`, `this`

**DDD Classifiers:**
- `entity`, `valueobject`, `aggregate`, `service`, `event`, `businessrule`

**DDD Integration Patterns** (these need richer explanations):
- `acl` - Anti-Corruption Layer
- `ohs` - Open Host Service  
- `pl` - Published Language
- `cf` - Conformist
- `bbom` - Big Ball of Mud
- `sk` - Shared Kernel
- `p` - Partnership

**DDD Relationship Types:**
- `separateways`, `partnership`, `sharedkernel`, `customersupplier`, `upstreamdownstream`

**Relationship Arrows:**
- `<->`, `->`, `<-`

## How It Works

### Priority Cascade

When a user hovers over a keyword in VS Code:

1. **First**: Check for JSDoc in grammar file
   - Grammar parser attaches JSDoc to keyword AST nodes
   - `getKeywordHoverContent()` extracts via `isAstNodeWithComment(node).$comment`
   - Converts JSDoc to markdown via `parseJSDoc().toMarkdown()`

2. **Second**: Fallback to custom dictionary
   - If no grammar JSDoc found, check `keywordExplanations` dictionary
   - Returns rich DDD pattern explanation with examples

3. **Third**: Returns undefined (no hover)
   - Langium default behavior

### Implementation

**Grammar JSDoc Syntax:**
```langium
/** A Domain represents a sphere of knowledge, influence, or activity. */
'domain' name=ID
```

**Custom Dictionary Syntax:**
```typescript
export const keywordExplanations: Record<string, string> = {
    acl: "**ACL (Anti-Corruption Layer)**\n\nA defensive pattern...",
    // ...
};
```

## Benefits

### ✅ Advantages

1. **Co-location**: Basic syntax documentation lives with grammar definitions
2. **Automatic**: No manual dictionary maintenance for basic keywords
3. **Type-safe**: Grammar changes automatically update documentation structure
4. **Maintainable**: Easier to keep docs in sync with grammar changes
5. **Separation of concerns**:
   - Grammar JSDoc = basic syntax ("what is this keyword?")
   - Dictionary = DDD patterns ("how/why do I use this?")

### 📊 Metrics

- **Moved to grammar**: 11 basic keywords
- **Kept in dictionary**: 23 advanced/pattern keywords
- **Lines removed from dictionary**: ~150
- **Lines added to grammar**: ~11 (one JSDoc per keyword)
- **Net reduction**: ~140 lines across codebase

## Testing

All tests pass ✅ (82 passed, 2 skipped):

```bash
npm run langium:generate  # Regenerate with JSDoc
npm run build             # Build with new grammar
npm test                  # All tests pass
```

## Usage Examples

### For Basic Keywords (Grammar JSDoc)

Hovering `domain` keyword shows:
> A Domain represents a sphere of knowledge, influence, or activity. In DDD, it is the subject area to which the user applies a program. Example: Sales, Shipping, Accounting.

### For Pattern Keywords (Dictionary)

Hovering `acl` keyword shows:
> 💡 **ACL (Anti-Corruption Layer)**
>
> A defensive pattern that creates a translation layer between two bounded contexts to prevent concepts from one context polluting the other.
>
> ---
>
> *Example: A layer that translates legacy system data formats into modern domain models.*

Note the 💡 emoji prefix indicates dictionary-sourced content.

## Future Enhancements

### Option 1: Migrate More to Grammar

Could move DDD classifiers to grammar JSDoc:

```langium
/** An entity is a domain object with a distinct identity. */
'entity' ...
```

**Trade-off**: Simpler grammar JSDoc vs richer dictionary explanations

### Option 2: Enhance Dictionary with Links

Add cross-references in dictionary entries:

```typescript
acl: "**ACL**\n\nSee also: OHS, PL\n\n[Learn more](https://ddd.link/acl)"
```

### Option 3: Extract to Separate Documentation

Move complex pattern explanations to dedicated markdown files:

```typescript
acl: fs.readFileSync('docs/patterns/acl.md', 'utf-8')
```

## Migration Guide

To add JSDoc to a new keyword:

1. **Find the keyword in grammar:**
   ```langium
   'domain' name=ID
   ```

2. **Add JSDoc before the keyword:**
   ```langium
   /** Your documentation here */
   'domain' name=ID
   ```

3. **Regenerate grammar:**
   ```bash
   npm run langium:generate
   ```

4. **Test in VS Code:**
   - Open a `.dlang` file
   - Hover over the keyword
   - Should see JSDoc documentation

5. **Remove from dictionary** (if applicable):
   - Edit `src/language/lsp/hover/domain-lang-keywords.ts`
   - Remove the keyword entry

## Related Files

- **Grammar**: `src/language/domain-lang.langium`
- **Keyword Dictionary**: `src/language/lsp/hover/domain-lang-keywords.ts`
- **Pattern Explanations**: `src/language/lsp/hover/ddd-pattern-explanations.ts`
- **Hover Provider**: `src/language/lsp/hover/domain-lang-hover.ts`
- **Documentation**: `docs/HOVER_IMPLEMENTATION.md`

## References

- **Langium PR #1842**: "provide hover documentation on keywords"
  - https://github.com/eclipse-langium/langium/pull/1842
  - Merged April 6, 2024 into Langium 4.0
  - Enables automatic keyword hover from grammar JSDoc

- **Implementation Pattern**: `getKeywordHoverContent()` method
  - Follows exact pattern from PR #1842
  - Uses `isAstNodeWithComment()`, `CstUtils.findCommentNode()`, `parseJSDoc()`
  - No type casting, proper Langium APIs throughout
