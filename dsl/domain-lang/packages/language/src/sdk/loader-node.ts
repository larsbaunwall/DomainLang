/**
 * Node.js-specific loader for DomainLang models.
 * 
 * **WARNING: This module is NOT browser-compatible.**
 * 
 * For browser environments, use:
 * - `fromDocument()` with documents from the LSP
 * - `fromModel()` with pre-parsed models
 * - `loadModelFromText()` for in-memory parsing
 * 
 * This loader creates **isolated Langium services** for standalone CLI usage.
 * It does NOT integrate with an existing LSP workspace.
 * 
 * For full workspace management with cross-file imports:
 * - Use the WorkspaceManager service
 * - Or host the LSP server and use its services
 * 
 * @module sdk/loader-node
 */

import { DocumentState, URI } from 'langium';
import { NodeFileSystem } from 'langium/node';
import type { Model } from '../generated/ast.js';
import { isModel } from '../generated/ast.js';
import { createDomainLangServices } from '../domain-lang-module.js';
import type { LoadOptions, QueryContext } from './types.js';
import { fromModel, augmentModel } from './query.js';

/**
 * Loads a DomainLang model from a file on disk.
 * 
 * **Node.js only** - uses file system APIs.
 * 
 * Note: This loads a single file. For multi-file models with imports,
 * consider using the WorkspaceManager or hosting an LSP server.
 * 
 * @param entryFile - Path to the entry .dlang file
 * @param options - Optional load configuration
 * @returns QueryContext with model, documents, and query API
 * @throws Error if file cannot be loaded or parsing fails
 * 
 * @example
 * ```typescript
 * import { loadModel } from 'domain-lang-language/sdk/loader-node';
 * 
 * const { query, model } = await loadModel('./domains.dlang', {
 *   workspaceDir: process.cwd()
 * });
 * 
 * for (const bc of query.boundedContexts()) {
 *   console.log(bc.name);
 * }
 * ```
 */
export async function loadModel(
    entryFile: string,
    options?: LoadOptions
): Promise<QueryContext> {
    // Resolve absolute path
    const path = await import('path');
    const absolutePath = path.isAbsolute(entryFile) 
        ? entryFile 
        : path.resolve(options?.workspaceDir ?? process.cwd(), entryFile);
    
    // Create or reuse services
    const servicesObj = options?.services 
        ? { shared: options.services.shared, DomainLang: options.services }
        : createDomainLangServices(NodeFileSystem);
    
    const services = servicesObj.DomainLang;
    const shared = servicesObj.shared;
    
    // Initialize workspace if directory provided
    if (options?.workspaceDir) {
        const workspaceManager = services.imports.WorkspaceManager;
        await workspaceManager.initialize(options.workspaceDir);
    }
    
    // Read file content and create document
    const fs = await import('fs/promises');
    const fileContent = await fs.readFile(absolutePath, 'utf-8');
    const uri = URI.file(absolutePath);
    
    // Use proper Langium document creation
    const document = shared.workspace.LangiumDocumentFactory.fromString<Model>(
        fileContent, 
        uri
    );
    
    // Register document and build it
    shared.workspace.LangiumDocuments.addDocument(document);
    await shared.workspace.DocumentBuilder.build([document], { validation: true });
    
    // Wait for document to be fully processed
    if (document.state < DocumentState.Validated) {
        throw new Error(`Document not fully processed: ${absolutePath}`);
    }
    
    // Check for parsing errors
    if (document.parseResult.lexerErrors.length > 0) {
        const errors = document.parseResult.lexerErrors.map(e => e.message).join('\n  ');
        throw new Error(`Lexer errors in ${entryFile}:\n  ${errors}`);
    }
    
    if (document.parseResult.parserErrors.length > 0) {
        const errors = document.parseResult.parserErrors.map(e => e.message).join('\n  ');
        throw new Error(`Parser errors in ${entryFile}:\n  ${errors}`);
    }
    
    const model = document.parseResult.value;
    if (!isModel(model)) {
        throw new Error(`Document root is not a Model: ${entryFile}`);
    }
    
    // Augment AST nodes with SDK properties
    augmentModel(model);
    
    // Collect all document URIs
    const documentUris: URI[] = Array.from(shared.workspace.LangiumDocuments.all).map(doc => doc.uri);
    
    return {
        model,
        documents: documentUris,
        query: fromModel(model),
    };
}
