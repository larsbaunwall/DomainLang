#!/usr/bin/env node
/**
 * DomainLang CLI entry point.
 * Uses Ink for rich terminal UI, with fallback for JSON/quiet modes.
 * 
 * @module main
 */
import { render } from 'ink';
import React from 'react';
import { App } from './ui/App.js';
import { parseOutputConfig, shouldUseInk, stripOutputFlags } from './utils/output-mode.js';
import { isFirstRun, markFirstRunComplete } from './ui/hooks/useFirstRun.js';
import { runValidate } from './commands/validate.js';
import type { CommandContext } from './commands/types.js';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Get package version
const __dirname = dirname(fileURLToPath(import.meta.url));
const packagePath = resolve(__dirname, '..', '..', 'package.json');

async function getVersion(): Promise<string> {
    try {
        const content = await readFile(packagePath, 'utf-8');
        const pkg = JSON.parse(content) as { version: string };
        return pkg.version;
    } catch {
        return '0.0.0';
    }
}

/**
 * Parse command and arguments from argv.
 */
function parseArgs(argv: string[]): { command: string | undefined; args: string[] } {
    const args = stripOutputFlags(argv);
    const command = args[0];
    const commandArgs = args.slice(1);
    return { command, args: commandArgs };
}

/**
 * Main entry point.
 */
async function main(): Promise<void> {
    const rawArgs = process.argv.slice(2);
    const outputConfig = parseOutputConfig(rawArgs);
    const { command, args } = parseArgs(rawArgs);
    const version = await getVersion();
    const firstRun = isFirstRun();

    // Create command context
    const context: CommandContext = {
        ...outputConfig,
        version,
        isFirstRun: firstRun,
    };

    // Mark first run complete after showing welcome
    if (firstRun) {
        markFirstRunComplete();
    }

    // For non-rich modes, run commands directly without Ink
    if (!shouldUseInk(outputConfig)) {
        await runNonInkCommand(command, args, context);
        return;
    }

    // Rich mode - use Ink
    const { waitUntilExit } = render(
        React.createElement(App, { command, args, context })
    );

    await waitUntilExit();
}

/**
 * Run commands without Ink (for --json and --quiet modes).
 */
async function runNonInkCommand(
    command: string | undefined,
    args: string[],
    context: CommandContext
): Promise<void> {
    // Help
    if (!command || command === 'help' || command === '--help' || command === '-h') {
        if (context.mode === 'json') {
            const help = {
                version: context.version,
                commands: ['init', 'validate', 'generate', 'install', 'model'],
            };
            console.log(JSON.stringify(help, null, 2));
        } else {
            console.log(`dlang v${context.version}`);
            console.log('Commands: init, validate, generate, install, model');
        }
        process.exit(0);
    }

    // Version
    if (command === '--version' || command === '-v') {
        if (context.mode === 'json') {
            console.log(JSON.stringify({ version: context.version }));
        } else {
            console.log(context.version);
        }
        process.exit(0);
    }

    // Validate
    if (command === 'validate') {
        const file = args[0];
        if (!file) {
            if (context.mode === 'json') {
                console.log(JSON.stringify({ success: false, error: 'Missing file argument' }));
            } else {
                console.error('Missing required argument: <file>');
            }
            process.exit(1);
        }
        await runValidate(file, context);
        return;
    }

    // Other commands - for now, show not implemented
    if (context.mode === 'json') {
        console.log(JSON.stringify({ 
            success: false, 
            error: `Command '${command}' not yet migrated to new CLI` 
        }));
    } else {
        console.error(`Command '${command}' not yet migrated to new CLI`);
    }
    process.exit(1);
}

// Run main
main().catch((error: unknown) => {
    console.error('Fatal error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
});
