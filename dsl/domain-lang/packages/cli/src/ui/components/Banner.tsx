/**
 * Banner component for displaying messages with borders.
 * Inspired by Gemini CLI's Banner component.
 * 
 * @module ui/components/Banner
 */
import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../themes/colors.js';
import { ThemedGradient } from './ThemedGradient.js';

/**
 * Get formatted banner content with proper styling.
 * First line gets gradient treatment (if not warning), rest get secondary color.
 */
function getFormattedBannerContent(
    rawText: string,
    isWarning: boolean,
): React.ReactNode {
    if (isWarning) {
        return (
            <Text color={theme.status.warning}>
                {rawText.replace(/\\n/g, '\n')}
            </Text>
        );
    }

    const text = rawText.replace(/\\n/g, '\n');
    const lines = text.split('\n');

    return lines.map((line, index) => {
        if (index === 0) {
            return (
                <ThemedGradient key={index}>
                    {line}
                </ThemedGradient>
            );
        }

        return (
            <Text key={index} color={theme.text.secondary}>
                {line}
            </Text>
        );
    });
}

/**
 * Props for the Banner component.
 */
export interface BannerProps {
    /** The text content to display in the banner */
    bannerText: string;
    /** Whether this is a warning banner (yellow styling) */
    isWarning?: boolean;
    /** Optional width for the banner box */
    width?: number;
    /** Banner variant for different styles */
    variant?: 'info' | 'success' | 'warning' | 'error';
}

/**
 * Banner component for displaying messages with rounded borders.
 * 
 * @example
 * ```tsx
 * <Banner bannerText="Model validated successfully!" variant="success" />
 * <Banner bannerText="Warning: deprecated syntax" isWarning />
 * ```
 */
export const Banner: React.FC<BannerProps> = ({ 
    bannerText, 
    isWarning = false,
    width,
    variant,
}) => {
    // Determine border color based on variant or isWarning
    let borderColor = theme.border.default;
    if (isWarning || variant === 'warning') {
        borderColor = theme.status.warning;
    } else if (variant === 'error') {
        borderColor = theme.status.error;
    } else if (variant === 'success') {
        borderColor = theme.status.success;
    }

    const formattedContent = getFormattedBannerContent(
        bannerText,
        isWarning || variant === 'warning',
    );

    return (
        <Box
            flexDirection="column"
            borderStyle="round"
            borderColor={borderColor}
            width={width}
            paddingLeft={1}
            paddingRight={1}
        >
            {formattedContent}
        </Box>
    );
};

/**
 * Simple info box with no special styling.
 */
export const InfoBox: React.FC<{ children: React.ReactNode; width?: number }> = ({ 
    children, 
    width,
}) => (
    <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={theme.border.default}
        width={width}
        paddingLeft={1}
        paddingRight={1}
    >
        {children}
    </Box>
);

/**
 * Success banner shorthand.
 */
export const SuccessBanner: React.FC<{ message: string; width?: number }> = ({ 
    message, 
    width,
}) => (
    <Banner bannerText={message} variant="success" width={width} />
);

/**
 * Error banner shorthand.
 */
export const ErrorBanner: React.FC<{ message: string; width?: number }> = ({ 
    message, 
    width,
}) => (
    <Banner bannerText={message} variant="error" width={width} />
);

/**
 * Warning banner shorthand.
 */
export const WarningBanner: React.FC<{ message: string; width?: number }> = ({ 
    message, 
    width,
}) => (
    <Banner bannerText={message} isWarning width={width} />
);
