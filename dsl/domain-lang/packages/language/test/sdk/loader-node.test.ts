/**
 * Node.js Loader Tests
 * 
 * Tests the loadModel() function from loader-node.ts:
 * - Single file loading
 * - Multi-file import graph traversal
 * - Error handling for invalid files
 * - Model augmentation for all loaded files
 */
import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { loadModel } from '../../src/sdk/loader-node.js';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';

describe('SDK loadModel (Node.js)', () => {
    let tempDir: string;

    beforeAll(async () => {
        // Arrange - Create temp workspace for file-based tests
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dlang-loader-node-'));
    });

    afterAll(async () => {
        // Cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
    });

    describe('Single file loading', () => {
        test('should load a basic domain model from disk', async () => {
            // Arrange
            const projectDir = path.join(tempDir, 'single-file');
            await fs.mkdir(projectDir, { recursive: true });
            await fs.writeFile(path.join(projectDir, 'domains.dlang'), `
                Domain Sales {
                    vision: "Sales operations"
                }
            `);

            // Act
            const { query, model, documents } = await loadModel(
                'domains.dlang',
                { workspaceDir: projectDir }
            );

            // Assert
            expect(model).toBeDefined();
            expect(documents.length).toBe(1);
            expect(query.domain('Sales')?.name).toBe('Sales');
        });

        test('should throw on non-existent file', async () => {
            // Arrange
            const projectDir = path.join(tempDir, 'missing-file');
            await fs.mkdir(projectDir, { recursive: true });

            // Act & Assert
            await expect(
                loadModel('does-not-exist.dlang', { workspaceDir: projectDir })
            ).rejects.toThrow();
        });

        test('should throw on invalid syntax', async () => {
            // Arrange
            const projectDir = path.join(tempDir, 'invalid-syntax');
            await fs.mkdir(projectDir, { recursive: true });
            await fs.writeFile(path.join(projectDir, 'invalid.dlang'), `
                This is not valid DomainLang syntax !!!
            `);

            // Act & Assert
            await expect(
                loadModel('invalid.dlang', { workspaceDir: projectDir })
            ).rejects.toThrow(/errors/i);
        });
    });

    describe('Multi-file import graph traversal', () => {
        test('should load imported files from local imports', async () => {
            // Arrange - Create project with imports
            const projectDir = path.join(tempDir, 'multi-file-local');
            await fs.mkdir(projectDir, { recursive: true });

            // Main entry file imports types
            await fs.writeFile(path.join(projectDir, 'main.dlang'), `
                import "./types.dlang"
                
                Domain Sales {
                    vision: "Sales operations"
                }
                
                BoundedContext OrderContext for Sales {
                    description: "Order processing"
                }
            `);

            // Types file defines shared types
            await fs.writeFile(path.join(projectDir, 'types.dlang'), `
                Domain SharedTypes {
                    vision: "Shared type definitions"
                }
            `);

            // Act
            const { query, documents } = await loadModel(
                'main.dlang',
                { workspaceDir: projectDir }
            );

            // Assert - Both files loaded (tracked via documents)
            expect(documents.length).toBe(2);
            // Query searches the entry model's content
            const domains = query.domains().toArray();
            expect(domains.length).toBe(1);
            expect(domains[0].name).toBe('Sales');
        });

        test('should handle transitive imports (A imports B, B imports C)', async () => {
            // Arrange - Create chain of imports
            const projectDir = path.join(tempDir, 'transitive-imports');
            await fs.mkdir(projectDir, { recursive: true });

            // main.dlang imports domains.dlang
            await fs.writeFile(path.join(projectDir, 'main.dlang'), `
                import "./domains.dlang"
                
                BoundedContext App for Sales {
                    description: "Main app"
                }
            `);

            // domains.dlang imports teams.dlang
            await fs.writeFile(path.join(projectDir, 'domains.dlang'), `
                import "./teams.dlang"
                
                Domain Sales {
                    vision: "Sales operations"
                }
            `);

            // teams.dlang is the leaf
            await fs.writeFile(path.join(projectDir, 'teams.dlang'), `
                Team SalesTeam
                Team SupportTeam
            `);

            // Act
            const { query, documents } = await loadModel(
                'main.dlang',
                { workspaceDir: projectDir }
            );

            // Assert - All three files loaded
            expect(documents.length).toBe(3);
            
            // Entry file content accessible directly
            expect(query.bc('App')?.name).toBe('App');
        });

        test('should handle diamond imports (A imports B and C, both import D)', async () => {
            // Arrange - Create diamond dependency
            const projectDir = path.join(tempDir, 'diamond-imports');
            await fs.mkdir(projectDir, { recursive: true });

            // main.dlang imports contexts.dlang and teams.dlang
            await fs.writeFile(path.join(projectDir, 'main.dlang'), `
                import "./contexts.dlang"
                import "./teams.dlang"
                
                Domain Sales {
                    vision: "Sales operations"
                }
            `);

            // contexts.dlang imports shared.dlang
            await fs.writeFile(path.join(projectDir, 'contexts.dlang'), `
                import "./shared.dlang"
                
                BoundedContext OrderContext for Sales {
                    description: "Orders"
                }
            `);

            // teams.dlang also imports shared.dlang
            await fs.writeFile(path.join(projectDir, 'teams.dlang'), `
                import "./shared.dlang"
                
                Team SalesTeam
            `);

            // shared.dlang is imported by both
            await fs.writeFile(path.join(projectDir, 'shared.dlang'), `
                Metadata Priority
            `);

            // Act
            const { documents } = await loadModel(
                'main.dlang',
                { workspaceDir: projectDir }
            );

            // Assert - All four files loaded (shared.dlang only once)
            expect(documents.length).toBe(4);
        });

        test('should handle imports in subdirectories', async () => {
            // Arrange - Create nested structure
            const projectDir = path.join(tempDir, 'nested-imports');
            await fs.mkdir(path.join(projectDir, 'domains'), { recursive: true });

            // main.dlang imports from subdirectory
            await fs.writeFile(path.join(projectDir, 'main.dlang'), `
                import "./domains/sales.dlang"
                
                BoundedContext App for Sales {
                    description: "Main app"
                }
            `);

            // domains/sales.dlang in subdirectory
            await fs.writeFile(path.join(projectDir, 'domains', 'sales.dlang'), `
                Domain Sales {
                    vision: "Sales operations"
                }
            `);

            // Act
            const { query, documents } = await loadModel(
                'main.dlang',
                { workspaceDir: projectDir }
            );

            // Assert - Both files loaded
            expect(documents.length).toBe(2);
            expect(query.bc('App')?.name).toBe('App');
        });
    });

    describe('Model augmentation', () => {
        test('should augment entry model with SDK properties', async () => {
            // Arrange
            const projectDir = path.join(tempDir, 'augmentation-test');
            await fs.mkdir(projectDir, { recursive: true });

            await fs.writeFile(path.join(projectDir, 'main.dlang'), `
                Classification Core
                
                Domain Sales {
                    vision: "Sales operations"
                }
                
                Team SalesTeam
                
                BoundedContext OrderContext for Sales as Core by SalesTeam {
                    description: "Order processing"
                }
            `);

            // Act
            const { query } = await loadModel(
                'main.dlang',
                { workspaceDir: projectDir }
            );

            // Assert - SDK augmented properties work on entry file
            const bc = query.bc('OrderContext');
            expect(bc).toBeDefined();
            // effectiveClassification and effectiveTeam are SDK-augmented properties
            expect(bc?.effectiveClassification?.name).toBe('Core');
            expect(bc?.effectiveTeam?.name).toBe('SalesTeam');
        });
    });

    describe('Query API with multi-file models', () => {
        test('should support O(1) lookups in entry file', async () => {
            // Arrange - Entry file defines multiple entities
            const projectDir = path.join(tempDir, 'query-lookup-test');
            await fs.mkdir(projectDir, { recursive: true });

            await fs.writeFile(path.join(projectDir, 'main.dlang'), `
                Domain Sales { vision: "Sales" }
                Domain Finance { vision: "Finance" }
                
                BoundedContext OrderContext for Sales { description: "Orders" }
                BoundedContext PaymentContext for Finance { description: "Payments" }
            `);

            // Act
            const { query } = await loadModel(
                'main.dlang',
                { workspaceDir: projectDir }
            );

            // Assert - O(1) lookups work
            expect(query.domain('Sales')?.name).toBe('Sales');
            expect(query.domain('Finance')?.name).toBe('Finance');
            expect(query.bc('OrderContext')?.name).toBe('OrderContext');
            expect(query.bc('PaymentContext')?.name).toBe('PaymentContext');
        });

        test('should support filtering with query builders', async () => {
            // Arrange
            const projectDir = path.join(tempDir, 'query-filter-test');
            await fs.mkdir(projectDir, { recursive: true });

            await fs.writeFile(path.join(projectDir, 'main.dlang'), `
                Domain Sales { vision: "Sales" }
                Team CoreTeam
                Team SupportTeam
                
                BoundedContext OrderContext for Sales by CoreTeam {
                    description: "Orders"
                }
                
                BoundedContext ReportingContext for Sales by SupportTeam {
                    description: "Reports"
                }
            `);

            // Act
            const { query } = await loadModel(
                'main.dlang',
                { workspaceDir: projectDir }
            );

            // Assert - Filtering works
            const coreTeamContexts = query.boundedContexts().withTeam('CoreTeam').toArray();
            const supportTeamContexts = query.boundedContexts().withTeam('SupportTeam').toArray();

            expect(coreTeamContexts.length).toBe(1);
            expect(coreTeamContexts[0].name).toBe('OrderContext');
            expect(supportTeamContexts.length).toBe(1);
            expect(supportTeamContexts[0].name).toBe('ReportingContext');
        });

        test('should track all imported documents', async () => {
            // Arrange - Multi-file project
            const projectDir = path.join(tempDir, 'document-tracking-test');
            await fs.mkdir(projectDir, { recursive: true });

            await fs.writeFile(path.join(projectDir, 'main.dlang'), `
                import "./domains.dlang"
                import "./contexts.dlang"
                
                Team CoreTeam
            `);

            await fs.writeFile(path.join(projectDir, 'domains.dlang'), `
                Domain Sales { vision: "Sales" }
            `);

            await fs.writeFile(path.join(projectDir, 'contexts.dlang'), `
                BoundedContext OrderContext for Sales { description: "Orders" }
            `);

            // Act
            const { documents } = await loadModel(
                'main.dlang',
                { workspaceDir: projectDir }
            );

            // Assert - All documents tracked
            expect(documents.length).toBe(3);
            const paths = documents.map(uri => uri.fsPath);
            expect(paths.some(p => p.endsWith('main.dlang'))).toBe(true);
            expect(paths.some(p => p.endsWith('domains.dlang'))).toBe(true);
            expect(paths.some(p => p.endsWith('contexts.dlang'))).toBe(true);
        });
    });
});
