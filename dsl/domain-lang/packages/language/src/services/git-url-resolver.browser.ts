// Browser stub for GitUrlResolver
// Git operations are not available in the browser environment

import type { GitImportInfo } from './types.js';

// Re-export the type for API consistency
export type { GitImportInfo } from './types.js';

export class GitUrlResolver {
    constructor() {
        throw new Error('GitUrlResolver is not available in the browser.');
    }
}

export const GitUrlParser = {
    parse(_importStr: string): GitImportInfo {
        throw new Error('GitUrlParser is not available in the browser.');
    },
    isGitUrl(_importStr: string): boolean {
        throw new Error('GitUrlParser is not available in the browser.');
    }
};

export function loadLockFile(): void {
    throw new Error('loadLockFile is not available in the browser.');
}
