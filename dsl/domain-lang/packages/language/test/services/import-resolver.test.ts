import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, test, beforeEach, afterEach, expect } from 'vitest';
import { createDomainLangServices } from '../../src/domain-lang-module.js';
import { EmptyFileSystem } from 'langium';

let resolver: ReturnType<typeof createDomainLangServices>["DomainLang"]["imports"]["ImportResolver"];
let tempDir: string;

async function writeFile(filePath: string, content = ''): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
}

describe('ImportResolver (PRS-010 Phase 3)', () => {
    beforeEach(async () => {
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dlang-import-resolver-'));
        const servicesLocal = createDomainLangServices(EmptyFileSystem).DomainLang;
        resolver = servicesLocal.imports.ImportResolver;
    });

    afterEach(async () => {
        await fs.rm(tempDir, { recursive: true, force: true });
    });

    test('resolves relative local imports without manifest', async () => {
        // Arrange
        const base = path.join(tempDir, 'proj');
        const types = path.join(base, 'types.dlang');
        await writeFile(types, 'Domain X {}');

        // Act
        const uri = await resolver.resolveFrom(base, './types.dlang');

        // Assert
        expect(uri.fsPath).toBe(types);
    });

    test('external import without manifest produces error', async () => {
        // Arrange
        const base = path.join(tempDir, 'no-manifest');
        await fs.mkdir(base, { recursive: true });

        // Act / Assert
        await expect(resolver.resolveFrom(base, 'acme/core')).rejects.toThrow(/requires model\.yaml/i);
    });

    test('resolves path alias from manifest (monorepo support)', async () => {
        // Arrange - NEW design: Use paths section for local aliases
        const base = path.join(tempDir, 'proj');
        const manifest = `model:\n  name: sample\npaths:\n  "@shared": ./shared\n`;
        await writeFile(path.join(base, 'model.yaml'), manifest);
        const sharedIndex = path.join(base, 'shared', 'index.dlang');
        const sharedTypes = path.join(base, 'shared', 'types.dlang');
        await writeFile(sharedIndex, 'Domain Shared {}');
        await writeFile(sharedTypes, 'Domain Types {}');

        // Act - Use @shared path alias
        const indexUri = await resolver.resolveFrom(base, '@shared');
        const typesUri = await resolver.resolveFrom(base, '@shared/types.dlang');

        // Assert
        expect(indexUri.fsPath).toBe(sharedIndex);
        expect(typesUri.fsPath).toBe(sharedTypes);
    });

    test('resolves implicit @/ alias to workspace root (PRS-010)', async () => {
        // Arrange - @/ maps to workspace root implicitly without explicit paths section
        const base = path.join(tempDir, 'proj');
        const manifest = `model:\n  name: sample\n`;  // No paths section!
        await writeFile(path.join(base, 'model.yaml'), manifest);
        const libUtils = path.join(base, 'lib', 'utils.dlang');
        await writeFile(libUtils, 'Domain Utils {}');

        // Act - Use implicit @/ alias
        const uri = await resolver.resolveFrom(base, '@/lib/utils.dlang');

        // Assert
        expect(uri.fsPath).toBe(libUtils);
    });

    test('directory-first resolution with file fallback (PRS-010)', async () => {
        // Arrange - No directory, only a file
        const base = path.join(tempDir, 'proj');
        const typesFile = path.join(base, 'types.dlang');
        await writeFile(typesFile, 'Domain Types {}');
        // Note: NOT creating types/ directory

        // Act - Import without extension should fall back to file
        const uri = await resolver.resolveFrom(base, './types');

        // Assert - Should resolve to types.dlang (file fallback)
        expect(uri.fsPath).toBe(typesFile);
    });

    test('directory-first resolution prefers index.dlang over .dlang file', async () => {
        // Arrange - Both directory with index.dlang AND types.dlang file exist
        const base = path.join(tempDir, 'proj');
        const typesIndex = path.join(base, 'types', 'index.dlang');
        const typesFile = path.join(base, 'types.dlang');
        await writeFile(typesIndex, 'Domain TypesIndex {}');
        await writeFile(typesFile, 'Domain TypesFile {}');

        // Act - Import without extension should prefer directory
        const uri = await resolver.resolveFrom(base, './types');

        // Assert - Should resolve to types/index.dlang (directory-first)
        expect(uri.fsPath).toBe(typesIndex);
    });

    test('unknown path alias produces helpful error', async () => {
        // Arrange
        const base = path.join(tempDir, 'proj');
        const manifest = `model:\n  name: sample\n`;
        await writeFile(path.join(base, 'model.yaml'), manifest);

        // Act / Assert - @unknown is not defined in paths section
        await expect(resolver.resolveFrom(base, '@unknown/stuff')).rejects.toThrow(
            /unknown path alias.*@unknown/i
        );
    });
});
