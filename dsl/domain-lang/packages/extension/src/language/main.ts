import { URI, UriUtils } from 'langium';
import { startLanguageServer } from 'langium/lsp';
import { NodeFileSystem } from 'langium/node';
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node.js';
import { FileChangeType } from 'vscode-languageserver-protocol';
import { createDomainLangServices, getManifestDiagnosticsService } from '@domainlang/language';
import fs from 'node:fs/promises';

// Create a connection to the client
const connection = createConnection(ProposedFeatures.all);

// Inject the shared services and language-specific services
const { shared, DomainLang } = createDomainLangServices({ connection, ...NodeFileSystem });

// Initialize manifest diagnostics service with LSP connection
const manifestDiagnostics = getManifestDiagnosticsService();
manifestDiagnostics.setConnection(connection);

/**
 * Validates a model.yaml file and sends diagnostics.
 */
async function validateManifestAtUri(uri: string): Promise<void> {
    try {
        const fsPath = URI.parse(uri).fsPath;
        const content = await fs.readFile(fsPath, 'utf-8');
        await manifestDiagnostics.validateAndSendDiagnostics(uri, content);
    } catch {
        // File may have been deleted or is unreadable - clear diagnostics
        await manifestDiagnostics.clearDiagnostics(uri);
    }
}

// Register file watcher handler for model.yaml and model.lock changes
// This enables LSP to detect when CLI commands (dlang install/update/add/remove) modify config files
shared.lsp.DocumentUpdateHandler.onWatchedFilesChange(async params => {
    const workspaceManager = DomainLang.imports.WorkspaceManager;
    let manifestChanged = false;
    let lockChanged = false;

    for (const change of params.changes) {
        const uri = URI.parse(change.uri);
        const filename = UriUtils.basename(uri).toLowerCase();
        
        if (filename === 'model.yaml') {
            manifestChanged = true;
            
            // Validate manifest and send diagnostics
            if (change.type === FileChangeType.Deleted) {
                await manifestDiagnostics.clearDiagnostics(change.uri);
            } else {
                await validateManifestAtUri(change.uri);
            }
        } else if (filename === 'model.lock') {
            lockChanged = true;
        }
    }

    // Invalidate caches based on what changed
    if (manifestChanged && lockChanged) {
        workspaceManager.invalidateCache();
    } else if (manifestChanged) {
        workspaceManager.invalidateManifestCache();
    } else if (lockChanged) {
        workspaceManager.invalidateLockCache();
    }

    // After cache invalidation, the next document build will pick up new config
    // Langium's DocumentUpdateHandler already triggers document rebuild for watched files
});

// Start the language server with the shared services
startLanguageServer(shared);
