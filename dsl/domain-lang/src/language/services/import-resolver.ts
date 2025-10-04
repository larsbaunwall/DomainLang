import { WorkspaceManager } from './workspace-manager.js';
import { URI } from 'langium';
import type { DomainLangServices } from '../domain-lang-module.js';

/**
 * ImportResolver resolves import statements using WorkspaceManager and GitUrlResolver.
 */
export class ImportResolver {
    private workspaceManager: WorkspaceManager;

    constructor(services: DomainLangServices) {
        this.workspaceManager = services.imports.WorkspaceManager;
    }

    /**
     * Resolve an import URL to a file URI using the workspace's GitUrlResolver.
     */
    async resolveImport(importUrl: string): Promise<URI> {
        const gitResolver = await this.workspaceManager.getGitResolver();
        return gitResolver.resolve(importUrl);
    }

    /**
     * Get the current lock file (if loaded).
     */
    async getLockFile() {
        return this.workspaceManager.getLockFile();
    }
}
