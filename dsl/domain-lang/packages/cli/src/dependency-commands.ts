import { WorkspaceManager, DependencyAnalyzer, GovernanceValidator, loadGovernancePolicy } from '@domainlang/language';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import YAML from 'yaml';

interface ModelYaml {
    model?: {
        name?: string;
        version?: string;
        entry?: string;
    };
    dependencies?: Record<string, {
        source: string;
        version: string;
        description?: string;
    }>;
}

/**
 * CLI commands for DomainLang dependency management.
 */
export async function listModels(workspaceRoot: string): Promise<void> {
    const manager = new WorkspaceManager();
    await manager.initialize(workspaceRoot);
    const lock = await manager.getLockFile();
    if (!lock) {
        console.log('No lock file found. Run `domain-lang-cli install` to generate dependencies.');
        return;
    }
    console.log('Model dependencies:');
    for (const [name, dep] of Object.entries(lock.dependencies)) {
        console.log(`  ${name}@${dep.ref} (${dep.commit.substring(0, 7)})`);
    }
}

export async function addModel(workspaceRoot: string, name: string, source: string, version = 'main'): Promise<void> {
    const manifestPath = path.join(workspaceRoot, 'model.yaml');
    
    // Read existing manifest
    let manifest: ModelYaml = {};
    try {
        const content = await fs.readFile(manifestPath, 'utf-8');
        manifest = YAML.parse(content) as ModelYaml;
    } catch {
        // Create new manifest
        manifest = {
            model: {
                name: path.basename(workspaceRoot),
                version: '1.0.0',
            },
        };
    }

    // Add dependency
    if (!manifest.dependencies) {
        manifest.dependencies = {};
    }

    manifest.dependencies[name] = {
        source,
        version,
    };

    // Write updated manifest
    const yamlContent = YAML.stringify(manifest);
    await fs.writeFile(manifestPath, yamlContent, 'utf-8');
    
    console.log(`Added ${name}: ${source}@${version}`);
    console.log('Run `domain-lang-cli install` to download dependencies.');
}

export async function removeModel(workspaceRoot: string, name: string): Promise<void> {
    const manifestPath = path.join(workspaceRoot, 'model.yaml');
    
    try {
        const content = await fs.readFile(manifestPath, 'utf-8');
        const manifest = YAML.parse(content) as ModelYaml;

        if (!manifest.dependencies?.[name]) {
            console.error(`Dependency "${name}" not found in model.yaml`);
            return;
        }

        delete manifest.dependencies[name];

        const yamlContent = YAML.stringify(manifest);
        await fs.writeFile(manifestPath, yamlContent, 'utf-8');
        
        console.log(`Removed ${name}`);
        console.log('Run `domain-lang-cli install` to update lock file.');
    } catch (error) {
        console.error('Failed to remove dependency:', error);
    }
}

export async function statusModels(workspaceRoot: string): Promise<void> {
    const manager = new WorkspaceManager({ autoResolve: false });
    await manager.initialize(workspaceRoot);
    
    const manifestPath = await manager.getManifestPath();
    if (!manifestPath) {
        console.log('No model.yaml found in workspace.');
        return;
    }

    const lock = await manager.getLockFile();
    
    const content = await fs.readFile(manifestPath, 'utf-8');
    const manifest = YAML.parse(content) as ModelYaml;

    if (!manifest.dependencies || Object.keys(manifest.dependencies).length === 0) {
        console.log('No dependencies declared in model.yaml');
        return;
    }

    console.log('Dependency status:');
    for (const [name, dep] of Object.entries(manifest.dependencies)) {
        const locked = lock?.dependencies[dep.source];
        if (locked) {
            console.log(`  ✓ ${name} (${dep.source}@${dep.version}) → locked to ${locked.commit.substring(0, 7)}`);
        } else {
            console.log(`  ✗ ${name} (${dep.source}@${dep.version}) → not locked`);
        }
    }

    if (!lock || Object.keys(lock.dependencies).length === 0) {
        console.log('\nRun `domain-lang-cli install` to lock dependencies.');
    }
}

export async function updateModel(workspaceRoot: string, name?: string): Promise<void> {
    console.log(name ? `Updating ${name}...` : 'Updating all dependencies...');
    
    // For now, just regenerate the lock file
    const manager = new WorkspaceManager();
    await manager.initialize(workspaceRoot);
    await manager.regenerateLockFile();
    
    console.log('Dependencies updated and lock file regenerated.');
}

