import path from 'node:path';
import YAML from 'yaml';
import { DefaultWorkspaceManager, URI, UriUtils, type FileSystemNode, type LangiumDocument, type LangiumSharedCoreServices, type WorkspaceFolder } from 'langium';
import type { CancellationToken } from 'vscode-languageserver-protocol';
import { ensureImportGraphFromDocument } from '../utils/import-utils.js';

/**
 * Langium WorkspaceManager override implementing manifest-centric import loading per PRS-010.
 *
 * Behavior:
 * - Skips pre-loading *.dlang during workspace scan (only entry graph is loaded when manifest exists).
 * - Mode A (with manifest): find nearest model.yaml in folder, load entry (default index.dlang) and its import graph.
 * - Mode B (no manifest): no pre-loading; imports resolved on-demand when a document is opened.
 * - Never performs network fetches; relies on cached dependencies/lock files. Missing cache produces diagnostics upstream.
 */
export class DomainLangWorkspaceManager extends DefaultWorkspaceManager {
    constructor(services: LangiumSharedCoreServices) {
        super(services);
    }

    override shouldIncludeEntry(entry: FileSystemNode): boolean {
        // Prevent auto-including .dlang files; we'll load via entry/import graph
        const name = UriUtils.basename(entry.uri);
        if (name.toLowerCase().endsWith('.dlang')) {
            return false;
        }
        return super.shouldIncludeEntry(entry);
    }

    override async initializeWorkspace(folders: WorkspaceFolder[], cancelToken?: CancellationToken): Promise<void> {
        await super.initializeWorkspace(folders, cancelToken);
    }

    protected override async loadAdditionalDocuments(folders: WorkspaceFolder[], collector: (document: LangiumDocument) => void): Promise<void> {
        const manifestInfo = await this.findManifestInFolders(folders);
        if (!manifestInfo) {
            return; // Mode B: no manifest
        }

        const entryUri = URI.file(manifestInfo.entryPath);
        const entryDoc = await this.langiumDocuments.getOrCreateDocument(entryUri);
        collector(entryDoc);

        const uris = await ensureImportGraphFromDocument(entryDoc, this.langiumDocuments);
        for (const uriString of uris) {
            const uri = URI.parse(uriString);
            const doc = await this.langiumDocuments.getOrCreateDocument(uri);
            collector(doc);
        }
    }

    private async findManifestInFolders(folders: WorkspaceFolder[]): Promise<{ manifestPath: string; entryPath: string } | undefined> {
        for (const folder of folders) {
            const manifestPath = await this.findNearestManifest(folder.uri);
            if (manifestPath) {
                const entry = await this.readEntryFromManifest(manifestPath) ?? 'index.dlang';
                const entryPath = path.resolve(path.dirname(manifestPath), entry);
                return { manifestPath, entryPath };
            }
        }
        return undefined;
    }

    private async findNearestManifest(startUri: string): Promise<string | undefined> {
        let current = path.resolve(URI.parse(startUri).fsPath);
        const { root } = path.parse(current);

        while (true) {
            const candidate = path.join(current, 'model.yaml');
            if (await this.pathExists(candidate)) {
                return candidate;
            }

            if (current === root) {
                return undefined;
            }

            const parent = path.dirname(current);
            if (parent === current) {
                return undefined;
            }
            current = parent;
        }
    }

    private async readEntryFromManifest(manifestPath: string): Promise<string | undefined> {
        try {
            const content = await this.fileSystemProvider.readFile(URI.file(manifestPath));
            const manifest = (YAML.parse(content) ?? {}) as { model?: { entry?: string } };
            return manifest.model?.entry;
        } catch {
            return undefined;
        }
    }

    private async pathExists(target: string): Promise<boolean> {
        try {
            await this.fileSystemProvider.stat(URI.file(target));
            return true;
        } catch {
            return false;
        }
    }
}