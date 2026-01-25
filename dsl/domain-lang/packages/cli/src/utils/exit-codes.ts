/**
 * Standardized exit codes for CI/CD integration.
 * 
 * @module utils/exit-codes
 */

/**
 * Exit code constants for the CLI.
 * These follow Unix conventions and provide clear semantics for CI/CD.
 */
export const EXIT = {
    /** Command completed successfully */
    SUCCESS: 0,

    /** Validation error (model has errors) */
    VALIDATION_ERROR: 1,

    /** File not found */
    FILE_NOT_FOUND: 2,

    /** Parse error (syntax error) */
    PARSE_ERROR: 3,

    /** Configuration error (invalid model.yaml, etc.) */
    CONFIG_ERROR: 4,

    /** Network error (dependency operations) */
    NETWORK_ERROR: 10,

    /** Unknown command */
    UNKNOWN_COMMAND: 127,
} as const;

/**
 * Exit code type for type-safe usage.
 */
export type ExitCode = typeof EXIT[keyof typeof EXIT];

/**
 * Get a human-readable description for an exit code.
 * @param code - The exit code
 * @returns Description of what the code means
 */
export function getExitCodeDescription(code: ExitCode): string {
    switch (code) {
        case EXIT.SUCCESS:
            return 'Success';
        case EXIT.VALIDATION_ERROR:
            return 'Validation failed';
        case EXIT.FILE_NOT_FOUND:
            return 'File not found';
        case EXIT.PARSE_ERROR:
            return 'Syntax error';
        case EXIT.CONFIG_ERROR:
            return 'Configuration error';
        case EXIT.NETWORK_ERROR:
            return 'Network error';
        case EXIT.UNKNOWN_COMMAND:
            return 'Unknown command';
        default:
            return 'Unknown error';
    }
}
