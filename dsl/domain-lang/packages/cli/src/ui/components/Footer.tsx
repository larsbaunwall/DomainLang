/**
 * Footer component for CLI status display.
 * Shows version, working directory, and command hints.
 * Inspired by Gemini CLI's Footer component.
 * 
 * @module ui/components/Footer
 */
import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../themes/colors.js';
import { ThemedGradient } from './ThemedGradient.js';

/**
 * Props for the Footer component.
 */
export interface FooterProps {
    /** CLI version string */
    version: string;
    /** Optional working directory to display */
    workingDir?: string;
    /** Width of the footer */
    width?: number;
    /** Optional command to show in footer */
    command?: string;
}

/**
 * Shorten a path for display, using ~ for home directory.
 */
function shortenPath(fullPath: string, maxLength = 40): string {
    // Replace home directory with ~
    const home = process.env['HOME'] ?? '';
    let path = fullPath;
    if (home && path.startsWith(home)) {
        path = '~' + path.slice(home.length);
    }
    
    // Truncate if still too long
    if (path.length > maxLength) {
        const parts = path.split('/');
        if (parts.length > 3) {
            return parts[0] + '/.../' + parts.slice(-2).join('/');
        }
    }
    
    return path;
}

/**
 * Footer component showing CLI status information.
 * 
 * @example
 * ```tsx
 * <Footer version="1.0.0" workingDir="/path/to/project" />
 * ```
 */
export const Footer: React.FC<FooterProps> = ({ 
    version, 
    workingDir,
    width,
    command,
}) => {
    const displayPath = workingDir ? shortenPath(workingDir) : undefined;

    return (
        <Box
            justifyContent="space-between"
            width={width}
            flexDirection="row"
            alignItems="center"
            paddingX={1}
        >
            {/* Left section: Working directory */}
            <Box>
                {displayPath && (
                    <Text color={theme.text.link}>
                        {displayPath}
                    </Text>
                )}
                {command && (
                    <Text color={theme.text.secondary}>
                        {displayPath ? ' ' : ''}[{command}]
                    </Text>
                )}
            </Box>

            {/* Right section: Version */}
            <Box alignItems="center">
                <ThemedGradient>dlang</ThemedGradient>
                <Text color={theme.text.secondary}> v{version}</Text>
            </Box>
        </Box>
    );
};

/**
 * Minimal footer with just version.
 */
export const MinimalFooter: React.FC<{ version: string }> = ({ version }) => (
    <Box justifyContent="flex-end" paddingX={1}>
        <Text color={theme.text.secondary}>dlang v{version}</Text>
    </Box>
);
