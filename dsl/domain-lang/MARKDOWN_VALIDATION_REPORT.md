# DomainLang Markdown Code Validation Report

## Summary

Validation test found **25 failing dlang code blocks** across markdown documentation files. This document identifies the issues and recommended fixes.

## Failing Code Blocks

### docs/language.md

#### Block 3 (line 167): Namespace Example

**Issue**: Qualified name `Shared.CoreDomain` in Domain.classification not supported

**Fix**: Remove qualification or use different example

#### Block 7 (line 265): BC Documentation Example

**Issue**: Invalid syntax with `businessModel: B2B` and `lifecycle: CustomBuilt` - these should be references to Classifications, not direct strings

**Fix**: Declare Classifications and reference them

#### Block 10 (line 336): Metadata Standalone Block

**Issue**: Metadata blocks shown standalone without bounded context

**Fix**: Wrap examples in a bounded context

#### Blocks 13-14 (lines 440, 458): Standalone Terminology and Decisions

**Issue**: Shown as standalone blocks outside bounded contexts

**Fix**: Wrap in bounded contexts

#### Block 21 (line 637): Qualified Name Issue

**Issue**: `Strategic.CoreDomain` - undefined Strategic classification

**Fix**: Import or declare Strategic classification first

#### Block 22 (line 668): Advanced Example with Lowercase Namespace

**Issue**: Uses `namespace` (lowercase) instead of `Namespace`, and references `Patterns.SupportingSubdomain` which might not exist

**Fix**: Use `Namespace` (capitalized)

### docs/getting-started.md

#### Block 10 (line 522): Common Pitfalls - Invalid Syntax Example

**Issue**: Shows incorrect syntax with `term Book "A book"` (missing colon) which may parse as error example

**Fix**: Ensure marked as ❌ example not to be copied

### docs/quick-reference.md

#### Block 1 (line 63): Inline Syntax Example

**Issue**: Missing Domain declaration that `Orders` refers to

**Fix**: Add `Domain Sales { ... }` before bc examples

#### Block 2 (line 82): Documentation Blocks with `...` placeholders

**Issue**: Uses `...` in nested blocks which is invalid syntax

**Fix**: Replace with actual terminology/decision examples

#### Block 4 (line 140): Standalone Terminology

**Issue**: Standalone terminology block without bounded context wrapper

**Fix**: Wrap in `bc ... { terminology { ... } }`

#### Block 6 (line 173): Standalone Decisions

**Issue**: Standalone decisions block without context

**Fix**: Wrap in bounded context

#### Block 7 (line 198): Named Relationships with Invalid Type

**Issue**: Uses `IntegrationName` as a relationship type but only valid types are: Partnership, SharedKernel, CustomerSupplier, UpstreamDownstream, SeparateWays

**Fix**: Use a valid relationship type or remove the type label

#### Block 8 (line 236): Import with Named Imports

**Issue**: Uses `Team` as an imported symbol but `Team` is a keyword, not an importable type

**Fix**: Show importing of actual types like Classifications

#### Block 10 (line 273): Assignment Operators

**Issue**: `bc Orders` without specifying domain for Orders

**Fix**: Add `Domain Sales { ... }` declaration

#### Block 17 (line 394): Composite BC Example

**Issue**: `businessModel: B2B` - B2B should be a Classification reference, not a string

**Fix**: Declare `Classification B2B` first or use valid values

## Root Causes

1. **Qualified Names in Properties**: Documentation shows using qualified names (e.g., `Shared.CoreDomain`) in places where the grammar only accepts direct references. This is particularly true for Domain.classification and BC properties.

2. **Standalone Documentation Blocks**: Many examples show terminology, metadata, decisions, and relationships blocks as standalone top-level constructs, but they only exist inside bounded contexts in the actual grammar.

3. **Placeholder Syntax**: Examples use `...` as a placeholder for "the rest of the code" but this isn't valid syntax.

4. **Missing Context**: Examples reference domains/classifications that aren't shown in the code block.

5. **Invalid Property Values**: Examples show non-reference values (like `"B2B"` string) for properties that expect Classification references.

## Recommendations

1. Update all standalone documentation blocks to be wrapped in a minimal bounded context
2. Replace `...` placeholders with minimal working code
3. Remove qualified name references unless the feature is explicitly supported by the grammar
4. Ensure all referenced items (Classifications, Teams, Domains) are defined in the code block or clearly marked as external references
5. Use actual Classification names instead of string values for role/businessModel/lifecycle properties
