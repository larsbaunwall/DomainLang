/**
 * Design tokens for the DomainLang CLI.
 * Single source of truth for spacing, borders, and indent values.
 * 
 * @module ui/tokens
 */

/**
 * Design tokens for consistent CLI styling.
 * All values use terminal character units.
 */
export const tokens = {
    /**
     * Spacing values for padding and margins.
     * Values are in terminal character units.
     */
    spacing: {
        /** Extra small spacing (1 character) */
        xs: 1,
        /** Small spacing (2 characters) */
        sm: 2,
        /** Medium spacing (4 characters) */
        md: 4,
        /** Large spacing (8 characters) */
        lg: 8,
    },

    /**
     * Border styles for boxed components.
     * Uses rounded corners (╭╮╰╯) for modern feel.
     */
    borders: {
        /** Border style - round for modern look */
        style: 'round' as const,
        /** Default border color */
        color: 'gray',
    },

    /**
     * Indentation values for hierarchical content.
     */
    indent: {
        /** Indentation for list/tree items */
        item: 3,
        /** Indentation for nested content */
        nested: 2,
    },

    /**
     * Terminal width breakpoints for responsive design.
     */
    breakpoints: {
        /** Wide terminal (full ASCII art) */
        wide: 100,
        /** Medium terminal (simplified art) */
        medium: 60,
        /** Narrow terminal (minimal) */
        narrow: 40,
    },
} as const;

/**
 * Type-safe accessor for spacing tokens.
 */
export type SpacingKey = keyof typeof tokens.spacing;

/**
 * Type-safe accessor for indent tokens.
 */
export type IndentKey = keyof typeof tokens.indent;
