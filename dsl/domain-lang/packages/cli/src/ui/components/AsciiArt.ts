/**
 * ASCII art definitions for DomainLang CLI branding.
 * Logo: I| icon (stylized D from SVG) + DomainLang wordmark
 * Colors from SVG: #00e5fc (cyan) and #027fff (darker blue)
 * 
 * @module ui/components/AsciiArt
 */

/**
 * ASCII art for wide terminals (≥100 cols).
 * Full I| icon with DomainLang text.
 */
export const ASCII_WIDE = `
██╗██╗      ██████╗  ██████╗ ███╗   ███╗ █████╗ ██╗███╗   ██╗██╗      █████╗ ███╗   ██╗ ██████╗ 
██║╚██╗     ██╔══██╗██╔═══██╗████╗ ████║██╔══██╗██║████╗  ██║██║     ██╔══██╗████╗  ██║██╔════╝ 
██║ ╚██╗    ██║  ██║██║   ██║██╔████╔██║███████║██║██╔██╗ ██║██║     ███████║██╔██╗ ██║██║  ███╗
██║ ██╔╝    ██║  ██║██║   ██║██║╚██╔╝██║██╔══██║██║██║╚██╗██║██║     ██╔══██║██║╚██╗██║██║   ██║
██║██╔╝     ██████╔╝╚██████╔╝██║ ╚═╝ ██║██║  ██║██║██║ ╚████║███████╗██║  ██║██║ ╚████║╚██████╔╝
╚═╝╚═╝      ╚═════╝  ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ 
`.trim();

/**
 * ASCII art for medium terminals (60-99 cols).
 * Simplified I| icon box with DomainLang.
 */
export const ASCII_MEDIUM = `
  ╔═╗              
  ║|║  DomainLang  
  ╚═╝              
`.trim();

/**
 * ASCII art for narrow terminals (<60 cols).
 * Minimal icon with text.
 */
export const ASCII_NARROW = `I| DomainLang`;

/**
 * Cube characters for the stacked 3D cubes logo.
 * Each cube has top/front/side faces.
 */
export const CUBE_CHARS = {
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    horizontal: '─',
    vertical: '│',
    topLeftRound: '╭',
    topRightRound: '╮',
    bottomLeftRound: '╰',
    bottomRightRound: '╯',
    diagonal: '╱',
} as const;

/**
 * Get appropriate ASCII art based on terminal width.
 * @param width - Terminal width in columns
 * @returns ASCII art string
 */
export function getAsciiArt(width: number): string {
    if (width >= 100) {
        return ASCII_WIDE;
    }
    if (width >= 60) {
        return ASCII_MEDIUM;
    }
    return ASCII_NARROW;
}

/**
 * Get the appropriate banner type for a command.
 */
export type BannerContext = 'first-run' | 'help' | 'init' | 'none';

/**
 * Determine if a banner should be shown for the given command.
 * @param command - The CLI command being executed
 * @param isFirstRun - Whether this is the first time the CLI is run
 * @returns The type of banner to show
 */
export function getBannerContext(command: string | undefined, isFirstRun: boolean): BannerContext {
    // First run always shows animated banner
    if (isFirstRun) {
        return 'first-run';
    }

    // These commands show static banner
    if (!command || command === 'help' || command === '--help' || command === '-h') {
        return 'help';
    }
    if (command === 'init') {
        return 'init';
    }

    // Other commands don't show banner
    return 'none';
}

/**
 * Lines of ASCII art to apply gradient colors to.
 * Each line index corresponds to a cube color.
 */
export const GRADIENT_LINES = {
    /** Lines for top cube (cyan) - indexes for ASCII_WIDE */
    topCube: [1, 2, 3],
    /** Lines for middle cube (magenta) */
    middleCube: [4, 5, 6],
    /** Lines for bottom cube (yellow) */
    bottomCube: [7, 8, 9, 10],
} as const;

/**
 * Apply a color gradient across ASCII art lines.
 * Distributes colors evenly from start to end color across all characters.
 * 
 * @param text - The text to colorize
 * @param startColor - Starting color (hex)
 * @param endColor - Ending color (hex)
 * @returns Array of objects with character and color
 */
export interface ColorizedChar {
    char: string;
    color: string;
}

export function colorizeWithGradient(
    text: string,
    startColor: string,
    endColor: string
): ColorizedChar[] {
    const chars = text.split('');
    const result: ColorizedChar[] = [];

    // Simple linear interpolation between two hex colors
    const hexToRgb = (hex: string): [number, number, number] => {
        const h = hex.replace('#', '');
        return [
            parseInt(h.substring(0, 2), 16),
            parseInt(h.substring(2, 4), 16),
            parseInt(h.substring(4, 6), 16),
        ];
    };

    const rgbToHex = (r: number, g: number, b: number): string => {
        return (
            '#' +
            [r, g, b]
                .map(x => {
                    const hex = Math.round(x).toString(16);
                    return hex.length === 1 ? '0' + hex : hex;
                })
                .join('')
        );
    };

    const start = hexToRgb(startColor);
    const end = hexToRgb(endColor);

    for (let i = 0; i < chars.length; i++) {
        const progress = chars.length > 1 ? i / (chars.length - 1) : 0;
        const r = start[0] + (end[0] - start[0]) * progress;
        const g = start[1] + (end[1] - start[1]) * progress;
        const b = start[2] + (end[2] - start[2]) * progress;
        const color = rgbToHex(r, g, b);

        result.push({
            char: chars[i],
            color,
        });
    }

    return result;
}

/**
 * Apply a diagonal gradient from top-left to bottom-right.
 * Colors transition based on position in the grid.
 * 
 * @param lines - Array of text lines
 * @param startColor - Color at top-left
 * @param endColor - Color at bottom-right
 * @returns 2D array of colorized characters
 */
export function colorizeDiagonalGradient(
    lines: string[],
    startColor: string,
    endColor: string
): ColorizedChar[][] {
    const hexToRgb = (hex: string): [number, number, number] => {
        const h = hex.replace('#', '');
        return [
            parseInt(h.substring(0, 2), 16),
            parseInt(h.substring(2, 4), 16),
            parseInt(h.substring(4, 6), 16),
        ];
    };

    const rgbToHex = (r: number, g: number, b: number): string => {
        return (
            '#' +
            [r, g, b]
                .map(x => {
                    const hex = Math.round(x).toString(16);
                    return hex.length === 1 ? '0' + hex : hex;
                })
                .join('')
        );
    };

    const start = hexToRgb(startColor);
    const end = hexToRgb(endColor);

    // Calculate max line length and number of lines for gradient calculation
    const maxLineLength = Math.max(...lines.map(l => l.length));
    const numLines = lines.length;
    const maxDistance = Math.sqrt(maxLineLength ** 2 + numLines ** 2);

    return lines.map((line, lineIndex) => {
        return line.split('').map((char, charIndex) => {
            // Calculate distance from top-left (0,0)
            const distance = Math.sqrt(charIndex ** 2 + lineIndex ** 2);
            const progress = maxDistance > 0 ? distance / maxDistance : 0;

            const r = start[0] + (end[0] - start[0]) * progress;
            const g = start[1] + (end[1] - start[1]) * progress;
            const b = start[2] + (end[2] - start[2]) * progress;
            const color = rgbToHex(r, g, b);

            return { char, color };
        });
    });
}
