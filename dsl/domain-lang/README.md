# DomainLang

DomainLang is a Domain-Driven Design (DDD) modeling language and toolchain that lets you describe domains, bounded contexts, and strategic relationships as executable specifications. You express the shape of your domain in a concise DSL, validate it with first-class tooling, and generate artifacts for downstream teams.

## Why DomainLang

- **Purpose-built DSL** – Capture domains, bounded contexts, teams, classifications, and context maps with language constructs that mirror DDD tactics.
- **Executable architecture** – Run validations, dependency analysis, and code generation straight from the model to keep system knowledge in sync.
- **Git-native imports** – Compose models and share reusable patterns with repository-based packages using GitHub-style shorthand (`owner/repo@tag`) and explicit version constraints.
- **Integrated tooling** – Use the CLI, VS Code extension, Monaco playgrounds, and generators backed by Langium and Node.js.

## DSL at a Glance

The language is optimized for strategic DDD work. This end-to-end example combines local, workspace, and remote imports with bounded contexts, terminology, strategic relationships, and team ownership:

```dlang
// Bring in shared vocabulary and external patterns
import "./shared/classifications.dlang"
import "~/contexts/payments.dlang" as Payments
import "ddd-patterns" as Patterns

group CustomerFacingPlatform {
   BC Listings for Inventory as Core by ProductTeam {
      description: "Product listings and catalog"

      language {
         term Product: "Item for sale"
            aka: SKU, Item
            examples: "Laptop #12345", "Mouse #67890"
      }

      classifiers {
         role: Patterns.AggregateRoot
         lifecycle: SharedClassifications.CoreDomain
      }

      constraints {
         decision [architectural] EventSourcing: "Capture every product change"
         policy [business] NoBackorders: "Do not allow orders without stock"
      }
   }

   BC Checkout for Sales as Supporting by Payments.Team {
      description: "Checkout and payment orchestration"

      uses Payments.PaymentGateway

      terminology {
         term CheckoutSession: "Customer journey from cart to payment"
      }
   }

   ContextMap relationships {
      contains Listings, Checkout
      [OHS] Checkout -> [ACL] Listings : CatalogLookup
      [SK] Checkout <-> Payments.Settlements : SharedKernel
   }

   Domain Inventory in Enterprise {
      description: "Product inventory management"
      classifier: Supporting
   }

   Team ProductTeam
}

ContextGroup CoreDomains for Enterprise {
   role: Core
   contains Listings
}

group SharedClassifications {
   Classification CoreDomain
   Classification SupportingDomain
}
```

Key concepts from the grammar and test suite include:

- `Domain`, `BoundedContext`, and `ContextGroup` blocks for organizing strategic design.
- Classifications, business models, and evolution tags for contextual metadata.
- Rich terminology sections with synonyms and examples to align ubiquitous language.
- Context maps with relationship types like OHS/ACL and Shared Kernel links.
- Team declarations, governance constraints, and cross-context usage statements for accountability and integration.

➡️ For a construct-by-construct breakdown of the DSL, including imports, documentation blocks, maps, and decision records, read the [DomainLang syntax reference](docs/language.md).

## CLI Essentials

The `domainlang` CLI wraps validation, generation, and dependency management. Commands map directly to the services covered by the unit and integration tests under `test/cli` and `test/services`.

```bash
# Validate a model and surface diagnostics
domainlang validate path/to/model.dlang

# Emit JavaScript bindings for the model (JSON/TS emitters are on the roadmap)
domainlang generate path/to/model.dlang --destination dist/

# Work with git-native model dependencies
domainlang install              # install dependencies and write lock file
domainlang model list           # inspect installed bounded contexts
domainlang model add sales acme/ddd-sales-platform v1.2.0
domainlang model tree --commits # inspect the resolved dependency graph
```

Each command operates on the current workspace and is backed by services such as `validateModel`, `showDependencyTree`, and `generateJavaScript` defined in `src/cli`. Errors are reported with helpful diagnostics so you can iterate quickly.

### Workspace manifest (`model.yaml`)

The `WorkspaceManager` treats `model.yaml` as the anchor for discovery, and several services consume different sections:

- `GitUrlResolver` reads `model.entry` (or the legacy `model.main`) to choose the package entry file, defaulting to `index.dlang` when omitted.
- `DependencyResolver` loads `dependencies` to resolve packages and build `model.lock`.
- `DependencyAnalyzer` inspects both the workspace manifest and cached dependency manifests to build trees and detect cycles.
- `GovernanceValidator` evaluates `governance` policies and `metadata` ownership details to enforce organizational rules.

Dependency sources use the `owner/repo` shorthand; GitHub is assumed when no host prefix is provided, and versions follow the familiar `@tag`, branch, or commit naming.

```yaml
model:
   name: customer-facing-platform
   version: 1.0.0
   entry: contexts/customer-facing.dlang

dependencies:
   ddd-patterns:
      source: ddd-patterns/core
      version: v2.1.0
      description: "Reusable DDD architectural patterns"
   payments-shared:
      source: acme/payments-platform
      version: main

metadata:
   team: Core Domain Guild
   contact: core-domains@example.com
   domain: Customer Experience
   compliance:
      - pci-dss

governance:
   allowedSources:
      - github.com/acme
   requireStableVersions: true
   requireTeamOwnership: true
```

The CLI updates this manifest when you run `model add`, `model remove`, or `install`, and the generated `model.lock` pins the resolved commits so repeated builds stay reproducible.

#### Importing by manifest name

Manifest entries double as friendly import names. When `dependencies.ddd-patterns` is declared, any source file in the workspace can import the package without repeating the repository and version:

```dlang
// Friendly alias is expanded to ddd-patterns/core@v2.1.0
import "ddd-patterns" as Patterns
import "ddd-patterns/patterns.dlang"
```

The language server resolves these imports through the manifest, rewrites them to the pinned `owner/repo@version` string, and hands off to the git resolver using the locked commit from `model.lock`.

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Generate the language artifacts**

   ```bash
   npm run langium:generate
   ```

3. **Build and test**

   ```bash
   npm run build
   npm test
   ```

4. **Explore models** – Open the repo in VS Code for language server support, or open `static/monacoExtended.html` in a browser to try the Monaco playground.

## Tooling & Ecosystem

- **VS Code Extension** – Leverages the Langium-based LSP to provide completion, hovers, go-to-definition, diagnostics, and rename.
- **CLI Generators** – Produce JavaScript today; TypeScript, JSON, and diagram emitters are planned (see `src/cli/generator.ts`).
- **Import System** – Designed for repository-scoped packages with lock files, caching, and transitive dependency management. Decision records in the repository capture the roadmap for versioning and caching behavior.
- **Testing** – Extensive suites under `test/` cover parsing, linking, validation, and dependency analysis using Langium’s testing utilities.
- **Documentation** – The [syntax reference](docs/language.md) and `docs/` diagrams explain every language construct and how services consume them.

## Contributing & Roadmap

DomainLang is under active development—especially the dependency-aware import system and richer generators. Community feedback, issues, and pull requests are welcome at [github.com/larsbaunwall/domainlang](https://github.com/larsbaunwall/domainlang).

---

**Developer Note**: If you rely on GitHub Copilot in this repository, read `.github/copilot-instructions.md` for project-specific guidance.
