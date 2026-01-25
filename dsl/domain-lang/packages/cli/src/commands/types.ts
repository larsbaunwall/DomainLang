/**
 * Command types and context for CLI commands.
 * 
 * @module commands/types
 */
import type { OutputConfig } from '../utils/output-mode.js';

/**
 * Command execution context.
 * Passed to all command components.
 */
export interface CommandContext extends OutputConfig {
    /** Version string from package.json */
    version: string;
    /** Whether this is the first run */
    isFirstRun: boolean;
}

/**
 * Base result type for command execution.
 */
export interface CommandResult<T = unknown> {
    /** Whether the command succeeded */
    success: boolean;
    /** Result data (if successful) */
    data?: T;
    /** Errors encountered */
    errors?: CommandError[];
    /** Warnings to display */
    warnings?: CommandWarning[];
}

/**
 * Command error structure.
 */
export interface CommandError {
    /** Error code for programmatic handling */
    code: string;
    /** Human-readable error message */
    message: string;
    /** File path (if applicable) */
    file?: string;
    /** Line number (if applicable) */
    line?: number;
    /** Column number (if applicable) */
    column?: number;
}

/**
 * Command warning structure.
 */
export interface CommandWarning {
    /** Warning code for programmatic handling */
    code: string;
    /** Human-readable warning message */
    message: string;
    /** File path (if applicable) */
    file?: string;
    /** Line number (if applicable) */
    line?: number;
}

/**
 * Validation result data.
 */
export interface ValidationResult {
    /** Whether the model is valid (no errors) */
    valid: boolean;
    /** Number of files processed */
    fileCount: number;
    /** Number of domains found */
    domainCount: number;
    /** Number of bounded contexts found */
    bcCount: number;
    /** Validation errors */
    errors: CommandError[];
    /** Validation warnings */
    warnings: CommandWarning[];
}

/**
 * Help command data.
 */
export interface HelpResult {
    /** Available commands */
    commands: HelpCommand[];
    /** Global options */
    options: HelpOption[];
}

/**
 * Help command entry.
 */
export interface HelpCommand {
    /** Command name */
    name: string;
    /** Command description */
    description: string;
    /** Command arguments (optional) */
    args?: string;
}

/**
 * Help option entry.
 */
export interface HelpOption {
    /** Option flags (e.g., '--json, -j') */
    flags: string;
    /** Option description */
    description: string;
}
