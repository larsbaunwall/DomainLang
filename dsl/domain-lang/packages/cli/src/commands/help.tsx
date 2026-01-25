/**
 * Help command component.
 * Displays styled help output with command list and options.
 * 
 * @module commands/help
 */
import React from 'react';
import { Box, Text } from 'ink';
import { Header, SectionHeader } from '../ui/components/index.js';
import { colors } from '../ui/themes/colors.js';
import { EMOJI } from '../ui/themes/emoji.js';
import type { CommandContext } from './types.js';

/**
 * Props for Help command component.
 */
export interface HelpProps {
    /** Command context */
    context: CommandContext;
}

/**
 * Command definitions for help display.
 */
const COMMANDS = [
    { name: 'init', description: 'Initialize a new DomainLang project' },
    { name: 'validate <path>', description: 'Validate model files' },
    { name: 'generate <file>', description: 'Generate code from model' },
    { name: 'install', description: 'Install dependencies from model.yaml' },
] as const;

/**
 * Model subcommands for help display.
 */
const MODEL_COMMANDS = [
    { name: 'model list', description: 'List declared dependencies' },
    { name: 'model add <pkg>', description: 'Add a new dependency' },
    { name: 'model remove <pkg>', description: 'Remove a dependency' },
    { name: 'model tree', description: 'Show dependency tree' },
] as const;

/**
 * Global options for help display.
 */
const OPTIONS = [
    { flags: '--help, -h', description: 'Show help' },
    { flags: '--version, -v', description: 'Show version' },
    { flags: '--quiet, -q', description: 'Suppress decorative output (CI mode)' },
    { flags: '--json', description: 'Output in JSON format' },
    { flags: '--no-color', description: 'Disable colors' },
] as const;

/**
 * Help command component.
 * Displays a styled help screen with banner and command list.
 */
export const Help: React.FC<HelpProps> = ({ context }) => {
    // JSON output mode
    if (context.mode === 'json') {
        const data = {
            version: context.version,
            commands: [...COMMANDS, ...MODEL_COMMANDS].map(c => ({ name: c.name, description: c.description })),
            options: OPTIONS.map(o => ({ flags: o.flags, description: o.description })),
        };
        process.stdout.write(JSON.stringify(data, null, 2) + '\n');
        return null;
    }

    // Quiet mode - minimal help
    if (context.mode === 'quiet') {
        process.stdout.write(`dlang v${context.version}\n`);
        process.stdout.write('Commands: init, validate, generate, install, model\n');
        process.stdout.write('Use --help for more information\n');
        return null;
    }

    // Rich output mode
    const maxCommandWidth = Math.max(
        ...COMMANDS.map(c => c.name.length),
        ...MODEL_COMMANDS.map(c => c.name.length)
    );

    return (
        <Box flexDirection="column">
            {/* Header with banner */}
            <Header version={context.version} context="help" />

            {/* Usage */}
            <SectionHeader icon={EMOJI.book} title="USAGE" />
            <Box marginLeft={3} marginBottom={1}>
                <Text color={colors.secondary}>$ dlang {'<command>'} [options]</Text>
            </Box>

            {/* Main commands */}
            <SectionHeader icon={EMOJI.tools} title="COMMANDS" />
            <Box flexDirection="column" marginLeft={3} marginBottom={1}>
                {COMMANDS.map(cmd => (
                    <Box key={cmd.name}>
                        <Box width={maxCommandWidth + 4}>
                            <Text color={colors.accent}>{cmd.name}</Text>
                        </Box>
                        <Text color={colors.secondary}>{cmd.description}</Text>
                    </Box>
                ))}
            </Box>

            {/* Model commands */}
            <SectionHeader icon={EMOJI.package} title="MODEL COMMANDS" />
            <Box flexDirection="column" marginLeft={3} marginBottom={1}>
                {MODEL_COMMANDS.map(cmd => (
                    <Box key={cmd.name}>
                        <Box width={maxCommandWidth + 4}>
                            <Text color={colors.accent}>{cmd.name}</Text>
                        </Box>
                        <Text color={colors.secondary}>{cmd.description}</Text>
                    </Box>
                ))}
            </Box>

            {/* Options */}
            <SectionHeader icon={EMOJI.gear} title="OPTIONS" />
            <Box flexDirection="column" marginLeft={3} marginBottom={1}>
                {OPTIONS.map(opt => (
                    <Box key={opt.flags}>
                        <Box width={20}>
                            <Text color={colors.muted}>{opt.flags}</Text>
                        </Box>
                        <Text color={colors.secondary}>{opt.description}</Text>
                    </Box>
                ))}
            </Box>

            {/* Links */}
            <SectionHeader icon={EMOJI.link} title="DOCUMENTATION" />
            <Box marginLeft={3} marginBottom={1}>
                <Text color={colors.link}>https://domainlang.net/docs</Text>
            </Box>

            {/* Examples */}
            <SectionHeader icon={EMOJI.tip} title="EXAMPLES" />
            <Box flexDirection="column" marginLeft={3}>
                <Text color={colors.muted}>$ dlang init</Text>
                <Text color={colors.muted}>$ dlang validate ./domains</Text>
                <Text color={colors.muted}>$ dlang model add domainlang/core</Text>
            </Box>
        </Box>
    );
};
