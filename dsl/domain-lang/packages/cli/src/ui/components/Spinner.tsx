/**
 * Spinner component for loading states.
 * Wraps ink-spinner with consistent styling.
 * 
 * @module ui/components/Spinner
 */
import React from 'react';
import { Text, Box } from 'ink';
import InkSpinner from 'ink-spinner';
import { colors } from '../themes/colors.js';
import { EMOJI, type EmojiKey } from '../themes/emoji.js';

/**
 * Props for Spinner component.
 */
export interface SpinnerProps {
    /** Label text to display next to spinner */
    label: string;
    /** Optional emoji to show (default: loading) */
    emoji?: EmojiKey;
    /** Spinner color (default: info/cyan) */
    color?: string;
}

/**
 * Spinner component.
 * Displays an animated spinner with optional emoji and label.
 * 
 * ALL spinners in the CLI MUST use this component.
 * Never use ink-spinner directly.
 * 
 * @example
 * ```tsx
 * <Spinner label="Validating model..." />
 * <Spinner label="Installing dependencies..." emoji="package" />
 * ```
 */
export const Spinner: React.FC<SpinnerProps> = ({
    label,
    emoji = 'loading',
    color = colors.info,
}) => {
    return (
        <Box>
            <Text color={color}>
                <InkSpinner type="dots" />
            </Text>
            <Text> {EMOJI[emoji]}{label}</Text>
        </Box>
    );
};

/**
 * Props for LoadingWithTimer component.
 */
export interface LoadingWithTimerProps {
    /** Label text to display */
    label: string;
    /** Elapsed time in seconds */
    elapsedSeconds: number;
    /** Optional emoji to show (default: loading) */
    emoji?: EmojiKey;
}

/**
 * LoadingWithTimer component.
 * Displays a spinner with elapsed time (like Gemini CLI).
 * 
 * @example
 * ```tsx
 * <LoadingWithTimer label="Installing dependencies" elapsedSeconds={3.5} />
 * ```
 */
export const LoadingWithTimer: React.FC<LoadingWithTimerProps> = ({
    label,
    elapsedSeconds,
    emoji = 'loading',
}) => {
    return (
        <Box>
            <Text color={colors.info}>
                <InkSpinner type="dots" />
            </Text>
            <Text> {EMOJI[emoji]} {label}... ({elapsedSeconds.toFixed(1)}s)</Text>
        </Box>
    );
};
