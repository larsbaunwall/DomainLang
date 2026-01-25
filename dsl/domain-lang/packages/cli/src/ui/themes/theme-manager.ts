/**
 * Theme manager for DomainLang CLI.
 * Manages active theme and provides dynamic semantic color access.
 * Inspired by Gemini CLI's ThemeManager pattern.
 * 
 * @module ui/themes/theme-manager
 */
import { 
    type SemanticColors, 
    type ThemeColors,
    darkTheme, 
    lightTheme,
    createSemanticColors,
} from './semantic-tokens.js';

/**
 * Theme type identifier.
 */
export type ThemeType = 'dark' | 'light';

/**
 * Theme definition with colors and semantic mappings.
 */
export interface Theme {
    /** Theme display name */
    name: string;
    /** Theme type (dark or light) */
    type: ThemeType;
    /** Base color palette */
    colors: ThemeColors;
    /** Semantic color mappings */
    semanticColors: SemanticColors;
}

/**
 * Create a theme from a name and color palette.
 */
function createTheme(name: string, colors: ThemeColors): Theme {
    return {
        name,
        type: colors.type,
        colors,
        semanticColors: createSemanticColors(colors),
    };
}

/**
 * Built-in themes for DomainLang CLI.
 */
export const themes = {
    dark: createTheme('DomainLang Dark', darkTheme),
    light: createTheme('DomainLang Light', lightTheme),
} as const;

/**
 * Default theme.
 */
export const DEFAULT_THEME: Theme = themes.dark;

/**
 * Theme manager singleton.
 * Manages active theme and provides dynamic color access.
 */
class ThemeManager {
    private activeTheme: Theme = DEFAULT_THEME;

    /**
     * Set the active theme by name.
     * @param themeName - 'dark' or 'light'
     * @returns true if theme was set, false if theme not found
     */
    setActiveTheme(themeName: string | undefined): boolean {
        if (!themeName) {
            this.activeTheme = DEFAULT_THEME;
            return true;
        }

        const theme = this.findThemeByName(themeName);
        if (!theme) {
            return false;
        }
        
        this.activeTheme = theme;
        return true;
    }

    /**
     * Get the currently active theme.
     */
    getActiveTheme(): Theme {
        // Support NO_COLOR environment variable
        if (process.env['NO_COLOR']) {
            return this.createNoColorTheme();
        }
        return this.activeTheme;
    }

    /**
     * Get semantic colors for the active theme.
     */
    getSemanticColors(): SemanticColors {
        return this.getActiveTheme().semanticColors;
    }

    /**
     * Get available theme names.
     */
    getAvailableThemes(): Array<{ name: string; type: ThemeType }> {
        return Object.values(themes).map(theme => ({
            name: theme.name,
            type: theme.type,
        }));
    }

    /**
     * Find a theme by name (case-insensitive).
     */
    private findThemeByName(name: string): Theme | undefined {
        const lowerName = name.toLowerCase();
        
        // Check exact match in themes object
        if (lowerName in themes) {
            return themes[lowerName as keyof typeof themes];
        }

        // Check by display name
        return Object.values(themes).find(
            t => t.name.toLowerCase() === lowerName
        );
    }

    /**
     * Create a no-color theme for accessibility.
     */
    private createNoColorTheme(): Theme {
        const noColor: ThemeColors = {
            type: 'dark',
            Foreground: '',
            Background: '',
            LightBlue: '',
            AccentBlue: '',
            AccentPurple: '',
            AccentCyan: '',
            AccentGreen: '',
            AccentYellow: '',
            AccentRed: '',
            DiffAdded: '',
            DiffRemoved: '',
            Comment: '',
            Gray: '',
            DarkGray: '',
            GradientColors: [],
        };
        return createTheme('No Color', noColor);
    }
}

/** Singleton theme manager instance */
export const themeManager = new ThemeManager();
