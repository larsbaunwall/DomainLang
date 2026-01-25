/**
 * Semantic color palette for the DomainLang CLI.
 * Brand colors are derived from the DomainLang icon (three stacked 3D cubes).
 * 
 * This module provides both static color values (for backward compatibility)
 * and dynamic theme-aware colors via the `theme` export.
 * 
 * @module ui/themes/colors
 */
import { themeManager } from './theme-manager.js';
import type { SemanticColors } from './semantic-tokens.js';

/**
 * Dynamic semantic colors that respond to theme changes.
 * Uses getters to always return the active theme's colors.
 * 
 * @example
 * ```ts
 * import { theme } from './themes/colors.js';
 * <Text color={theme.status.success}>Success!</Text>
 * ```
 */
export const theme: SemanticColors = {
    get text() {
        return themeManager.getSemanticColors().text;
    },
    get background() {
        return themeManager.getSemanticColors().background;
    },
    get border() {
        return themeManager.getSemanticColors().border;
    },
    get ui() {
        return themeManager.getSemanticColors().ui;
    },
    get status() {
        return themeManager.getSemanticColors().status;
    },
};

/**
 * Static color palette for CLI theming (legacy compatibility).
 * Prefer using `theme` for theme-aware colors.
 */
export const colors = {
    /**
     * Brand colors from the DomainLang logo SVG.
     * Icon: I> (stylized D) with blue gradient
     */
    brand: {
        /** Icon light cyan from SVG */
        cyan: '#00e5fc',
        /** Icon dark blue from SVG */
        blue: '#027fff',
        /** Middle cube color - magenta */
        magenta: '#EC4899',
        /** Bottom cube color - yellow */
        yellow: '#FFC107',
    },

    /**
     * Brand gradient array for ThemedGradient component.
     * Flows from cyan → blue (icon gradient from SVG).
     */
    gradient: ['#00e5fc', '#027fff'] as const,

    /**
     * Semantic status colors (vibrant).
     */
    success: '#22C55E',  // Bright green
    error: '#EF4444',    // Bright red
    warning: '#F59E0B',  // Bright amber
    info: '#00BCD4',     // Cyan (matches brand)

    /**
     * Text colors for different emphasis levels.
     */
    primary: '#F8FAFC',   // Near white - primary text
    secondary: '#94A3B8', // Slate gray - secondary text
    muted: '#64748B',     // Darker slate - muted text

    /**
     * Accent colors for highlights and interactive elements.
     */
    accent: '#EC4899',    // Magenta (matches brand)
    link: '#00BCD4',      // Cyan (matches brand)
    highlight: '#FFC107', // Yellow (matches brand)

    /**
     * Border colors for dialogs and boxes.
     */
    border: {
        /** Default border color */
        default: '#64748B',
        /** Focused/active border color */
        focused: '#00BCD4',
    },
} as const;

/**
 * Chalk-compatible color names for terminal output.
 * These map to chalk color methods for simpler usage.
 */
export const chalkColors = {
    success: 'green',
    error: 'red',
    warning: 'yellow',
    info: 'cyan',
    muted: 'gray',
    primary: 'white',
    accent: 'magenta',
} as const;

/**
 * Type-safe color accessor for semantic colors.
 */
export type SemanticColor = 'success' | 'error' | 'warning' | 'info';

// Re-export theme types
export type { SemanticColors } from './semantic-tokens.js';
export { themeManager } from './theme-manager.js';
