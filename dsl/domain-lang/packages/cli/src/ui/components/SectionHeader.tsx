/**
 * Section header component with emoji icon and title.
 * Uses fixed-width first column for consistent alignment.
 * 
 * @module ui/components/SectionHeader
 */
import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../themes/colors.js';

/**
 * Props for SectionHeader component.
 */
export interface SectionHeaderProps {
    /** Emoji icon to display */
    icon: string;
    /** Section title text */
    title: string;
    /** Optional color for the icon (defaults to secondary) */
    iconColor?: string;
    /** Optional color for the title (defaults to primary) */
    titleColor?: string;
}

/**
 * Fixed width for the emoji column (in terminal columns).
 * Set to 4 to accommodate any emoji width (1-2) + padding.
 */
export const ICON_COLUMN_WIDTH = 4;

/**
 * Section header with emoji icon and bold title.
 * Uses a fixed-width first column for the emoji so all titles align.
 * 
 * @example
 * ```tsx
 * <SectionHeader icon={EMOJI.book} title="USAGE" />
 * <SectionHeader icon={EMOJI.gear} title="OPTIONS" iconColor={colors.accent} />
 * ```
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
    icon,
    title,
    iconColor = colors.secondary,
    titleColor = colors.primary,
}) => {
    const iconText = icon.trimEnd();

    return (
        <Box marginBottom={1}>
            <Box width={ICON_COLUMN_WIDTH}>
                <Text color={iconColor}>{iconText}</Text>
            </Box>
            <Text bold color={titleColor}>{title}</Text>
        </Box>
    );
};

export default SectionHeader;
