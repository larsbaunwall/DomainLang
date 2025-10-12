// Browser stub for GitUrlResolver

export interface GitImportInfo {
    original: string;
    platform: 'github' | 'gitlab' | 'bitbucket' | 'generic';
    owner: string;
    repo: string;
    version: string;
    repoUrl: string;
    entryPoint: string;
}

export class GitUrlResolver {
    constructor() {
        throw new Error('GitUrlResolver is not available in the browser.');
    }
}


export const GitUrlParser = {
    parse() {
        throw new Error('GitUrlParser is not available in the browser.');
    }
};

export function loadLockFile(): void {
    throw new Error('loadLockFile is not available in the browser.');
}

export type LockFile = unknown;
export type LockedDependency = unknown;
