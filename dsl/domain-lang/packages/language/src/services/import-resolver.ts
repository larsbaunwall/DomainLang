import fs from 'node:fs/promises';
import path from 'node:path';
import { URI, type LangiumDocument } from 'langium';
import { WorkspaceManager } from './workspace-manager.js';
import type { DomainLangServices } from '../domain-lang-module.js';
import type { LockFile } from './types.js';

/**
 * ImportResolver resolves import statements using manifest-centric rules (PRS-010).
 *
 * Import Types (PRS-010):
 * - Local relative: ./path, ../path → Directory-first resolution
 * - Path aliases: @/path, @alias/path → Configurable in model.yaml paths section
 * - External: owner/package → Manifest dependencies
 *
 * Directory-First Resolution:
 * - ./types → ./types/index.dlang → ./types.dlang
 * - Module entry defaults to index.dlang (no model.yaml required)
 */
export class ImportResolver {
    private readonly workspaceManager: WorkspaceManager;

    constructor(services: DomainLangServices) {
        this.workspaceManager = services.imports.WorkspaceManager;
    }

    /**
     * Resolve an import specifier relative to a Langium document.
     */
    async resolveForDocument(document: LangiumDocument, specifier: string): Promise<URI> {
        const baseDir = path.dirname(document.uri.fsPath);
        return this.resolveFrom(baseDir, specifier);
    }

    /**
     * Resolve an import specifier from a base directory (non-LSP contexts).
     */
    async resolveFrom(baseDir: string, specifier: string): Promise<URI> {
        await this.workspaceManager.initialize(baseDir);

        // Local relative paths (./path or ../path) - directory-first resolution
        if (specifier.startsWith('./') || specifier.startsWith('../')) {
            const resolved = path.resolve(baseDir, specifier);
            return this.resolveLocalPath(resolved, specifier);
        }

        // Path aliases (@/path or @alias/path)
        if (specifier.startsWith('@')) {
            return this.resolvePathAlias(specifier);
        }

        // External dependency via manifest (owner/package format)
        return this.resolveExternalDependency(specifier);
    }

    /**
     * Resolves a path alias import.
     * 
     * @param specifier - Import specifier starting with @ (e.g., "@/lib", "@shared/types")
     */
    private async resolvePathAlias(specifier: string): Promise<URI> {
        const aliases = await this.workspaceManager.getPathAliases();
        const root = this.workspaceManager.getWorkspaceRoot();

        // Find matching alias
        const aliasMatch = this.findMatchingAlias(specifier, aliases);

        if (aliasMatch) {
            const { alias: _alias, targetPath, remainder } = aliasMatch;
            const manifestPath = await this.workspaceManager.getManifestPath();
            const manifestDir = manifestPath ? path.dirname(manifestPath) : root;
            const resolvedBase = path.resolve(manifestDir, targetPath);
            const resolved = remainder ? path.join(resolvedBase, remainder) : resolvedBase;
            return this.resolveLocalPath(resolved, specifier);
        }

        // Default: @/ maps to workspace root (implicit)
        if (specifier.startsWith('@/')) {
            const relativePath = specifier.slice(2);
            const resolved = path.join(root, relativePath);
            return this.resolveLocalPath(resolved, specifier);
        }

        throw new Error(
            `Unknown path alias '${specifier.split('/')[0]}' in import '${specifier}'.\n` +
            `Hint: Define it in model.yaml paths section:\n` +
            `  paths:\n` +
            `    "${specifier.split('/')[0]}": "./some/path"`
        );
    }

    /**
     * Finds the longest matching alias for a specifier.
     */
    private findMatchingAlias(
        specifier: string,
        aliases: Record<string, string> | undefined
    ): { alias: string; targetPath: string; remainder: string } | undefined {
        if (!aliases) {
            return undefined;
        }

        // Sort by length descending to match most specific alias first
        const sortedAliases = Object.entries(aliases)
            .sort(([a], [b]) => b.length - a.length);

        for (const [alias, targetPath] of sortedAliases) {
            // Exact match
            if (specifier === alias) {
                return { alias, targetPath, remainder: '' };
            }
            // Prefix match (alias + /)
            if (specifier.startsWith(`${alias}/`)) {
                return { alias, targetPath, remainder: specifier.slice(alias.length + 1) };
            }
        }

        return undefined;
    }

