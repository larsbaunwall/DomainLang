import fs from 'node:fs/promises';
import path from 'node:path';
import { URI, type LangiumDocument, type LangiumDocuments } from 'langium';
import type { Model } from '../generated/ast.js';
import { GitUrlParser } from '../services/git-url-resolver.js';
import type { GitUrlResolver } from '../services/git-url-resolver.js';
import { WorkspaceManager } from '../services/workspace-manager.js';

// Singleton workspace manager instance
let workspaceManager: WorkspaceManager | undefined;

/**
 * Gets or creates the global workspace manager instance.
 * 
 * @param startDir - Directory to start workspace search from
 * @returns Promise resolving to the workspace manager
 */
async function getWorkspaceManager(startDir: string): Promise<WorkspaceManager> {
  if (!workspaceManager) {
    workspaceManager = new WorkspaceManager();
    const root = await findWorkspaceRoot(startDir);
    try {
      await workspaceManager.initialize(root);
    } catch (error) {
      console.warn(`Failed to initialize workspace: ${error instanceof Error ? error.message : String(error)}`);
      // Continue without workspace - local imports will still work
    }
  }
  return workspaceManager;
}

/**
 * Gets the git URL resolver from the workspace manager.
 * 
 * @param startDir - Directory to start workspace search from
 * @returns Promise resolving to the git URL resolver
 */
async function getGitResolver(startDir: string): Promise<GitUrlResolver> {
  const manager = await getWorkspaceManager(startDir);
  return await manager.getGitResolver();
}

/**
 * Ensures a file path has the .dlang extension.
 * 
 * @param filePath - The raw file path
 * @returns Normalized path with .dlang extension
 * @throws {Error} If path has an invalid extension
 */
function ensureDlangExtension(filePath: string): string {
  const ext = path.extname(filePath);
  
  if (!ext) {
    return `${filePath}.dlang`;
  }
  
  if (ext !== '.dlang') {
    throw new Error(
      `Invalid file extension: ${ext}. Expected .dlang for file: ${filePath}`
    );
  }
  
  return filePath;
}

/**
 * Resolves workspace-relative paths (starting with ~/).
 * 
 * @param importPath - Import path that may start with ~/
 * @param workspaceRoot - The workspace root directory
 * @returns Resolved absolute path
 */
function resolveWorkspacePath(importPath: string, workspaceRoot: string): string {
  if (importPath.startsWith('~/')) {
    return path.join(workspaceRoot, importPath.slice(2));
  }
  return importPath;
}

/**
 * Finds the workspace root by looking for common workspace indicators.
 * 
 * Searches upward from the document's directory looking for:
 * - dlang.toml
 * - .git directory
 * - package.json with dlang configuration
 * 
 * @param startDir - Directory to start searching from
 * @returns Workspace root path or the start directory if not found
 */
async function findWorkspaceRoot(startDir: string): Promise<string> {
  let currentDir = startDir;
  const root = path.parse(currentDir).root;

  while (currentDir !== root) {
    // Check for workspace indicators
    const indicators = ['dlang.toml', '.git', 'package.json'];
    
    for (const indicator of indicators) {
      const indicatorPath = path.join(currentDir, indicator);
      try {
        await fs.access(indicatorPath);
        return currentDir; // Found workspace root
      } catch {
        // Continue searching
      }
    }

    // Move up one directory
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break; // Reached root
    currentDir = parentDir;
  }

  // Default to start directory if no workspace root found
  return startDir;
}

/**
 * Resolves an import path to an absolute file URI.
 * 
 * Supports:
 * - Local relative paths: ./file.dlang, ../other/file.dlang
 * - Workspace-relative paths: ~/contexts/sales.dlang
 * - Git URLs: gh:owner/repo@v1.0.0/file.dlang
 * - Full URLs: https://github.com/owner/repo/blob/v1.0.0/file.dlang
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

  // Handle manifest dependency aliases (friendly names)
  const manager = await getWorkspaceManager(baseDir);
  let gitResolver: GitUrlResolver | undefined;

  try {
    const manifestImport = await manager.resolveDependencyImport(rawImportPath);
    if (manifestImport) {
      gitResolver = await manager.getGitResolver();
      return await gitResolver.resolve(manifestImport);
    }
  } catch {
    // Ignore manifest resolution issues; fall back to other strategies
  }

  // Handle git URLs (shorthand or full)
  if (GitUrlParser.isGitUrl(rawImportPath)) {
    gitResolver = gitResolver ?? await manager.getGitResolver();
    return await gitResolver.resolve(rawImportPath);
  }

  // Handle workspace-relative paths (~/)
  let resolvedPath = rawImportPath;

  if (rawImportPath.startsWith('~/')) {
    const workspaceRoot = await findWorkspaceRoot(baseDir);
    resolvedPath = resolveWorkspacePath(rawImportPath, workspaceRoot);
  } else if (!path.isAbsolute(rawImportPath)) {
    // Handle relative paths
    resolvedPath = path.resolve(baseDir, rawImportPath);
  }

  // Ensure .dlang extension
  const normalized = ensureDlangExtension(resolvedPath);

  // Verify file exists
  try {
    await fs.access(normalized);
  } catch {
    throw new Error(
      `Import file not found: ${rawImportPath} (resolved to ${normalized})`
    );
  }

  return URI.file(normalized);
}

/**
 * Legacy function for backward compatibility.
 * Use resolveImportPath instead.
 * 
 * @deprecated Use resolveImportPath which supports git URLs and workspace paths
 */
export async function resolveLocalImportPath(
  importingDoc: LangiumDocument,
  rawImportPath: string
): Promise<string> {
  const uri = await resolveImportPath(importingDoc, rawImportPath);
  return uri.fsPath;
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


