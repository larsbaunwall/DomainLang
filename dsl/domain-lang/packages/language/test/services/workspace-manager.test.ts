/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { beforeAll, afterAll, beforeEach, describe, expect, test } from "vitest";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { WorkspaceManager } from "../../src/services/workspace-manager.js";
import { resetGlobalOptimizer } from "../../src/services/performance-optimizer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_ROOT = path.resolve(__dirname, "../fixtures/sample-workspace");
const ALIAS_ROOT = path.resolve(__dirname, "../fixtures/alias-workspace");
const LOCK_FILE = path.join(TEST_ROOT, "model.lock");

// Helper: create a dummy lock file
async function createLockFile() {
    const lock = {
        version: "1",
        dependencies: {
            "acme/ddd-patterns": {
                version: "2.1.0",
                resolved: "https://github.com/acme/ddd-patterns",
                commit: "abc123",
                integrity: "sha256-foo"
            }
        }
    };
    await fs.writeFile(LOCK_FILE, JSON.stringify(lock, undefined, 2), "utf-8");
}

// Helper: clean up lock file
async function cleanup() {
    try { await fs.unlink(LOCK_FILE); } catch {
        // File doesn't exist, ignore
    }
}

describe("WorkspaceManager", () => {
    beforeAll(async () => {
        await cleanup();
    });
    beforeEach(async () => {
        await cleanup();
        resetGlobalOptimizer();
    });
    afterAll(async () => {
        await cleanup();
    });

    test("finds workspace root and loads lock file", async () => {
        // Arrange
        await createLockFile();
        const manager = new WorkspaceManager({ autoResolve: false });

        // Act
        await manager.initialize(TEST_ROOT);
        const lock = await manager.getLockFile();

        // Assert
        expect(lock).toBeDefined();
        expect(lock?.dependencies["acme/ddd-patterns"]).toBeDefined();
        expect(manager.getWorkspaceRoot()).toBe(TEST_ROOT);
    });

    test("returns undefined if lock file missing", async () => {
        // Arrange
        const manager = new WorkspaceManager({ autoResolve: false });

        // Act
        await manager.initialize(TEST_ROOT);
        const lock = await manager.getLockFile();

        // Assert
        expect(lock).toBeUndefined();
    });

    test("resolves dependency aliases from manifest", async () => {
        // Arrange
        const manager = new WorkspaceManager({ autoResolve: false });
        await manager.initialize(ALIAS_ROOT);

        // Act
        const direct = await manager.resolveDependencyImport("ddd-patterns");
        const withSubPath = await manager.resolveDependencyImport("ddd-patterns/patterns.dlang");
        const missing = await manager.resolveDependencyImport("unknown");

        // Assert
        expect(direct).toBe("ddd-patterns/core@v2.1.0");
        expect(withSubPath).toBe("ddd-patterns/core@v2.1.0/patterns.dlang");
        expect(missing).toBeUndefined();
    });
});
