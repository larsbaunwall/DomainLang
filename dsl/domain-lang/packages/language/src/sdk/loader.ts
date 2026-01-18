/**
 * Browser-safe loader for in-memory model parsing.
 * 
 * This module provides `loadModelFromText()` which works in both
 * browser and Node.js environments by using Langium's EmptyFileSystem.
 * 
 * For file-based loading in Node.js CLI tools, use:
 * ```typescript
 * import { loadModel } from '@domainlang/language/sdk/loader-node';
 * ```
 * 
 * For LSP/validation code that already has a linked AST, use the sync entry points:
 * - `fromDocument()` - from a LangiumDocument
 * - `fromModel()` - from a Model AST node  
 * - `fromServices()` - from DomainLangServices container
 * 
 * @module sdk/loader
 */

import { EmptyFileSystem, URI } from 'langium';
import type { Model } from '../generated/ast.js';
import { isModel } from '../generated/ast.js';
import { createDomainLangServices } from '../domain-lang-module.js';
import type { LoadOptions, QueryContext } from './types.js';
import { augmentModel, fromModel } from './query.js';

/**
 * Loads a DomainLang model from a text string.
 * 
 * **Browser-safe** - uses in-memory file system (EmptyFileSystem).
 * 
 * Useful for:
 * - Testing
 * - REPL environments  
 * - Web-based editors
 * - Any environment without file system access
 * 
 * @param text - DomainLang source code
 * @param options - Optional load configuration
 * @returns QueryContext with model and query API
 * @throws Error if parsing fails
 * 
 * @example
 * ```typescript
 * import { loadModelFromText } from '@domainlang/language/sdk';
 * 
 * const { query } = await loadModelFromText(`
 *   Domain Sales { vision: "Handle sales" }
 *   bc OrderContext for Sales
 * `);
 * 
 * const sales = query.domain('Sales');
 * console.log(sales?.resolvedVision);
 * ```
 */
export async function loadModelFromText(
    text: string,
    options?: LoadOptions
): Promise<QueryContext> {
    // Create or reuse services (use EmptyFileSystem for in-memory parsing)
    const servicesObj = options?.services
        ? { shared: options.services.shared, DomainLang: options.services }
        : createDomainLangServices(EmptyFileSystem);
    
    const shared = servicesObj.shared;
    
    // Create document from text with a virtual URI
    const uri = URI.parse('memory:///model.dlang');
    const document = shared.workspace.LangiumDocumentFactory.fromString<Model>(text, uri);
    
    // Register and build document
    shared.workspace.LangiumDocuments.addDocument(document);
    await shared.workspace.DocumentBuilder.build([document], { validation: true });
    
    // Check for parsing errors
    if (document.parseResult.lexerErrors.length > 0) {
        const errors = document.parseResult.lexerErrors.map(e => e.message).join('\n  ');
        throw new Error(`Lexer errors:\n  ${errors}`);
    }
    
    if (document.parseResult.parserErrors.length > 0) {
        const errors = document.parseResult.parserErrors.map(e => e.message).join('\n  ');
        throw new Error(`Parser errors:\n  ${errors}`);
    }
    
    const model = document.parseResult.value;
    if (!isModel(model)) {
        throw new Error(`Document root is not a Model`);
    }
    
    // Augment AST nodes with SDK properties
    augmentModel(model);
    
    return {
        model,
        documents: [document.uri],
        query: fromModel(model),
    };
}
