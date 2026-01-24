import path from 'node:path';
import { URI, type LangiumDocument, type LangiumDocuments } from 'langium';
import type { Model } from '../generated/ast.js';
import type { GitUrlResolver } from '../services/git-url-resolver.js';
import { WorkspaceManager } from '../services/workspace-manager.js';
import { ImportResolver } from '../services/import-resolver.js';
import type { DomainLangServices } from '../domain-lang-module.js';

/**
 * Lazily initialized workspace manager for standalone (non-LSP) usage.
 * Used by import graph building when services aren't available from DI.
 */
let standaloneWorkspaceManager: WorkspaceManager | undefined;
let standaloneImportResolver: ImportResolver | undefined;
let lastInitializedDir: string | undefined;

/**
 * Gets or creates a standalone import resolver for non-LSP contexts.
 * Creates its own WorkspaceManager if not previously initialized for this directory.
 *
 * NOTE: In LSP contexts, prefer using services.imports.ImportResolver directly.
 * This function exists for utilities that don't have access to the service container.
 *
 * @param startDir - Directory to start workspace search from
 * @returns Promise resolving to the import resolver
 */
async function getStandaloneImportResolver(startDir: string): Promise<ImportResolver> {
  // Re-initialize if directory changed (workspace boundary)
  if (lastInitializedDir !== startDir || !standaloneImportResolver) {
    standaloneWorkspaceManager = new WorkspaceManager({ autoResolve: false, allowNetwork: false });
    try {
      await standaloneWorkspaceManager.initialize(startDir);
    } catch (error) {
      console.warn(`Failed to initialize workspace: ${error instanceof Error ? error.message : String(error)}`);
    }
    const services = {
      imports: { WorkspaceManager: standaloneWorkspaceManager }
    } as DomainLangServices;
    standaloneImportResolver = new ImportResolver(services);
    lastInitializedDir = startDir;
  }
  return standaloneImportResolver;
}

/**
 * Gets the git URL resolver from a workspace manager.
 *
 * @param startDir - Directory to start workspace search from
 * @returns Promise resolving to the git URL resolver
 */
async function getGitResolver(startDir: string): Promise<GitUrlResolver> {
  const workspaceManager = new WorkspaceManager({ autoResolve: false, allowNetwork: false });
  await workspaceManager.initialize(startDir);
  return workspaceManager.getGitResolver();
}

/**
 * Resolves an import path to an absolute file URI.
 * 
 * Delegates to ImportResolver which implements PRS-010 semantics:
 * - File imports (with .dlang extension): Direct file access
 * - Module imports (no extension): Requires model.yaml in directory
 * - External dependencies: Resolved via manifest and lock file
 * 
 * @param importingDoc - The document containing the import statement
 * @param rawImportPath - The raw import path from the import statement
 * @returns Resolved URI to the imported file
 * @throws {Error} If the import cannot be resolved
 */
export async function resolveImportPath(
  importingDoc: LangiumDocument,
  rawImportPath: string
): Promise<URI> {
  const baseDir = path.dirname(importingDoc.uri.fsPath);
  const resolver = await getStandaloneImportResolver(baseDir);
  return resolver.resolveFrom(baseDir, rawImportPath);
}

/**
 * Ensures the import graph is loaded from an entry file.
 * 
 * @param entryFilePath - Absolute or workspace-relative path to entry file
 * @param langiumDocuments - The Langium documents manager
 * @returns Set of URIs (as strings) for all documents in the import graph
 * @throws {Error} If entry file cannot be resolved or loaded
 */
export async function ensureImportGraphFromEntryFile(
  entryFilePath: string,
  langiumDocuments: LangiumDocuments
): Promise<Set<string>> {
  const entryUri = URI.file(path.resolve(entryFilePath));
  const entryDoc = await langiumDocuments.getOrCreateDocument(entryUri);
  return ensureImportGraphFromDocument(entryDoc, langiumDocuments);
}

/**
 * Recursively builds the import graph from a document.
 * 
 * @param document - The starting document
 * @param langiumDocuments - The Langium documents manager
 * @returns Set of URIs (as strings) for all documents in the import graph
 */
export async function ensureImportGraphFromDocument(
  document: LangiumDocument,
  langiumDocuments: LangiumDocuments
): Promise<Set<string>> {
  const visited = new Set<string>();

  async function visit(doc: LangiumDocument): Promise<void> {
    const uriString = doc.uri.toString();
    if (visited.has(uriString)) return;
    visited.add(uriString);

    const model = doc.parseResult.value as unknown as Model;
    for (const imp of model.imports ?? []) {
      if (!imp.uri) continue;
      
      // Use new resolveImportPath that supports git URLs
      const resolvedUri = await resolveImportPath(doc, imp.uri);
      const childDoc = await langiumDocuments.getOrCreateDocument(resolvedUri);
      await visit(childDoc);
    }
  }

  await visit(document);
  return visited;
}

/**
 * Gets cache statistics for git imports.
 * 
 * @returns Cache statistics including size and number of cached repositories
 */
export async function getGitCacheStats(startDir: string = process.cwd()): Promise<{
  totalSize: number;
  repoCount: number;
  cacheDir: string;
}> {
  const resolver = await getGitResolver(startDir);
  return await resolver.getCacheStats();
}

/**
 * Clears the git import cache.
 * 
 * @param startDir - Starting directory for workspace resolution
 * @returns Promise that resolves when cache is cleared
 */
export async function clearGitCache(startDir: string = process.cwd()): Promise<void> {
  const resolver = await getGitResolver(startDir);
  return await resolver.clearCache();
}
