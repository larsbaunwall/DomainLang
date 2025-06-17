import fs from 'fs/promises';
import path from 'path';
// Use native fetch in Node.js 18+
import crypto from 'crypto';
import type { Model, ImportStatement } from '../generated/ast.js';
import type { LangiumDocuments } from 'langium';

const CACHE_DIR = path.resolve('.dlang/cache');

export async function getOrDownloadFile(uri: string): Promise<string> {
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
        await fs.mkdir(CACHE_DIR, { recursive: true });
        const hash = crypto.createHash('sha256').update(uri).digest('hex');
        const cachePath = path.join(CACHE_DIR, hash + '.dlang');
        try {
            await fs.access(cachePath);
            return cachePath; // Already cached
        } catch {
            // Download and cache
            const res = await fetch(uri);
            if (!res.ok) throw new Error(`Failed to download ${uri}: ${res.statusText}`);
            const content = await res.text();
            await fs.writeFile(cachePath, content, 'utf-8');
            return cachePath;
        }
    } else {
        // Local file, resolve relative to workspace
        return path.resolve(uri);
    }
}

/**
 * Scan a model for remote imports and download them if needed. Returns a map of import URI to local file path.
 */
export async function ensureRemoteImportsDownloaded(model: Model): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    for (const imp of model.imports ?? []) {
        if (imp.uri.startsWith('http://') || imp.uri.startsWith('https://')) {
            const localPath = await getOrDownloadFile(imp.uri);
            result.set(imp.uri, localPath);
        }
    }
    return result;
}

/**
 * Ensure all imports (remote and local) are loaded as LangiumDocuments before validation or linking.
 * Downloads remote files if needed, then loads them into LangiumDocuments.
 */
export async function ensureAllImportsLoaded(model: Model, langiumDocuments: LangiumDocuments): Promise<void> {
    for (const imp of model.imports ?? []) {
        let filePath: string;
        if (imp.uri.startsWith('http://') || imp.uri.startsWith('https://')) {
            filePath = await getOrDownloadFile(imp.uri);
        } else {
            filePath = path.resolve(imp.uri);
        }
        const docUri = 'file://' + filePath;
        await langiumDocuments.getOrCreateDocument({ toString: () => docUri } as any);
    }
} 