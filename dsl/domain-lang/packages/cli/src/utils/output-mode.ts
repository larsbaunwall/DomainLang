/**
 * Output mode detection and configuration.
 * Supports --json, --quiet, and --no-color flags.
 * 
 * @module utils/output-mode
 */

/**
 * Output mode for CLI rendering.
 * - 'rich': Full colors, emoji, and Ink components (default)
 * - 'json': Structured JSON output for programmatic consumption
 * - 'quiet': Minimal output, errors only (CI-friendly)
 */
export type OutputMode = 'rich' | 'json' | 'quiet';

/**
 * CLI output configuration.
 */
export interface OutputConfig {
    /** The output mode */
    mode: OutputMode;
    /** Whether colors are disabled */
    noColor: boolean;
    /** Current working directory */
    cwd: string;
}

/**
 * Parse command line arguments to determine output configuration.
 * @param args - Command line arguments (process.argv.slice(2))
 * @returns Output configuration
 */
export function parseOutputConfig(args: string[]): OutputConfig {
    const hasFlag = (flag: string): boolean =>
        args.includes(flag) || args.includes(`--${flag}`);

    // Determine output mode
    let mode: OutputMode = 'rich';
    if (hasFlag('--json') || hasFlag('json')) {
        mode = 'json';
    } else if (hasFlag('--quiet') || hasFlag('-q') || hasFlag('quiet')) {
        mode = 'quiet';
    }

    // Check for no-color flag or environment
    const noColor =
        hasFlag('--no-color') ||
        hasFlag('no-color') ||
        process.env['NO_COLOR'] !== undefined ||
        process.env['TERM'] === 'dumb';

    return {
        mode,
        noColor,
        cwd: process.cwd(),
    };
}

/**
 * Check if the current output mode should use Ink rendering.
 * @param config - Output configuration
 * @returns True if Ink should be used
 */
export function shouldUseInk(config: OutputConfig): boolean {
    return config.mode === 'rich';
}

/**
 * Check if output should include colors.
 * @param config - Output configuration
 * @returns True if colors should be used
 */
export function shouldUseColors(config: OutputConfig): boolean {
    return config.mode === 'rich' && !config.noColor;
}

/**
 * Check if output should include emoji.
 * @param config - Output configuration
 * @returns True if emoji should be used
 */
export function shouldUseEmoji(config: OutputConfig): boolean {
    return config.mode === 'rich';
}

/**
 * Remove output mode flags from argument list.
 * Used to pass clean args to commands.
 * @param args - Original command line arguments
 * @returns Args with output flags removed
 */
export function stripOutputFlags(args: string[]): string[] {
    const outputFlags = [
        '--json',
        '--quiet',
        '-q',
        '--no-color',
    ];
    return args.filter(arg => !outputFlags.includes(arg));
}
