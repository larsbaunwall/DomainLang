import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { describe, test, beforeEach, afterEach, expect } from 'vitest';
import { URI } from 'langium';
import { DependencyResolver } from '../../src/services/dependency-resolver.js';

class FakeGitUrlResolver {
    constructor(private readonly base: string) {}
    async resolve(importUrl: string): Promise<URI> {
        // importUrl is expected as owner/repo or full URL; normalize to owner/repo
        const m = importUrl.match(/([^/]+)\/([^/@]+)(?:@([^/]+))?$/);
        if (!m) throw new Error(`Invalid import: ${importUrl}`);
        const owner = m[1];
        const repo = m[2];
        const commit = 'deadbeef';
        const dir = path.join(this.base, 'github', owner, repo, commit);
        await fs.mkdir(dir, { recursive: true });
        const entry = path.join(dir, 'index.dlang');
        await fs.writeFile(entry, 'Domain Dummy {}', 'utf-8');
        return URI.file(entry);
    }
}

async function writeYaml(file: string, content: string): Promise<void> {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, content, 'utf-8');
}

let tempDir: string;
let cacheDir: string;

beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dlang-depresolver-'));
    cacheDir = path.join(tempDir, 'cache');
});

afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
});

describe('DependencyResolver (PRS-010 Phase 5)', () => {
    test('resolves transitive dependencies and generates lock file', async () => {
        // Workspace manifest with A and B
        const workspace = path.join(tempDir, 'workspace');
        await writeYaml(path.join(workspace, 'model.yaml'), `model:\n  name: root\ndependencies:\n  A:\n    source: org/A\n    ref: v1.0.0\n  B:\n    source: org/B\n    ref: v1.0.0\n`);

        // Package A depends on core
        const aDir = path.join(cacheDir, 'github', 'org', 'A', 'deadbeef');
        await writeYaml(path.join(aDir, 'model.yaml'), `model:\n  name: A\ndependencies:\n  core:\n    source: domainlang/core\n    ref: v1.0.0\n`);
        await writeYaml(path.join(cacheDir, 'github', 'org', 'B', 'deadbeef', 'model.yaml'), `model:\n  name: B\n`);

        const resolver = new DependencyResolver(workspace, new FakeGitUrlResolver(cacheDir) as any);
        const lock = await resolver.resolveDependencies();

        expect(lock.version).toBe('1');
        // Keys are by source owner/repo
        expect(lock.dependencies['org/A']).toBeDefined();
        expect(lock.dependencies['org/B']).toBeDefined();
        expect(lock.dependencies['domainlang/core']).toBeDefined();
    });

    test('detects ref conflicts across dependencies', async () => {
        const workspace = path.join(tempDir, 'workspace');
        await writeYaml(path.join(workspace, 'model.yaml'), `model:\n  name: root\ndependencies:\n  A:\n    source: org/A\n    ref: v1.0.0\n  B:\n    source: org/B\n    ref: v1.0.0\n`);
        // A -> core@v1, B -> core@v2
        await writeYaml(path.join(cacheDir, 'github', 'org', 'A', 'deadbeef', 'model.yaml'), `model:\n  name: A\ndependencies:\n  core:\n    source: domainlang/core\n    ref: v1.0.0\n`);
        await writeYaml(path.join(cacheDir, 'github', 'org', 'B', 'deadbeef', 'model.yaml'), `model:\n  name: B\ndependencies:\n  core:\n    source: domainlang/core\n    ref: v2.0.0\n`);

        const resolver = new DependencyResolver(workspace, new FakeGitUrlResolver(cacheDir) as any);
        await expect(resolver.resolveDependencies()).rejects.toThrow(/ref conflict/i);
    });

    test('detects package-level cycles', async () => {
        const workspace = path.join(tempDir, 'workspace');
        await writeYaml(path.join(workspace, 'model.yaml'), `model:\n  name: root\ndependencies:\n  A:\n    source: org/A\n    ref: v1.0.0\n`);
        // A -> B; B -> A
        await writeYaml(path.join(cacheDir, 'github', 'org', 'A', 'deadbeef', 'model.yaml'), `model:\n  name: A\ndependencies:\n  B:\n    source: org/B\n    ref: v1.0.0\n`);
        await writeYaml(path.join(cacheDir, 'github', 'org', 'B', 'deadbeef', 'model.yaml'), `model:\n  name: B\ndependencies:\n  A:\n    source: org/A\n    ref: v1.0.0\n`);

        const resolver = new DependencyResolver(workspace, new FakeGitUrlResolver(cacheDir) as any);
        await expect(resolver.resolveDependencies()).rejects.toThrow(/Cyclic package dependency/i);
    });

    describe('"Latest Wins" resolution strategy', () => {
        test('auto-resolves same-major SemVer conflicts to latest', async () => {
            const workspace = path.join(tempDir, 'workspace');
            await writeYaml(path.join(workspace, 'model.yaml'), `model:\n  name: root\ndependencies:\n  A:\n    source: org/A\n    ref: v1.0.0\n  B:\n    source: org/B\n    ref: v1.0.0\n`);
            // A -> core@v1.2.0, B -> core@v1.3.0 (same major = auto-resolve to v1.3.0)
            await writeYaml(path.join(cacheDir, 'github', 'org', 'A', 'deadbeef', 'model.yaml'), `model:\n  name: A\ndependencies:\n  core:\n    source: domainlang/core\n    ref: v1.2.0\n`);
            await writeYaml(path.join(cacheDir, 'github', 'org', 'B', 'deadbeef', 'model.yaml'), `model:\n  name: B\ndependencies:\n  core:\n    source: domainlang/core\n    ref: v1.3.0\n`);

            const resolver = new DependencyResolver(workspace, new FakeGitUrlResolver(cacheDir) as any);
            const lock = await resolver.resolveDependencies();

            // Should resolve without error
            expect(lock.dependencies['domainlang/core']).toBeDefined();
            expect(lock.dependencies['domainlang/core'].ref).toBe('v1.3.0');
        });

        test('errors on major version mismatch', async () => {
            const workspace = path.join(tempDir, 'workspace');
            await writeYaml(path.join(workspace, 'model.yaml'), `model:\n  name: root\ndependencies:\n  A:\n    source: org/A\n    ref: v1.0.0\n  B:\n    source: org/B\n    ref: v1.0.0\n`);
            // A -> core@v1.0.0, B -> core@v2.0.0 (major mismatch = error)
            await writeYaml(path.join(cacheDir, 'github', 'org', 'A', 'deadbeef', 'model.yaml'), `model:\n  name: A\ndependencies:\n  core:\n    source: domainlang/core\n    ref: v1.0.0\n`);
            await writeYaml(path.join(cacheDir, 'github', 'org', 'B', 'deadbeef', 'model.yaml'), `model:\n  name: B\ndependencies:\n  core:\n    source: domainlang/core\n    ref: v2.0.0\n`);

            const resolver = new DependencyResolver(workspace, new FakeGitUrlResolver(cacheDir) as any);
            await expect(resolver.resolveDependencies()).rejects.toThrow(/Major version mismatch/i);
        });

        test('errors on mixed ref types (tag vs branch)', async () => {
            const workspace = path.join(tempDir, 'workspace');
            await writeYaml(path.join(workspace, 'model.yaml'), `model:\n  name: root\ndependencies:\n  A:\n    source: org/A\n    ref: v1.0.0\n  B:\n    source: org/B\n    ref: v1.0.0\n`);
            // A -> core@v1.0.0 (tag), B -> core@main (branch)
            await writeYaml(path.join(cacheDir, 'github', 'org', 'A', 'deadbeef', 'model.yaml'), `model:\n  name: A\ndependencies:\n  core:\n    source: domainlang/core\n    ref: v1.0.0\n`);
            await writeYaml(path.join(cacheDir, 'github', 'org', 'B', 'deadbeef', 'model.yaml'), `model:\n  name: B\ndependencies:\n  core:\n    source: domainlang/core\n    ref: main\n`);

            const resolver = new DependencyResolver(workspace, new FakeGitUrlResolver(cacheDir) as any);
            await expect(resolver.resolveDependencies()).rejects.toThrow(/Cannot mix ref types/i);
        });

        test('allows same branch refs without error', async () => {
            const workspace = path.join(tempDir, 'workspace');
            await writeYaml(path.join(workspace, 'model.yaml'), `model:\n  name: root\ndependencies:\n  A:\n    source: org/A\n    ref: main\n  B:\n    source: org/B\n    ref: main\n`);
            // A -> core@main, B -> core@main (same branch = no conflict)
            await writeYaml(path.join(cacheDir, 'github', 'org', 'A', 'deadbeef', 'model.yaml'), `model:\n  name: A\ndependencies:\n  core:\n    source: domainlang/core\n    ref: main\n`);
            await writeYaml(path.join(cacheDir, 'github', 'org', 'B', 'deadbeef', 'model.yaml'), `model:\n  name: B\ndependencies:\n  core:\n    source: domainlang/core\n    ref: main\n`);

            const resolver = new DependencyResolver(workspace, new FakeGitUrlResolver(cacheDir) as any);
            const lock = await resolver.resolveDependencies();

            // Should resolve without error
            expect(lock.dependencies['domainlang/core']).toBeDefined();
            expect(lock.dependencies['domainlang/core'].ref).toBe('main');
        });

        test('errors on different branch refs', async () => {
            const workspace = path.join(tempDir, 'workspace');
            await writeYaml(path.join(workspace, 'model.yaml'), `model:\n  name: root\ndependencies:\n  A:\n    source: org/A\n    ref: main\n  B:\n    source: org/B\n    ref: main\n`);
            // A -> core@main, B -> core@develop (different branches = error)
            await writeYaml(path.join(cacheDir, 'github', 'org', 'A', 'deadbeef', 'model.yaml'), `model:\n  name: A\ndependencies:\n  core:\n    source: domainlang/core\n    ref: main\n`);
            await writeYaml(path.join(cacheDir, 'github', 'org', 'B', 'deadbeef', 'model.yaml'), `model:\n  name: B\ndependencies:\n  core:\n    source: domainlang/core\n    ref: develop\n`);

            const resolver = new DependencyResolver(workspace, new FakeGitUrlResolver(cacheDir) as any);
            await expect(resolver.resolveDependencies()).rejects.toThrow(/Different branch refs/i);
        });

        test('provides resolution messages for auto-resolved conflicts', async () => {
            const workspace = path.join(tempDir, 'workspace');
            await writeYaml(path.join(workspace, 'model.yaml'), `model:\n  name: root\ndependencies:\n  A:\n    source: org/A\n    ref: v1.0.0\n  B:\n    source: org/B\n    ref: v1.0.0\n`);
            // A -> core@v1.1.0, B -> core@v1.5.0 (auto-resolve to v1.5.0)
            await writeYaml(path.join(cacheDir, 'github', 'org', 'A', 'deadbeef', 'model.yaml'), `model:\n  name: A\ndependencies:\n  core:\n    source: domainlang/core\n    ref: v1.1.0\n`);
            await writeYaml(path.join(cacheDir, 'github', 'org', 'B', 'deadbeef', 'model.yaml'), `model:\n  name: B\ndependencies:\n  core:\n    source: domainlang/core\n    ref: v1.5.0\n`);

            const resolver = new DependencyResolver(workspace, new FakeGitUrlResolver(cacheDir) as any);
            await resolver.resolveDependencies();

            const messages = resolver.getResolutionMessages();
            expect(messages).toHaveLength(1);
            expect(messages[0]).toContain('domainlang/core');
            expect(messages[0]).toContain('v1.5.0');
        });
    });

    describe('overrides', () => {
        test('resolves major version conflict with override', async () => {
            const workspace = path.join(tempDir, 'workspace');
            // Root manifest with override to force v2.0.0
            await writeYaml(path.join(workspace, 'model.yaml'), 
                `model:\n  name: root\ndependencies:\n  A:\n    source: org/A\n    ref: v1.0.0\n  B:\n    source: org/B\n    ref: v1.0.0\noverrides:\n  domainlang/core: v2.0.0\n`
            );
            // A -> core@v1.0.0, B -> core@v2.0.0 (conflict resolved by override)
            await writeYaml(path.join(cacheDir, 'github', 'org', 'A', 'deadbeef', 'model.yaml'), `model:\n  name: A\ndependencies:\n  core:\n    source: domainlang/core\n    ref: v1.0.0\n`);
            await writeYaml(path.join(cacheDir, 'github', 'org', 'B', 'deadbeef', 'model.yaml'), `model:\n  name: B\ndependencies:\n  core:\n    source: domainlang/core\n    ref: v2.0.0\n`);

            const resolver = new DependencyResolver(workspace, new FakeGitUrlResolver(cacheDir) as any);
            const lock = await resolver.resolveDependencies();

            // Should resolve without error due to override
            expect(lock.dependencies['domainlang/core']).toBeDefined();
            expect(lock.dependencies['domainlang/core'].ref).toBe('v2.0.0');
        });

        test('resolves mixed ref type conflict with override', async () => {
            const workspace = path.join(tempDir, 'workspace');
            // Root manifest with override to force specific tag
            await writeYaml(path.join(workspace, 'model.yaml'), 
                `model:\n  name: root\ndependencies:\n  A:\n    source: org/A\n    ref: v1.0.0\n  B:\n    source: org/B\n    ref: v1.0.0\noverrides:\n  domainlang/core: v1.0.0\n`
            );
            // A -> core@v1.0.0 (tag), B -> core@main (branch) - conflict resolved by override
            await writeYaml(path.join(cacheDir, 'github', 'org', 'A', 'deadbeef', 'model.yaml'), `model:\n  name: A\ndependencies:\n  core:\n    source: domainlang/core\n    ref: v1.0.0\n`);
            await writeYaml(path.join(cacheDir, 'github', 'org', 'B', 'deadbeef', 'model.yaml'), `model:\n  name: B\ndependencies:\n  core:\n    source: domainlang/core\n    ref: main\n`);

            const resolver = new DependencyResolver(workspace, new FakeGitUrlResolver(cacheDir) as any);
            const lock = await resolver.resolveDependencies();

            // Should resolve without error due to override
            expect(lock.dependencies['domainlang/core']).toBeDefined();
            expect(lock.dependencies['domainlang/core'].ref).toBe('v1.0.0');
        });

        test('provides override messages', async () => {
            const workspace = path.join(tempDir, 'workspace');
            await writeYaml(path.join(workspace, 'model.yaml'), 
                `model:\n  name: root\ndependencies:\n  A:\n    source: org/A\n    ref: v1.0.0\n  B:\n    source: org/B\n    ref: v1.0.0\noverrides:\n  domainlang/core: v2.0.0\n`
            );
            await writeYaml(path.join(cacheDir, 'github', 'org', 'A', 'deadbeef', 'model.yaml'), `model:\n  name: A\ndependencies:\n  core:\n    source: domainlang/core\n    ref: v1.0.0\n`);
            await writeYaml(path.join(cacheDir, 'github', 'org', 'B', 'deadbeef', 'model.yaml'), `model:\n  name: B\ndependencies:\n  core:\n    source: domainlang/core\n    ref: v2.0.0\n`);

            const resolver = new DependencyResolver(workspace, new FakeGitUrlResolver(cacheDir) as any);
            await resolver.resolveDependencies();

            const messages = resolver.getOverrideMessages();
            expect(messages).toHaveLength(1);
            expect(messages[0]).toContain('domainlang/core');
            expect(messages[0]).toContain('v2.0.0');
        });
    });
});
