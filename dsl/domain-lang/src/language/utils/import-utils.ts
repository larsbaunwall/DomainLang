import fs from 'node:fs/promises';
import path from 'node:path';
import { URI, type LangiumDocument, type LangiumDocuments } from 'langium';
import type { Model } from '../generated/ast.js';

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
 * Resolves a local import path relative to the importing document.
 * 
 * @param importingDoc - The document containing the import statement
 * @param rawImportPath - The raw import path from the import statement
 * @returns Absolute file path to the imported file
 * @throws {Error} If the import is remote (http/https) or file doesn't exist
 */
export async function resolveLocalImportPath(importingDoc: LangiumDocument, rawImportPath: string): Promise<string> {
  if (rawImportPath.startsWith('http://') || rawImportPath.startsWith('https://')) {
    throw new Error(`Remote imports are not supported: ${rawImportPath}`);
  }
  const baseDir = path.dirname(importingDoc.uri.fsPath);
  const normalized = ensureDlangExtension(rawImportPath);
  const resolved = path.resolve(baseDir, normalized);
  
  try {
    await fs.access(resolved);
  } catch (error) {
    throw new Error(
      `Import file not found: ${rawImportPath} (resolved to ${resolved})`
    );
  }
  
  return resolved;
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
      const filePath = await resolveLocalImportPath(doc, imp.uri);
      const childUri = URI.file(filePath);
      const childDoc = await langiumDocuments.getOrCreateDocument(childUri);
      await visit(childDoc);
    }
  }

  await visit(document);
  return visited;
}


