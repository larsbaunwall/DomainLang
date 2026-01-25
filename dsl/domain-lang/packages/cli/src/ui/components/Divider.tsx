/**
 * Divider component for visual separation.
 * 
 * @module ui/components/Divider
 */
import React from 'react';
import { Text, Box } from 'ink';
import { colors } from '../themes/colors.js';

/**
 * Props for Divider component.
 */
export interface DividerProps {
    /** Width of the divider (default: 60) */
    width?: number;
    /** Character to use for the divider (default: ─) */
    character?: string;
    /** Optional title to display in the divider */
    title?: string;
}

/**
 * Divider component.
 * Creates a horizontal line for visual separation.
 * 
 * @example
 * ```tsx
 * <Divider />
 * <Divider width={40} title="Results" />
 * ```
 */
export const Divider: React.FC<DividerProps> = ({
    width = 60,
    character = '─',
    title,
}) => {
    if (title) {
        const titleWithPadding = ` ${title} `;
        const sideWidth = Math.floor((width - titleWithPadding.length) / 2);
        const leftSide = character.repeat(Math.max(0, sideWidth));
        const rightSide = character.repeat(Math.max(0, width - sideWidth - titleWithPadding.length));

        return (
            <Box>
                <Text color={colors.muted}>{leftSide}</Text>
                <Text color={colors.secondary}>{titleWithPadding}</Text>
                <Text color={colors.muted}>{rightSide}</Text>
            </Box>
        );
    }

    return (
        <Box>
            <Text color={colors.muted}>{character.repeat(width)}</Text>
        </Box>
    );
};

/**
 * Spacer component for vertical spacing.
 */
export interface SpacerProps {
    /** Number of empty lines (default: 1) */
    lines?: number;
}

/**
 * Spacer component.
 * Adds vertical space between elements.
 * 
 * @example
 * ```tsx
 * <Spacer />
 * <Spacer lines={2} />
 * ```
 */
export const Spacer: React.FC<SpacerProps> = ({ lines = 1 }) => {
    return (
        <Box flexDirection="column">
            {Array.from({ length: lines }).map((_, i) => (
                <Text key={i}> </Text>
            ))}
        </Box>
    );
};