export async function installModels(workspaceRoot: string): Promise<void> {
    const manager = new WorkspaceManager();
    await manager.initialize(workspaceRoot);
    const lock = await manager.ensureLockFile();
    
    const count = Object.keys(lock.dependencies).length;
    console.log(`Dependencies installed: ${count} package(s) locked.`);
}

export async function cacheClear(): Promise<void> {
    const cacheDir = path.join(os.homedir(), '.dlang', 'cache');
    
    try {
        await fs.rm(cacheDir, { recursive: true, force: true });
        console.log('Cache cleared successfully.');
    } catch (error) {
        console.error('Failed to clear cache:', error);
    }
}

export async function showDependencyTree(workspaceRoot: string, options: { commits?: boolean } = {}): Promise<void> {
    const manager = new WorkspaceManager({ autoResolve: false });
    await manager.initialize(workspaceRoot);
    const lock = await manager.getLockFile();
    
    if (!lock || Object.keys(lock.dependencies).length === 0) {
        console.log('No dependencies found. Run `domain-lang-cli install` first.');
        return;
    }

    const analyzer = new DependencyAnalyzer();
    const tree = await analyzer.buildDependencyTree(lock, workspaceRoot);
    
    if (tree.length === 0) {
        console.log('Dependency tree is empty.');
        return;
    }

    console.log('Dependency tree:');
    console.log(analyzer.formatDependencyTree(tree, { showCommits: options.commits }));
}

export async function showImpactAnalysis(workspaceRoot: string, packageName: string): Promise<void> {
    const manager = new WorkspaceManager({ autoResolve: false });
    await manager.initialize(workspaceRoot);
    const lock = await manager.getLockFile();
    
    if (!lock) {
        console.log('No lock file found. Run `domain-lang-cli install` first.');
        return;
    }

    const analyzer = new DependencyAnalyzer();
    const reverseDeps = await analyzer.findReverseDependencies(packageName, lock, workspaceRoot);
    
    if (reverseDeps.length === 0) {
        console.log(`No packages depend on "${packageName}".`);
        return;
    }

    console.log(`Packages depending on "${packageName}":`);
    for (const dep of reverseDeps) {
        const typeLabel = dep.type === 'direct' ? '→' : '⇢';
        console.log(`  ${typeLabel} ${dep.dependentPackage}@${dep.ref}`);
    }
}

export async function validateModel(workspaceRoot: string): Promise<void> {
    const manager = new WorkspaceManager({ autoResolve: false });
    await manager.initialize(workspaceRoot);
    const lock = await manager.getLockFile();
    
    if (!lock) {
        console.log('No lock file found. Run `domain-lang-cli install` first.');
        return;
    }

    const analyzer = new DependencyAnalyzer();
    const cycles = await analyzer.detectCircularDependencies(lock);
    
    if (cycles.length > 0) {
        console.log('\u26a0 Circular dependencies detected:');
        for (const cycle of cycles) {
            console.log(`  ${cycle.join(' \u2192 ')}`);
        }
        return;
    }

    console.log('\u2713 No circular dependencies detected.');
    console.log('\u2713 Model structure is valid.');
}

export async function auditDependencies(workspaceRoot: string): Promise<void> {
    const manager = new WorkspaceManager({ autoResolve: false });
    await manager.initialize(workspaceRoot);
    const lock = await manager.getLockFile();
    
    if (!lock) {
        console.log('No lock file found. Run `domain-lang-cli install` first.');
        return;
    }

    const policy = await loadGovernancePolicy(workspaceRoot);
    const validator = new GovernanceValidator(policy);
    const report = await validator.generateAuditReport(lock, workspaceRoot);
    
    console.log(report);
}

export async function checkCompliance(workspaceRoot: string): Promise<void> {
    const manager = new WorkspaceManager({ autoResolve: false });
    await manager.initialize(workspaceRoot);
    const lock = await manager.getLockFile();
    
    if (!lock) {
        console.log('No lock file found. Run `domain-lang-cli install` first.');
        return;
    }

    const policy = await loadGovernancePolicy(workspaceRoot);
    const validator = new GovernanceValidator(policy);
    const violations = await validator.validate(lock, workspaceRoot);
    
    if (violations.length === 0) {
        console.log('\u2713 All dependencies comply with governance policies.');
        return;
    }

    console.log(`\u26a0 Found ${violations.length} policy violation(s):\n`);
    for (const violation of violations) {
        const icon = violation.severity === 'error' ? '\u2717' : '\u26a0';
        console.log(`${icon} [${violation.severity.toUpperCase()}] ${violation.packageKey}`);
        console.log(`  ${violation.message}\n`);
    }
}