    /**
     * Resolves an external dependency via manifest.
     * 
     * NEW FORMAT (PRS-010): Import specifier is owner/package format.
     */
    private async resolveExternalDependency(specifier: string): Promise<URI> {
        const manifest = await this.workspaceManager.getManifest();
        if (!manifest) {
            throw new Error(
                `External dependency '${specifier}' requires model.yaml.\n` +
                `Hint: Create model.yaml and add the dependency:\n` +
                `  dependencies:\n` +
                `    ${specifier}:\n` +
                `      ref: v1.0.0`
            );
        }

        const lock = await this.workspaceManager.getLockFile();
        if (!lock) {
            throw new Error(
                `Dependency '${specifier}' not installed.\n` +
                `Hint: Run 'dlang install' to fetch dependencies and generate model.lock.`
            );
        }

        const mapped = await this.workspaceManager.resolveDependencyImport(specifier);
        if (!mapped) {
            throw new Error(
                `Dependency '${specifier}' not found in model.yaml.\n` +
                `Hint: Add it to your dependencies:\n` +
                `  dependencies:\n` +
                `    ${specifier}:\n` +
                `      ref: v1.0.0`
            );
        }

        const git = await this.workspaceManager.getGitResolver();
        return git.resolve(mapped, { allowNetwork: false });
    }

    /**
     * Resolves a local path using directory-first resolution.
     * 
     * Per PRS-010 (updated design):
     * - If path ends with .dlang → direct file import
     * - If no extension → directory-first:
     *   1. Try ./path/index.dlang (module default, no model.yaml required)
     *   2. Try ./path.dlang (file fallback)
     */
    private async resolveLocalPath(resolved: string, original: string): Promise<URI> {
        const ext = path.extname(resolved);

        if (ext === '.dlang') {
            // Direct file import
            await assertFileExists(resolved, original);
            return URI.file(resolved);
        }

        if (ext && ext !== '.dlang') {
            throw new Error(
                `Invalid file extension '${ext}' in import '${original}'.\n` +
                `Hint: DomainLang files must use the .dlang extension.`
            );
        }

        // No extension → directory-first resolution
        return this.resolveDirectoryFirst(resolved, original);
    }

    /**
     * Directory-first resolution: ./types → ./types/index.dlang → ./types.dlang
     * 
     * Module entry defaults to index.dlang without requiring model.yaml.
     * If the directory has model.yaml with custom entry, use that.
     */
    private async resolveDirectoryFirst(resolved: string, original: string): Promise<URI> {
        // Step 1: Check if directory exists with index.dlang (or custom entry)
        const isDirectory = await this.isDirectory(resolved);
        if (isDirectory) {
            // Check for model.yaml to get custom entry point
            const moduleManifestPath = path.join(resolved, 'model.yaml');
            const entryPoint = await this.readModuleEntry(moduleManifestPath);
            const entryFile = path.join(resolved, entryPoint);
            
            if (await this.fileExists(entryFile)) {
                return URI.file(entryFile);
            }

            // Directory exists but no entry file
            throw new Error(
                `Module '${original}' is missing its entry file.\n` +
                `Expected: ${resolved}/${entryPoint}\n` +
                `Hint: Create '${entryPoint}' in the module directory, or specify a custom entry in model.yaml:\n` +
                `  model:\n` +
                `    entry: main.dlang`
            );
        }

        // Step 2: Try .dlang file fallback
        const fileWithExt = `${resolved}.dlang`;
        if (await this.fileExists(fileWithExt)) {
            return URI.file(fileWithExt);
        }

        // Neither directory nor file found
        throw new Error(
            `Cannot resolve import '${original}'.\n` +
            `Tried:\n` +
            `  • ${resolved}/index.dlang (directory module)\n` +
            `  • ${resolved}.dlang (file)\n` +
            `Hint: Check that the path is correct and the file exists.`
        );
    }

    /**
     * Reads the entry point from a module's model.yaml.
     * Defaults to index.dlang if no manifest or no entry specified.
     */
    private async readModuleEntry(manifestPath: string): Promise<string> {
        try {
            const content = await fs.readFile(manifestPath, 'utf-8');
            const YAML = await import('yaml');
            const manifest = YAML.parse(content) as { model?: { entry?: string } };
            return manifest?.model?.entry ?? 'index.dlang';
        } catch {
            return 'index.dlang';
        }
    }

    /**
     * Checks if a path is a directory.
     */
    private async isDirectory(targetPath: string): Promise<boolean> {
        try {
            const stat = await fs.stat(targetPath);
            return stat.isDirectory();
        } catch {
            return false;
        }
    }

    /**
     * Checks if a file exists.
     */
    private async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get the current lock file (if loaded).
     */
    async getLockFile(): Promise<LockFile | undefined> {
        return this.workspaceManager.getLockFile();
    }
}

async function assertFileExists(filePath: string, original: string): Promise<void> {
    try {
        await fs.access(filePath);
    } catch {
        throw new Error(
            `Import file not found: '${original}'.\\n` +
            `Resolved path: ${filePath}\\n` +
            `Hint: Check that the file exists and the path is correct.`
        );
    }
}
