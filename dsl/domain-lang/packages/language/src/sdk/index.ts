/**
 * Model Query SDK - Public API
 * 
 * Provides fluent, type-safe query operations on DomainLang models.
 * 
 * ## Architecture: SDK vs LSP Responsibilities
 * 
 * The SDK is **read-only and query-focused**. It does NOT manage:
 * - Workspace lifecycle (LSP/WorkspaceManager handles this)
 * - File watching or change detection (LSP/TextDocuments handles this)
 * - Cross-file import resolution (LSP/DocumentBuilder handles this)
 * - Document validation scheduling (LSP handles this)
 * 
 * **SDK responsibilities:**
 * - Augmented AST properties (transparent property access with precedence rules)
 * - Fluent query chains with lazy iteration
 * - O(1) indexed lookups by FQN/name
 * - Resolution rules (which block wins for 0..1 properties)
 * 
 * **Entry points for different deployment targets:**
 * 
 * | Target | Entry Point | Browser-Safe | Notes |
 * |--------|-------------|--------------|-------|
 * | VS Code Extension | `fromDocument()` | ✅ | Zero-copy LSP integration |
 * | Web Editor | `fromDocument()`, `loadModelFromText()` | ✅ | Browser-compatible |
 * | CLI (Node.js) | `loadModel()` from `sdk/loader-node` | ❌ | File system access |
 * | Hosted LSP | `fromDocument()`, `fromServices()` | ✅ | Server-side only |
 * | Testing | `loadModelFromText()` | ✅ | In-memory parsing |
 * 
 * ## Browser vs Node.js
 * 
 * This module (`sdk/index`) is **browser-safe** and exports only:
 * - `loadModelFromText()` - uses EmptyFileSystem
 * - `fromModel()`, `fromDocument()`, `fromServices()` - zero-copy wrappers
 * 
 * For file-based loading in Node.js CLI tools:
 * ```typescript
 * import { loadModel } from 'domain-lang-language/sdk/loader-node';
 * ```
 * 
 * @packageDocumentation
 * 
 * @example
 * ```typescript
 * // Node.js CLI: Load from file (requires sdk/loader-node)
 * import { loadModel } from 'domain-lang-language/sdk/loader-node';
 * 
 * const { query } = await loadModel('./domains.dlang', {
 *   workspaceDir: process.cwd()
 * });
 * 
 * const coreContexts = query.boundedContexts()
 *   .withClassification('Core')
 *   .withTeam('PaymentTeam');
 * 
 * for (const bc of coreContexts) {
 *   console.log(`${bc.name}: ${bc.description ?? 'n/a'}`);
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Browser/Testing: Load from text (browser-safe)
 * import { loadModelFromText } from '@domainlang/language/sdk';
 * 
 * const { query } = await loadModelFromText(`
 *   Domain Sales { vision: "Handle sales" }
 *   bc OrderContext for Sales
 * `);
 * 
 * const sales = query.domain('Sales');
 * console.log(sales?.vision);
 * ```
 * 
 * @example
 * ```typescript
 * // LSP Integration: Zero-copy access to existing AST (browser-safe)
 * import { fromDocument } from '@domainlang/language/sdk';
 * 
 * export class HoverProvider {
 *   getHover(document: LangiumDocument<Model>) {
 *     // SDK wraps existing AST - no reloading, no file I/O
 *     const query = fromDocument(document);
 *     const bc = query.boundedContext('OrderContext');
 *     return bc?.description;
 *   }
 * }
 * ```
 */

// Browser-safe entry points
export { loadModelFromText } from './loader.js';
export { fromModel, fromDocument, fromServices, augmentModel } from './query.js';

// Note: loadModel() is NOT exported here - it requires Node.js filesystem
// For CLI/Node.js usage: import { loadModel } from '@domainlang/language/sdk/loader-node';

// Integration patterns for type-safe pattern matching (no magic strings)
export {
    Pattern,
    PatternFullName,
    PatternAliases,
    matchesPattern,
    isUpstreamPattern,
    isDownstreamPattern,
    isMutualPattern,
    UpstreamPatterns,
    DownstreamPatterns,
    MutualPatterns,
} from './patterns.js';

export type { IntegrationPattern } from './patterns.js';

// AST augmentation - import for type declarations
// Usage: import '@domainlang/language/sdk/ast-augmentation';
// This enables native SDK properties on AST types via declaration merging

// Public types
export type {
    Query,
    QueryBuilder,
    QueryContext,
    LoadOptions,
    BcQueryBuilder,
    RelationshipView,
} from './types.js';
