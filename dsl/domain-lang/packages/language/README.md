# domain-lang-language

This package contains the DomainLang grammar, language services (parsing, linking, validation), and the Model Query SDK.

## Key paths

- src/domain-lang.langium: grammar
- src/generated/: generated output from Langium (do not edit)
- src/validation/: semantic validation rules
- src/lsp/: LSP features (hover, completion, formatting)
- src/sdk/README.md: Model Query SDK documentation

## Common workflows

From the workspace root (dsl/domain-lang/):

```bash
# After editing packages/language/src/domain-lang.langium
npm run langium:generate

# Build just this package
npm run build --workspace packages/language

# Run tests
npm test --workspace packages/language
```

## Testing

Tests live in test/ and cover parsing, linking, validation, scoping, and services.

If you change the grammar or validation behavior, add or update tests alongside the change.
