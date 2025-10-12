import { 
    listModels, 
    installModels, 
    addModel, 
    removeModel, 
    statusModels, 
    updateModel, 
    cacheClear,
    showDependencyTree,
    showImpactAnalysis,
    validateModel,
    auditDependencies,
    checkCompliance
} from './dependency-commands.js';
import type { Model } from 'domain-lang-language';
import chalk from 'chalk';
import { Command } from 'commander';
import { DomainLangLanguageMetaData, createDomainLangServices } from 'domain-lang-language';
import { extractAstNode } from './cli-util.js';
import { generateJavaScript } from './generator.js';
import { NodeFileSystem } from 'langium/node';
import { performance } from 'node:perf_hooks';
import * as url from 'node:url';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const packagePath = path.resolve(__dirname, '..', '..', 'package.json');
const packageContent = await fs.readFile(packagePath, 'utf-8');

export const generateAction = async (fileName: string, opts: GenerateOptions): Promise<void> => {
    try {
        const services = createDomainLangServices(NodeFileSystem).DomainLang;
        
        // Simple performance tracking if requested
        const startTime = opts.profile ? performance.now() : 0;
    let parseTime = 0;
        
        if (opts.profile) {
            console.log(chalk.blue('🔍 Performance profiling enabled'));
            const parseStart = performance.now();
            const model = await extractAstNode<Model>(fileName, services);
            parseTime = performance.now() - parseStart;
            
            
            const generatedFilePath = generateJavaScript(model, fileName, opts.destination);
            const totalTime = performance.now() - startTime;
            
            // Display profiling results
            console.log(chalk.blue('\n📊 Performance Profile:'));
            console.log(chalk.gray('─'.repeat(60)));
            console.log(chalk.cyan(`  Total Time: ${totalTime.toFixed(2)}ms`));
            console.log(chalk.gray(`  - Parsing: ${parseTime.toFixed(2)}ms`));
            console.log(chalk.gray('─'.repeat(60)));
            
            console.log(chalk.green('✓ JavaScript code generated successfully:'), chalk.cyan(generatedFilePath));
        } else {
            const model = await extractAstNode<Model>(fileName, services);
            const generatedFilePath = generateJavaScript(model, fileName, opts.destination);
            console.log(chalk.green('✓ JavaScript code generated successfully:'), chalk.cyan(generatedFilePath));
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(chalk.red('✗ Generation failed:'), message);
        process.exit(1);
    }
};

export type GenerateOptions = {
    destination?: string;
    profile?: boolean;
}

export default function(): void {
    const program = new Command();

    program.version(JSON.parse(packageContent).version);

    const fileExtensions = DomainLangLanguageMetaData.fileExtensions.join(', ');
    program
        .command('generate')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .option('-d, --destination <dir>', 'destination directory of generating')
        .option('-p, --profile', 'enable performance profiling')
        .description('generates JavaScript code that prints "Hello, {name}!" for each greeting in a source file')
        .action(generateAction);

    // Model dependency management commands
    program
        .command('model')
        .description('Manage model dependencies')
        .action(() => {
            console.log('Use: model list|add|remove|status|update');
        });

    program
        .command('model list')
        .description('List all model dependencies')
        .action(async () => {
            await listModels(process.cwd());
        });

    program
        .command('model add')
        .description('Add a model dependency')
        .argument('<name>', 'dependency name')
        .argument('<source>', 'git source (e.g., owner/repo)')
        .argument('[version]', 'version constraint (default: main)', 'main')
        .action(async (name: string, source: string, version: string) => {
            await addModel(process.cwd(), name, source, version);
        });

    program
        .command('model remove')
        .description('Remove a model dependency')
        .argument('<name>', 'dependency name')
        .action(async (name: string) => {
            await removeModel(process.cwd(), name);
        });

    program
        .command('model status')
        .description('Check dependency status')
        .action(async () => {
            await statusModels(process.cwd());
        });

    program
        .command('model update')
        .description('Update dependencies')
        .argument('[name]', 'specific dependency to update (optional)')
        .action(async (name?: string) => {
            await updateModel(process.cwd(), name);
        });

    program
        .command('install')
        .description('Install all model dependencies and generate lock file')
        .action(async () => {
            await installModels(process.cwd());
        });

    program
        .command('cache-clear')
        .description('Clear the dependency cache')
        .action(async () => {
            await cacheClear();
        });

    program
        .command('model tree')
        .description('Show dependency tree')
        .option('-c, --commits', 'Show commit hashes')
        .action(async (opts: { commits?: boolean }) => {
            await showDependencyTree(process.cwd(), { commits: opts.commits });
        });

    program
        .command('model deps')
        .description('Show packages that depend on a given package')
        .argument('<package>', 'package name (e.g., owner/repo)')
        .action(async (packageName: string) => {
            await showImpactAnalysis(process.cwd(), packageName);
        });

    program
        .command('model validate')
        .description('Validate model structure and dependencies')
        .action(async () => {
            await validateModel(process.cwd());
        });

    program
        .command('model audit')
        .description('Generate governance audit report')
        .action(async () => {
            await auditDependencies(process.cwd());
        });

    program
        .command('model compliance')
        .description('Check compliance with governance policies')
        .action(async () => {
            await checkCompliance(process.cwd());
        });

    program.parse(process.argv);
}
