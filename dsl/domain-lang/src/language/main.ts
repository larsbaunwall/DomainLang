import { startLanguageServer } from 'langium/lsp';
import { NodeFileSystem } from 'langium/node';
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node.js';
import { createDomainLangServices } from './domain-lang-module.js';
import { isModel } from './generated/ast.js';
import { ensureAllImportsLoaded } from './utils/import-utils.js';
import { URI } from 'langium';

// Create a connection to the client
const connection = createConnection(ProposedFeatures.all);

// Inject the shared services and language-specific services
const { shared } = createDomainLangServices({ connection, ...NodeFileSystem });

// Import preloading and building is handled by Langium's document build and linking pipeline.
// No explicit hooks for document add/change are required. Imports are resolved and built as needed.

// Hook: On document open or change, ensure all imports are loaded
shared.workspace.TextDocuments.onDidOpen(async (event) => {
    const doc = await shared.workspace.LangiumDocuments.getOrCreateDocument(URI.parse(event.document.uri));
    const model = doc.parseResult.value;
    if (isModel(model)) {
        await ensureAllImportsLoaded(model, shared.workspace.LangiumDocuments);
    }
});

shared.workspace.TextDocuments.onDidChangeContent(async (event) => {
    const doc = await shared.workspace.LangiumDocuments.getOrCreateDocument(URI.parse(event.document.uri));
    const model = doc.parseResult.value;
    if (isModel(model)) {
        await ensureAllImportsLoaded(model, shared.workspace.LangiumDocuments);
    }
});

// Start the language server with the shared services
startLanguageServer(shared);
