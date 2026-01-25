/**
 * Keyboard hints component for interactive prompts.
 * Shows available keyboard shortcuts at the bottom of prompts.
 * 
 * @module ui/components/KeyboardHints
 */
import React from 'react';
import { Text, Box } from 'ink';
import { colors } from '../themes/colors.js';

/**
 * Props for KeyboardHints component.
 */
export interface KeyboardHintsProps {
    /** Array of hint strings to display */
    hints: readonly string[];
    /** Separator between hints (default: ' · ') */
    separator?: string;
}

/**
 * KeyboardHints component.
 * Displays keyboard shortcuts in a consistent format.
 * 
 * @example
 * ```tsx
 * <KeyboardHints hints={['↑↓ navigate', 'Enter select', 'Esc cancel']} />
 * ```
 */
export const KeyboardHints: React.FC<KeyboardHintsProps> = ({
    hints,
    separator = ' · ',
}) => {
    return (
        <Box marginTop={1}>
            <Text color={colors.secondary}>
                ({hints.join(separator)})
            </Text>
        </Box>
    );
};

/**
 * Common keyboard hint presets for reuse.
 */
export const HINT_PRESETS = {
    /** For single-select lists */
    select: ['↑↓ navigate', 'Enter select', 'Esc cancel'],
    /** For multi-select lists */
    multiSelect: ['Space toggle', 'Enter confirm', 'Esc cancel'],
    /** For text input */
    textInput: ['Enter submit', 'Esc cancel'],
    /** For confirmation dialogs */
    confirm: ['y yes', 'n no'],
} as const;

/**
 * Pre-configured hint components for common scenarios.
 */
export const SelectHints: React.FC = () => (
    <KeyboardHints hints={HINT_PRESETS.select} />
);

export const MultiSelectHints: React.FC = () => (
    <KeyboardHints hints={HINT_PRESETS.multiSelect} />
);

export const TextInputHints: React.FC = () => (
    <KeyboardHints hints={HINT_PRESETS.textInput} />
);

export const ConfirmHints: React.FC = () => (
    <KeyboardHints hints={HINT_PRESETS.confirm} />
);
