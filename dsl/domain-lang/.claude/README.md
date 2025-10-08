# Claude Configuration for DomainLang

**5 specialized agents + 8 rule files | Expert team + comprehensive guidance**

## Quick Reference

### Specialized Agents (`agents/`)

Use these experts for complex tasks requiring specialized knowledge:

| Agent | Expertise | When to Use |
|-------|-----------|-------------|
| **software-architect** | Strategic design, ADRs, PRSs | Feature planning, architectural decisions |
| **language-designer** | Language design, syntax, semantics | Grammar design, syntax decisions |
| **lead-engineer** | Hands-on implementation, Langium/TS | Feature implementation, code reviews |
| **tester** | Unit/integration testing, Vitest | Test strategy, comprehensive test suites |
| **technical-writer** | Documentation, JSDoc | API docs, user guides, examples |

**Example:** `@software-architect: Should we support nested domains? Create ADR and PRS.`

### Technical Rules (`rules/`)

| Rule File | Lines | Purpose |
|-----------|-------|---------|
| `00-project-context.md` | 129 | Project overview, structure, commands |
| `01-critical-rules.md` | 125 | Non-negotiable rules (read FIRST) |
| `02-typescript.md` | 432 | TypeScript coding standards |
| `03-langium.md` | 478 | Langium framework guidelines |
| `04-testing.md` | 538 | Testing patterns and best practices |
| `05-git-commits.md` | 477 | Git workflow and commit conventions |
| `06-documentation.md` | 591 | Documentation standards |
| `07-performance.md` | 536 | Performance optimization |

## How Claude Code Uses These Rules

Claude Code automatically loads rules based on context:

1. **Always loads first:**
   - `00-project-context.md` - Project structure and commands
   - `01-critical-rules.md` - Non-negotiable rules

2. **File-pattern based loading:**
   - `**/*.ts` → `02-typescript.md` + `04-testing.md` + `07-performance.md`
   - `**/*.langium` → `03-langium.md` + `01-critical-rules.md`
   - `src/language/**` → `03-langium.md` + `02-typescript.md` + `07-performance.md`
   - `test/**` → `04-testing.md` + `02-typescript.md`
   - `**/*.md` → `06-documentation.md`

3. **Task-specific loading:**
   - Committing → `05-git-commits.md`
   - Performance issues → `07-performance.md`
   - Writing tests → `04-testing.md`

## Team-Based Workflow (Recommended for Complex Tasks)

### Adding a New Language Feature (with agents)

**Phase 1: Strategic Design**
```
@software-architect: We need to add domain aliases. Create PRS and ADR.
```
- Architect creates PRS-XXX-domain-aliases.md (requirements)
- Architect creates ADR-XXX-alias-semantics.md (architectural decision)
- Architect delegates to language-designer for syntax design

**Phase 2: Language Design**
```
@language-designer: Design syntax for domain aliases, comparing with TypeScript, SQL, etc.
```
- Designs syntax: `Domain Sales aka Revenue, Income`
- Defines semantics: aliases are alternative names
- Sketches grammar and validation rules

**Phase 3: Implementation**
```
@lead-engineer: Implement domain aliases per ADR-XXX and language-designer's grammar sketch
```
- Implements grammar, validation, LSP features
- Collaborates with @tester for test strategy
- Collaborates with @technical-writer for docs

**Phase 4: Testing**
```
@tester: Comprehensive test suite for domain aliases with edge cases
```
- Writes unit, integration, parsing, validation tests
- Explores edge cases (unicode, empty, long names)
- Ensures 80%+ coverage

**Phase 5: Documentation**
```
@technical-writer: Document domain aliases feature with examples
```
- Adds JSDoc to AST types
- Creates user guide with examples
- Updates README

## Quick Navigation by Task (Traditional)

### Adding a New Language Feature
```
01-critical-rules.md → 03-langium.md → 02-typescript.md → 04-testing.md → 06-documentation.md
```
1. Check grammar workflow (never edit generated files)
2. Learn grammar syntax and document lifecycle
3. Follow TypeScript standards (naming, JSDoc)
4. Write tests (parsing + linking + validation)
5. Document with JSDoc and examples

### Fixing a Bug
```
04-testing.md → 02-typescript.md → 04-testing.md → 05-git-commits.md
```
1. Write failing test first
2. Fix using TypeScript best practices
3. Verify test passes
4. Commit with proper message format

### Optimizing Performance
```
07-performance.md → 03-langium.md → 02-typescript.md → 04-testing.md
```
1. Profile with `--profile` flag, identify bottleneck
2. Understand document lifecycle phase
3. Apply optimization techniques (caching, Promise.all)
4. Add performance benchmark test

### Creating a Pull Request
```
01-critical-rules.md → 05-git-commits.md
```
1. Verify all checks pass (build, test, lint)
2. Review commit messages
3. Write PR description

## Core Concepts by Rule File

### 00-project-context.md
- What DomainLang does (DDD modeling language)
- Tech stack (Langium 4.x, TypeScript, Node 18+, Vitest)
- Essential commands (langium:generate, build, test)
- Project structure (src/language, src/cli, test)
- Working directory: `dsl/domain-lang/`

### 01-critical-rules.md ⚠️ READ FIRST
- **NEVER** edit `src/language/generated/**`
- Grammar workflow: edit .langium → `npm run langium:generate` → `npm run build` → test
- Keep changes focused (smallest useful diff)
- Always add tests (no exceptions)
- TypeScript strict mode (no exceptions)
- Build must pass before commit

