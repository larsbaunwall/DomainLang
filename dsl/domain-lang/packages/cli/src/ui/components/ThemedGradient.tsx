/**
 * ThemedGradient component for gradient text rendering.
 * Uses DomainLang brand colors: cyan → magenta → yellow.
 * 
 * @module ui/components/ThemedGradient
 */
import React from 'react';
import Gradient from 'ink-gradient';
import { Text } from 'ink';
import { colors } from '../themes/colors.js';

/**
 * Props for ThemedGradient component.
 */
export interface ThemedGradientProps {
    /** Text content to apply gradient to */
    children: string;
    /** Custom gradient colors (default: brand gradient) */
    gradient?: readonly string[];
    /** Whether to render as bold text */
    bold?: boolean;
}

/**
 * ThemedGradient component.
 * Renders text with DomainLang's brand gradient (cyan → magenta → yellow).
 * 
 * @example
 * ```tsx
 * <ThemedGradient>DomainLang</ThemedGradient>
 * <ThemedGradient bold>DOMAIN</ThemedGradient>
 * ```
 */
export const ThemedGradient: React.FC<ThemedGradientProps> = ({
    children,
    gradient = colors.gradient,
    bold = false,
}) => {
    // ink-gradient expects a mutable array
    const gradientColors = [...gradient] as string[];

    if (bold) {
        return (
            <Text bold>
                <Gradient colors={gradientColors}>{children}</Gradient>
            </Text>
        );
    }

    return <Gradient colors={gradientColors}>{children}</Gradient>;
};

/**
 * Convenience components with preset gradients.
 */

/**
 * Brand gradient: cyan → magenta → yellow
 */
export const BrandGradient: React.FC<{ children: string; bold?: boolean }> = ({
    children,
    bold = false,
}) => <ThemedGradient gradient={colors.gradient} bold={bold}>{children}</ThemedGradient>;

/**
 * Success gradient: shades of green
 */
export const SuccessGradient: React.FC<{ children: string }> = ({ children }) => (
    <ThemedGradient gradient={['#22C55E', '#16A34A', '#15803D']}>{children}</ThemedGradient>
);

/**
 * Error gradient: shades of red
 */
export const ErrorGradient: React.FC<{ children: string }> = ({ children }) => (
    <ThemedGradient gradient={['#EF4444', '#DC2626', '#B91C1C']}>{children}</ThemedGradient>
);
