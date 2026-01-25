/**
 * StatusMessage component for consistent feedback display.
 * Displays emoji + colored text for success/error/warning/info messages.
 * 
 * @module ui/components/StatusMessage
 */
import React from 'react';
import { Text, Box } from 'ink';
import { colors, type SemanticColor } from '../themes/colors.js';
import { EMOJI, type EmojiKey } from '../themes/emoji.js';

/**
 * Props for StatusMessage component.
 */
export interface StatusMessageProps {
    /** The type of status message */
    type: SemanticColor;
    /** The message text to display */
    message: string;
    /** Optional additional details (displayed below message) */
    details?: string;
    /** Whether to show emoji (default: true) */
    showEmoji?: boolean;
}

/**
 * Map status types to emoji keys.
 */
const statusEmoji: Record<SemanticColor, EmojiKey> = {
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'info',
};

/**
 * StatusMessage component.
 * Displays a status message with emoji and semantic coloring.
 * 
 * @example
 * ```tsx
 * <StatusMessage type="success" message="Model validated successfully" />
 * <StatusMessage type="error" message="Validation failed" details="3 errors found" />
 * ```
 */
export const StatusMessage: React.FC<StatusMessageProps> = ({
    type,
    message,
    details,
    showEmoji = true,
}) => {
    const color = colors[type];
    const emoji = showEmoji ? EMOJI[statusEmoji[type]] : '';

    return (
        <Box flexDirection="column">
            <Text>
                {emoji && <Text>{emoji}</Text>}
                <Text color={color}>{message}</Text>
            </Text>
            {details && (
                <Text color={colors.secondary}>   {details}</Text>
            )}
        </Box>
    );
};

/**
 * Convenience components for common status types.
 */
export const SuccessMessage: React.FC<Omit<StatusMessageProps, 'type'>> = (props) => (
    <StatusMessage type="success" {...props} />
);

export const ErrorMessage: React.FC<Omit<StatusMessageProps, 'type'>> = (props) => (
    <StatusMessage type="error" {...props} />
);

export const WarningMessage: React.FC<Omit<StatusMessageProps, 'type'>> = (props) => (
    <StatusMessage type="warning" {...props} />
);

export const InfoMessage: React.FC<Omit<StatusMessageProps, 'type'>> = (props) => (
    <StatusMessage type="info" {...props} />
);