### 02-typescript.md
- Naming: PascalCase (types), camelCase (functions), kebab-case (files)
- Type system: interfaces over types, avoid enums, no `any`
- JSDoc for all public APIs (shown in hover tooltips)
- Performance: `Promise.all()` for parallel, lodash for collections
- Error handling: typed results, never suppress
- Immutability: return new objects, don't mutate

### 03-langium.md
- Grammar basics: `=` (single), `+=` (array), `[Type:Token]` (cross-ref)
- Document lifecycle: Parsed → Indexed → **Scoped** → Linked → Validated
  - **Critical:** Cannot access cross-refs during Scoped phase
- Scoping: `ScopeComputation` (phase 3) vs `ScopeProvider` (phase 4)
- Validation: Use `@Check` decorator, report with `ValidationAcceptor`
- Testing: `parseHelper`, `validationHelper`, `expectError`

### 04-testing.md
- Always test: happy path + edge cases + error scenarios
- Use LangiumTest utilities: `parseHelper`, `validationHelper`
- Test organization: `test/{parsing,linking,validating,services,integration}`
- Coverage goal: 80%+ overall, 100% for validation rules
- Performance testing: Benchmark critical paths

### 05-git-commits.md
- Format: Imperative title + two blank lines + body + issue refs
- No trailing punctuation in title
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
- Body: Explain WHY, not just WHAT
- Breaking changes: Use `BREAKING CHANGE:` in body

### 06-documentation.md
- JSDoc required for all public APIs
- Style: Active voice, present tense (Google Technical Writing Guide)
- Grammar comments: Document DDD concepts in .langium file
- Examples: Minimal, focused, runnable
- ADRs: Document major decisions in `docs/adr/`

### 07-performance.md
- LSP targets: Parsing < 100ms, Validation < 200ms, Completion < 50ms
- Common pitfalls: Expensive `ScopeComputation`, repeated computations
- Caching: Use `WorkspaceCache` for automatic invalidation
- Profiling: `--profile` flag, Node.js profiler
- Parallel execution: `Promise.all()` for independent operations

## Alignment with Existing Instructions

| Source | Lines | Status |
|--------|-------|--------|
| `.github/copilot-instructions.md` | 107 | ✅ Expanded 37x to 3,550 lines |
| `.github/instructions/typescript.instructions.md` | 143 | ✅ Expanded 3x to 432 lines |
| `.github/instructions/langium.instructions.md` | 155 | ✅ Expanded 3x to 478 lines |
| `.github/instructions/architecture.instructions.md` | 139 | ✅ Integrated into 06-documentation.md |
| `.github/chatmodes/langium-expert.chatmode.md` | 162 | ✅ Knowledge integrated throughout |

**All content fully incorporated with significant expansions.**

## Common Workflows

### Workflow: Adding Validation Rule

```typescript
// 1. Create validator in src/language/validation/
@Check(Domain)
checkDomainName(domain: Domain, accept: ValidationAcceptor): void {
    if (domain.name.startsWith('_')) {
        accept('error', 'Domain names cannot start with underscore', {
            node: domain,
            property: 'name'
        });
    }
}

// 2. Add test in test/validating/
test('reject domain names starting with underscore', async () => {
    const document = await parse(`Domain _Invalid {}`);
    expect(document.diagnostics).toHaveLength(1);
    expect(document.diagnostics[0].message).toContain('underscore');
});

// 3. Run: npm run build && npm test
// 4. Commit: "feat: Add validation for domain name format"
```

### Workflow: Grammar Change

```bash
# 1. Edit grammar
vim src/language/domain-lang.langium

# 2. Regenerate parser (CRITICAL - never skip this)
npm run langium:generate

# 3. Build TypeScript
npm run build

# 4. Add/update tests
npm test

# 5. Commit with grammar change explanation
git commit -m "feat: Add support for domain aliases"
```

### Workflow: Performance Optimization

```bash
# 1. Profile to find bottleneck
domain-lang-cli generate example.dlang --profile

# 2. Identify slow operation (e.g., scope computation)
# 3. Add WorkspaceCache
# 4. Verify performance improved
# 5. Add benchmark test
# 6. Document changes
```

## File Pattern → Rules Mapping

| Pattern | Primary | Secondary | Why |
|---------|---------|-----------|-----|
| `src/language/*.langium` | 03 | 01, 06 | Grammar definitions |
| `src/language/generated/**` | 01 | - | NEVER EDIT |
| `src/language/validation/**` | 03, 02 | 04, 06 | Validation rules |
| `src/language/lsp/**` | 03, 02 | 07 | LSP features |
| `src/language/services/**` | 03, 02 | 07 | Language services |
| `test/**/*.test.ts` | 04 | 02 | All tests |
| `*.md` | 06 | - | Documentation |

## Maintenance

### Update Triggers
- New Langium version (update 03-langium.md)
- New language features (update 00-project-context.md + 03-langium.md)
- Process improvements (update relevant rule file)
- Common mistakes discovered (add to 01-critical-rules.md)

### Quality Standards
- ✅ Consistent across files (no contradictions)
- ✅ Complete but concise
- ✅ Actionable with concrete examples
- ✅ Up-to-date with current practices

### Review Schedule
- **Minor updates:** As needed (typos, clarifications)
- **Major review:** Quarterly
- **Alignment check:** When `.github/` instructions change

## Resources

- **Project README:** `../../README.md`
- **Grammar:** `src/language/domain-lang.langium`
- **Examples:** `static/*.dlang`
- **GitHub Instructions:** `.github/instructions/*.md`
- **Copilot Instructions:** `.github/copilot-instructions.md`

---

**Last Updated:** 2025-10-08
**Status:** Production ready ✅
**For Claude Code by Claude Code**
