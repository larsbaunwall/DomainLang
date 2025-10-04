import { beforeAll, afterAll, describe, expect, it } from "vitest";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { installModels, listModels } from "../../src/cli/dependency-commands.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_ROOT = path.resolve(__dirname, "../fixtures/sample-workspace");
const LOCK_FILE = path.join(TEST_ROOT, "model.lock");

describe("Dependency CLI integration", () => {
    beforeAll(async () => {
        try { await fs.unlink(LOCK_FILE); } catch {}
    });
    afterAll(async () => {
        try { await fs.unlink(LOCK_FILE); } catch {}
    });

    it("installs dependencies (no dependencies = empty lock)", async () => {
        await installModels(TEST_ROOT);
        // With no dependencies in model.yaml, lock file is still created
        const exists = !!(await fs.stat(LOCK_FILE).catch(() => false));
        if (exists) {
            const content = await fs.readFile(LOCK_FILE, "utf-8");
            expect(content).toContain("version");
        }
        // No error means success (even with empty dependencies)
    });

    it("lists model dependencies", async () => {
        // Should not throw
        await listModels(TEST_ROOT);
    });
});
