/**
 * Semantic color tokens for DomainLang CLI theming.
 * Follows Gemini CLI's semantic color architecture with categorized tokens.
 * 
 * @module ui/themes/semantic-tokens
 */

/**
 * Semantic color interface for consistent theming across components.
 * Colors are organized by their semantic meaning, not their visual appearance.
 */
export interface SemanticColors {
    /** Text colors for different emphasis levels */
    text: {
        /** Primary text - highest emphasis */
        primary: string;
        /** Secondary text - medium emphasis */
        secondary: string;
        /** Link text - clickable items */
        link: string;
        /** Accent text - highlights and emphasis */
        accent: string;
        /** Response/output text */
        response: string;
    };
    /** Background colors */
    background: {
        /** Primary background */
        primary: string;
        /** Diff highlighting */
        diff: {
            added: string;
            removed: string;
        };
    };
    /** Border colors for boxes and dialogs */
    border: {
        /** Default border color */
        default: string;
        /** Focused/active border color */
        focused: string;
    };
    /** UI element colors */
    ui: {
        /** Comment text color */
        comment: string;
        /** Symbol/icon color */
        symbol: string;
        /** Dark accent color */
        dark: string;
        /** Gradient colors for ThemedGradient */
        gradient: readonly string[] | undefined;
    };
    /** Status indicator colors */
    status: {
        /** Error state */
        error: string;
        /** Success state */
        success: string;
        /** Warning state */
        warning: string;
    };
}

/**
 * Base color palette interface used by theme definitions.
 */
export interface ThemeColors {
    /** Theme type identifier */
    type: 'dark' | 'light';
    /** Foreground (text) color */
    Foreground: string;
    /** Background color */
    Background: string;
    /** Light blue accent */
    LightBlue: string;
    /** Blue accent */
    AccentBlue: string;
    /** Purple accent */
    AccentPurple: string;
    /** Cyan accent */
    AccentCyan: string;
    /** Green accent */
    AccentGreen: string;
    /** Yellow accent */
    AccentYellow: string;
    /** Red accent */
    AccentRed: string;
    /** Diff added background */
    DiffAdded: string;
    /** Diff removed background */
    DiffRemoved: string;
    /** Comment color */
    Comment: string;
    /** Gray color */
    Gray: string;
    /** Dark gray color */
    DarkGray: string;
    /** Gradient colors */
    GradientColors: readonly string[];
}

/**
 * DomainLang dark theme colors.
 * Based on brand colors (cyan, magenta, yellow from the cube logo).
 */
export const darkTheme: ThemeColors = {
    type: 'dark',
    Foreground: '#F8FAFC',      // Near white
    Background: '#0F172A',       // Slate 900
    LightBlue: '#7DD3FC',        // Sky 300
    AccentBlue: '#00BCD4',       // Cyan (brand)
    AccentPurple: '#EC4899',     // Magenta (brand)
    AccentCyan: '#00BCD4',       // Cyan (brand)
    AccentGreen: '#22C55E',      // Green 500
    AccentYellow: '#FFC107',     // Yellow (brand)
    AccentRed: '#EF4444',        // Red 500
    DiffAdded: '#166534',        // Green 800
    DiffRemoved: '#991B1B',      // Red 800
    Comment: '#64748B',          // Slate 500
    Gray: '#94A3B8',             // Slate 400
    DarkGray: '#475569',         // Slate 600
    GradientColors: ['#00BCD4', '#EC4899', '#FFC107'] as const, // Cyan→Magenta→Yellow
};

/**
 * DomainLang light theme colors.
 */
export const lightTheme: ThemeColors = {
    type: 'light',
    Foreground: '#1E293B',       // Slate 800
    Background: '#FFFFFF',       // White
    LightBlue: '#0284C7',        // Sky 600
    AccentBlue: '#0891B2',       // Cyan 600
    AccentPurple: '#DB2777',     // Pink 600
    AccentCyan: '#0891B2',       // Cyan 600
    AccentGreen: '#16A34A',      // Green 600
    AccentYellow: '#CA8A04',     // Yellow 600
    AccentRed: '#DC2626',        // Red 600
    DiffAdded: '#BBF7D0',        // Green 200
    DiffRemoved: '#FECACA',      // Red 200
    Comment: '#64748B',          // Slate 500
    Gray: '#64748B',             // Slate 500
    DarkGray: '#334155',         // Slate 700
    GradientColors: ['#0891B2', '#DB2777', '#CA8A04'] as const, // Darker versions
};

/**
 * Create semantic colors from a base theme palette.
 */
export function createSemanticColors(colors: ThemeColors): SemanticColors {
    return {
        text: {
            primary: colors.Foreground,
            secondary: colors.Gray,
            link: colors.AccentBlue,
            accent: colors.AccentPurple,
            response: colors.Foreground,
        },
        background: {
            primary: colors.Background,
            diff: {
                added: colors.DiffAdded,
                removed: colors.DiffRemoved,
            },
        },
        border: {
            default: colors.Gray,
            focused: colors.AccentBlue,
        },
        ui: {
            comment: colors.Comment,
            symbol: colors.Gray,
            dark: colors.DarkGray,
            gradient: colors.GradientColors,
        },
        status: {
            error: colors.AccentRed,
            success: colors.AccentGreen,
            warning: colors.AccentYellow,
        },
    };
}

/** Dark semantic colors preset */
export const darkSemanticColors = createSemanticColors(darkTheme);

/** Light semantic colors preset */
export const lightSemanticColors = createSemanticColors(lightTheme);
