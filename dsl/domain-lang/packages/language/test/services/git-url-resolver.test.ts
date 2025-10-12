import { describe, test, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';

const execInvocations: string[] = [];

vi.mock('node:child_process', () => {
    return {
        exec: (
            command: string,
            options?: unknown,
            callback?: (error: NodeJS.ErrnoException | null, stdout: string, stderr: string) => void
        ) => {
            const cb = typeof options === 'function' ? options : callback;
            execInvocations.push(command);
            if (!cb) {
                throw new Error('Callback is required for exec mock');
            }

            if (command.startsWith('git clone')) {
                const match = command.match(/"([^"\\]+)"/);
                const targetDir = match?.[1];
                void (async () => {
                    if (targetDir) {
                        await fs.mkdir(targetDir, { recursive: true });
                        await fs.mkdir(path.join(targetDir, '.git'), { recursive: true });
                    }
                    cb(null, '', '');
                })().catch((error: unknown) => {
                    cb(error as NodeJS.ErrnoException, '', '');
                });
                return {} as import('node:child_process').ChildProcess;
            }

            cb(null, '', '');
            return {} as import('node:child_process').ChildProcess;
        }
    };
});

let GitUrlResolver: any;
let GitUrlParser: any;

beforeAll(async () => {
    ({ GitUrlResolver, GitUrlParser } = await import('../../src/services/git-url-resolver.js'));
});

describe('GitUrlResolver', () => {
    let resolver: any;
    let tempCache: string;

    beforeEach(async () => {
        execInvocations.length = 0;
        tempCache = await fs.mkdtemp(path.join(os.tmpdir(), 'dlang-cache-test-'));
    resolver = new GitUrlResolver(tempCache);
    });

    afterEach(async () => {
        await fs.rm(tempCache, { recursive: true, force: true });
    });

    test('clones repository and checks out resolved commit', async () => {
        const gitInfo = GitUrlParser.parse('acme/patterns@main');
        const cachePath = path.join(tempCache, gitInfo.platform, gitInfo.owner, gitInfo.repo, 'abcdef');

        await (resolver as { downloadRepo: (info: unknown, commit: string, cache: string) => Promise<void> })
            .downloadRepo(gitInfo, 'abcdef', cachePath);

        expect(execInvocations.some(cmd => cmd.startsWith('git clone'))).toBe(true);
        expect(execInvocations.some(cmd => cmd.includes('fetch --depth 1 origin abcdef'))).toBe(true);
        expect(execInvocations.some(cmd => cmd.includes('checkout') && cmd.includes('abcdef'))).toBe(true);

        const gitDirExists = await fs.access(path.join(cachePath, '.git')).then(() => true).catch(() => false);
        expect(gitDirExists).toBe(false);
    });
});
