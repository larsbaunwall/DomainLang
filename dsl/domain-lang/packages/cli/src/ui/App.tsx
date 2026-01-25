/**
 * Main App component for the DomainLang CLI.
 * Routes commands to appropriate components.
 * 
 * @module ui/App
 */
import React from 'react';
import { Box, Text } from 'ink';
import { Validate, Help } from '../commands/index.js';
import type { CommandContext } from '../commands/types.js';
import { colors } from './themes/colors.js';
import { EMOJI } from './themes/emoji.js';

/**
 * Props for App component.
 */
export interface AppProps {
    /** Command to execute */
    command: string | undefined;
    /** Command arguments */
    args: string[];
    /** Command context */
    context: CommandContext;
}

/**
 * Main App component.
 * Routes commands to their respective components.
 */
export const App: React.FC<AppProps> = ({ command, args, context }) => {
    // No command or help command - show help
    if (!command || command === 'help' || command === '--help' || command === '-h') {
        return <Help context={context} />;
    }

    // Version flag
    if (command === '--version' || command === '-v') {
        return (
            <Box>
                <Text color={colors.primary}>dlang v{context.version}</Text>
            </Box>
        );
    }

    // Validate command
    if (command === 'validate') {
        const file = args[0];
        if (!file) {
            return (
                <Box flexDirection="column">
                    <Text color={colors.error}>
                        {EMOJI.error}Missing required argument: {'<file>'}
                    </Text>
                    <Text color={colors.secondary}>
                        Usage: dlang validate {'<file>'}
                    </Text>
                </Box>
            );
        }
        return <Validate file={file} context={context} />;
    }

    // Generate command (placeholder - uses legacy implementation for now)
    if (command === 'generate') {
        return (
            <Box>
                <Text color={colors.warning}>
                    {EMOJI.warning}Generate command not yet migrated to new UI. Use legacy CLI.
                </Text>
            </Box>
        );
    }

    // Model commands (placeholder - uses legacy implementation for now)
    if (command === 'model') {
        const subcommand = args[0];
        return (
            <Box>
                <Text color={colors.warning}>
                    {EMOJI.warning}Model commands not yet migrated to new UI. 
                    Use: dlang-legacy model {subcommand || 'list'}
                </Text>
            </Box>
        );
    }

    // Install command (placeholder)
    if (command === 'install') {
        return (
            <Box>
                <Text color={colors.warning}>
                    {EMOJI.warning}Install command not yet migrated to new UI. Use legacy CLI.
                </Text>
            </Box>
        );
    }

    // Init command (placeholder for Phase 4)
    if (command === 'init') {
        return (
            <Box>
                <Text color={colors.warning}>
                    {EMOJI.warning}Init wizard coming in Phase 4. For now, create model.yaml manually.
                </Text>
            </Box>
        );
    }

    // Unknown command
    return (
        <Box flexDirection="column">
            <Text color={colors.error}>
                {EMOJI.error}Unknown command: {command}
            </Text>
            <Text color={colors.secondary}>
                {EMOJI.tip}Run &apos;dlang help&apos; for available commands
            </Text>
        </Box>
    );
};
