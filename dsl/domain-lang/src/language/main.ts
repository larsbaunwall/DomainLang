import { startLanguageServer } from 'langium/lsp';
import { NodeFileSystem } from 'langium/node';
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node.js';
import { createDomainLangServices } from './domain-lang-module.js';
import { ensureImportGraphFromEntryFile } from './utils/import-utils.js';
import { URI } from 'langium';

// Create a connection to the client
const connection = createConnection(ProposedFeatures.all);

// Inject the shared services and language-specific services
const { shared } = createDomainLangServices({ connection, ...NodeFileSystem });

// Optionally start from a single entry file and follow imports.
// Configure via env DOMAINLANG_ENTRY (absolute or workspace-relative path)
const entryFile = process.env.DOMAINLANG_ENTRY;
if (entryFile) {
    let currentGraph = new Set<string>();

    /**
     * Reloads the import graph from the entry file.
     * Handles errors gracefully and notifies the LSP client.
     */
    const reloadFromEntry = async (): Promise<void> => {
        try {
            currentGraph = await ensureImportGraphFromEntryFile(
                entryFile, 
                shared.workspace.LangiumDocuments
            );
            console.log(`Successfully loaded import graph from ${entryFile}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`Failed to preload import graph from ${entryFile}: ${message}`);
            // Notify LSP client of the error
            connection.console.error(
                `DomainLang: Could not load entry file ${entryFile}. Error: ${message}`
            );
        }
    };

    // Initial load from entry file, then start the server
    reloadFromEntry().finally(() => startLanguageServer(shared));

    // Any change within the loaded graph should trigger a reload from the entry
    shared.workspace.TextDocuments.onDidChangeContent(async (event) => {
        const changed = event.document.uri;
        if (currentGraph.has(changed)) {
            await reloadFromEntry();
        }
    });

    // If the entry file itself is opened/changed, also reload
    shared.workspace.TextDocuments.onDidOpen(async (event) => {
        if (URI.parse(event.document.uri).fsPath === URI.file(entryFile).fsPath) {
            await reloadFromEntry();
        }
    });
} else {
    // No entry file configured: start normally
    startLanguageServer(shared);
}
