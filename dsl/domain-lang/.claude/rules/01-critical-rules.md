# Critical Rules - Non-Negotiable

## Grammar and Generated Code

### NEVER Edit Generated Files

**NEVER** manually edit files in `src/language/generated/**`:
- `ast.ts` - Generated AST types
- `grammar.ts` - Generated grammar
- `module.ts` - Generated module

These files are automatically regenerated from the `.langium` grammar file.

### Grammar Change Workflow

When modifying the language grammar:

1. Edit `src/language/domain-lang.langium`
2. Run `npm run langium:generate` to regenerate parser
3. Run `npm run build` to compile TypeScript
4. Add/update tests for the grammar changes
5. Test in VS Code extension and browser demo

**ALWAYS** regenerate immediately after grammar changes. Do not commit `.langium` changes without regenerating.

## File References

When discussing code in prompts or documentation:
- **Reference files explicitly** (e.g., `@domain-lang.langium`, `@domain-lang-module.ts`)
- **Include line numbers** when pointing to specific code: `file.ts:123`
- This improves clarity and makes it easier to navigate

## Change Discipline

### Keep Changes Focused

- **Smallest useful diff** per edit
- One logical change per commit
- Don't refactor unrelated code in the same commit
- Don't add meta comments explaining what changed (use git commit messages instead)

### Respect User Corrections

- If the user corrects your code, **don't revert their edits**
- Learn from corrections and apply the pattern consistently
- Ask for clarification only when a detail blocks progress

## Consulting Rules

**Before making any code changes:**

1. Check if specialized rules apply (e.g., `03-langium.md` for grammar work)
2. Review the relevant `.claude/rules/*.md` files
3. Check `.github/instructions/*.md` for additional context
4. Follow the patterns established in existing code

Failure to consult rules leads to rework and inconsistency.

## TypeScript Strict Mode

**No exceptions** - all TypeScript must compile under strict mode:
- No `any` types without explicit justification
- No `@ts-ignore` or `@ts-expect-error` without comments explaining why
- Prefer type guards over type assertions

## Testing Requirements

**Always add tests for new behavior:**
- Happy path
- Edge cases
- Error scenarios

Use `LangiumTest` utilities for language features:
- `parseHelper` for parsing tests
- `validationHelper` for validation tests
- `expectError` for error scenarios
- `clearDocuments()` between tests

## Build Verification

**Before committing:**
1. Run `npm run build` - must succeed
2. Run `npm test` - must pass
3. Run `npm run lint` - must pass

Do not commit code that fails these checks.

## Documentation Updates

**When changing public APIs:**
- Update JSDoc comments (shown in hover tooltips)
- Update README if user-facing behavior changes
- Update examples in `static/` if relevant
- Maintain changelog for grammar evolution

## Version Control

- Use **SemVer** for language versioning
- CLI must **warn on incompatible grammar revisions**
- Breaking grammar changes require major version bump
- Document breaking changes in changelog

## Security and Safety

- Never commit sensitive information (API keys, tokens)
- Never suppress errors silently
- Handle expected failures explicitly with typed results
- Add validation for user input in CLI commands

## Performance Awareness

For language servers, performance is critical:
- Use `WorkspaceCache` for expensive computations
- Leverage `Promise.all()` for parallel async operations
- Optimize scope computation (runs frequently)
- Profile with `--profile` flag when optimizing

## Shortcuts (User-Triggered)

When the user types these shortcuts:
- **CURSOR:PAIR** - Act as pair programmer, provide alternatives and trade-offs
- **RFC** - Refactor per provided instructions
- **RFP** - Improve prompt clarity per Google's Technical Writing Style Guide

These are workflow accelerators, not commands to be executed unprompted.
