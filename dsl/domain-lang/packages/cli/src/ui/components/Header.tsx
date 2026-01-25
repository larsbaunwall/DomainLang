/**
 * Header component with responsive ASCII art banner.
 * Shows branded header with version and tagline.
 * 
 * @module ui/components/Header
 */
import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { tokens } from '../tokens.js';
import { colors, theme } from '../themes/colors.js';
import { getAsciiArt, type BannerContext, colorizeDiagonalGradient } from './AsciiArt.js';

/**
 * Props for Header component.
 */
export interface HeaderProps {
    /** Version string to display */
    version: string;
    /** Banner context (affects rendering) */
    context?: BannerContext;
    /** Whether to show animated banner (first run) */
    animated?: boolean;
}

/**
 * Header component.
 * Displays responsive ASCII art banner with DomainLang branding.
 * 
 * @example
 * ```tsx
 * <Header version="2.0.0" />
 * <Header version="2.0.0" context="first-run" animated />
 * ```
 */
export const Header: React.FC<HeaderProps> = ({
    version,
    context = 'help',
    // animated is for future first-run animation support
    animated: _animated = false,
}) => {
    const { stdout } = useStdout();
    const width = stdout?.columns || 80;
    
    // Don't render if context is 'none'
    if (context === 'none') {
        return null;
    }

    // Get appropriate ASCII art for terminal width
    const asciiArt = getAsciiArt(width);
    
    // Determine if we should show minimal or full banner
    const isNarrow = width < 60;
    const isMedium = width >= 60 && width < 100;

    if (isNarrow) {
        // Minimal banner: I| DomainLang (icon in blue gradient)
        return (
            <Box flexDirection="column" marginBottom={1}>
                <Text>
                    <Text bold color={colors.brand.cyan}>I{`>`}</Text>
                    <Text> </Text>
                    <Text bold color={theme.text.primary}>DomainLang</Text>
                    <Text color={theme.text.secondary}> v{version}</Text>
                </Text>
            </Box>
        );
    }

    if (isMedium) {
        // Medium banner with I| icon (blue gradient) and DomainLang text
        return (
            <Box
                flexDirection="column"
                borderStyle={tokens.borders.style}
                borderColor={colors.border.default}
                paddingX={2}
                paddingY={1}
                marginBottom={1}
            >
                <Box flexDirection="column">
                    <Box>
                        <Text bold color={colors.brand.blue}>╔══╗</Text>
                        <Text>  </Text>
                    </Box>
                    <Box>
                        <Text bold color={colors.brand.cyan}>║{`I>`}║</Text>
                        <Text>  </Text>
                        <Text bold color={theme.text.primary}>DomainLang</Text>
                    </Box>
                    <Box>
                        <Text bold color={colors.brand.blue}>╚══╝</Text>
                    </Box>
                </Box>
                <Box marginTop={1}>
                    <Text color={theme.text.secondary}>v{version}</Text>
                </Box>
            </Box>
        );
    }

    // Wide banner with I| icon and DomainLang text
    return (
        <Box
            flexDirection="column"
            borderStyle={tokens.borders.style}
            borderColor={colors.border.default}
            paddingX={2}
            paddingY={1}
            marginBottom={1}
        >
            {/* Split ASCII: gradient on icon part, solid on text part */}
            <Box flexDirection="column">
                {(() => {
                    const lines = asciiArt.split('\n');
                    return lines.map((line, index) => {
                        // Split line at approximately where I| icon ends (around char 12)
                        const iconPart = line.substring(0, 12);
                        const textPart = line.substring(12);
                        
                        // Apply gradient only to icon part
                        const colorizedIcon = colorizeDiagonalGradient(
                            [iconPart],
                            colors.brand.cyan,
                            colors.brand.blue
                        )[0];
                        
                        return (
                            <Box key={index}>
                                {colorizedIcon.map((item, charIndex) => (
                                    <Text key={charIndex} bold color={item.color}>
                                        {item.char}
                                    </Text>
                                ))}
                                <Text bold color={theme.text.primary}>
                                    {textPart}
                                </Text>
                            </Box>
                        );
                    });
                })()}
            </Box>
            
            {/* Footer with tagline and version */}
            <Box marginTop={1} justifyContent="space-between" width={70}>
                <Text color={theme.text.secondary}>DDD Modeling DSL</Text>
                <Text color={theme.text.secondary}>v{version}</Text>
            </Box>
        </Box>
    );
};

/**
 * Compact header for use in command output.
 * Shows just the I> icon and version.
 */
export const CompactHeader: React.FC<{ version: string }> = ({ version }) => (
    <Box marginBottom={1}>
        <Text bold color={colors.brand.cyan}>I{`|`}</Text>
        <Text> </Text>
        <Text bold color={theme.text.primary}>DomainLang</Text>
        <Text color={theme.text.secondary}> v{version}</Text>
    </Box>
);
