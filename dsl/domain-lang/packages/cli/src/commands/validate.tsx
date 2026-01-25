/**
 * Validate command component.
 * Validates DomainLang model files and displays results.
 * 
 * @module commands/validate
 */
import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import type { LangiumDocument } from 'langium';
import { URI } from 'langium';
import { NodeFileSystem } from 'langium/node';
import { createDomainLangServices, type Model } from '@domainlang/language';
import { 
    Spinner, 
    StatusMessage, 
    Banner, 
    KeyValue,
    Divider,
} from '../ui/components/index.js';
import { theme } from '../ui/themes/colors.js';
import { EMOJI } from '../ui/themes/emoji.js';
import { useElapsedTime } from '../ui/hooks/index.js';
import type { CommandContext, ValidationResult, CommandError, CommandWarning } from './types.js';
import { resolve, extname, basename } from 'node:path';
import { existsSync } from 'node:fs';

/**
 * Props for Validate command component.
 */
export interface ValidateProps {
    /** File path to validate */
    file: string;
    /** Command context */
    context: CommandContext;
}

/**
 * State for validation process.
 */
type ValidateState = 
    | { status: 'loading' }
    | { status: 'success'; result: ValidationResult }
    | { status: 'error'; error: string };

/**
 * Convert Langium diagnostic to CommandError.
 */
function toCommandError(
    diagnostic: { message: string; range: { start: { line: number; character: number } } },
    file: string
): CommandError {
    return {
        code: 'VALIDATION_ERROR',
        message: diagnostic.message,
        file,
        line: diagnostic.range.start.line + 1,
        column: diagnostic.range.start.character + 1,
    };
}

/**
 * Convert Langium diagnostic to CommandWarning.
 */
function toCommandWarning(
    diagnostic: { message: string; range: { start: { line: number; character: number } } },
    file: string
): CommandWarning {
    return {
        code: 'VALIDATION_WARNING',
        message: diagnostic.message,
        file,
        line: diagnostic.range.start.line + 1,
    };
}

/**
 * Validate a model file and return results.
 */
async function validateModel(filePath: string): Promise<ValidationResult> {
    const services = createDomainLangServices(NodeFileSystem).DomainLang;
    const extensions = services.LanguageMetaData.fileExtensions;
    
    // Check file extension
    const ext = extname(filePath);
    if (!extensions.includes(ext)) {
        throw new Error(`Invalid file extension. Expected: ${extensions.join(', ')}`);
    }

    // Check file exists
    const resolvedPath = resolve(filePath);
    if (!existsSync(resolvedPath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    // Parse and validate
    const document: LangiumDocument = await services.shared.workspace.LangiumDocuments
        .getOrCreateDocument(URI.file(resolvedPath));
    await services.shared.workspace.DocumentBuilder.build([document], { validation: true });

    const diagnostics = document.diagnostics ?? [];
    const errors = diagnostics.filter(d => d.severity === 1);
    const warnings = diagnostics.filter(d => d.severity === 2);

    // Count model elements
    const model = document.parseResult?.value as Model | undefined;
    let domainCount = 0;
    let bcCount = 0;

    if (model?.children) {
        for (const element of model.children) {
            if (element.$type === 'Domain') {
                domainCount++;
            } else if (element.$type === 'BoundedContext') {
                bcCount++;
            }
        }
    }

    return {
        valid: errors.length === 0,
        fileCount: 1,
        domainCount,
        bcCount,
        errors: errors.map(e => toCommandError(e, filePath)),
        warnings: warnings.map(w => toCommandWarning(w, filePath)),
    };
}

/**
 * Validate command component.
 * Renders validation progress and results.
 */
export const Validate: React.FC<ValidateProps> = ({ file, context }) => {
    const [state, setState] = useState<ValidateState>({ status: 'loading' });
    const elapsed = useElapsedTime();

    useEffect(() => {
        validateModel(file)
            .then(result => setState({ status: 'success', result }))
            .catch(error => setState({ 
                status: 'error', 
                error: error instanceof Error ? error.message : String(error) 
            }));
    }, [file]);

    // JSON output mode
    if (context.mode === 'json') {
        if (state.status === 'loading') {
            return null; // Wait for result
        }
        if (state.status === 'error') {
            process.stdout.write(JSON.stringify({ success: false, error: state.error }) + '\n');
            process.exit(1);
            return null;
        }
        process.stdout.write(JSON.stringify({ success: state.result.valid, ...state.result }) + '\n');
        process.exit(state.result.valid ? 0 : 1);
        return null;
    }

    // Quiet mode
    if (context.mode === 'quiet') {
        if (state.status === 'loading') {
            return null;
        }
        if (state.status === 'error') {
            console.error(state.error);
            process.exit(1);
            return null;
        }
        // Only output errors/warnings in quiet mode
        for (const err of state.result.errors) {
            console.error(`${err.file}:${err.line}:${err.column}: error: ${err.message}`);
        }
        for (const warn of state.result.warnings) {
            console.warn(`${warn.file}:${warn.line}: warning: ${warn.message}`);
        }
        process.exit(state.result.valid ? 0 : 1);
        return null;
    }

    // Rich output mode (default)
    if (state.status === 'loading') {
        return <Spinner label={`Validating ${file}`} emoji="search" />;
    }

    if (state.status === 'error') {
        return (
            <Box flexDirection="column">
                <StatusMessage type="error" message={state.error} />
            </Box>
        );
    }

    const { result } = state;
    const fileName = basename(file);

    return (
        <Box flexDirection="column">
            {/* Result banner */}
            <Banner 
                bannerText={result.valid 
                    ? `${EMOJI.success}Model validated successfully`
                    : `${EMOJI.error}Validation failed`
                }
                variant={result.valid ? 'success' : 'error'}
            />

            {/* File info */}
            <Box marginTop={1}>
                <Divider title="Summary" />
            </Box>
            <Box marginTop={1} marginLeft={1}>
                <KeyValue data={{
                    'File': fileName,
                    'Elements': `${result.domainCount} domain${result.domainCount !== 1 ? 's' : ''}, ${result.bcCount} BC${result.bcCount !== 1 ? 's' : ''}`,
                    'Errors': result.errors.length,
                    'Warnings': result.warnings.length,
                }} />
            </Box>

            {/* Errors */}
            {result.errors.length > 0 && (
                <Box flexDirection="column" marginTop={1}>
                    <Divider title={`Errors (${result.errors.length})`} />
                    {result.errors.map((err, i) => (
                        <Box key={i} marginLeft={1} marginTop={i === 0 ? 1 : 0}>
                            <Text color={theme.status.error}>
                                {EMOJI.error}{err.file}:{err.line}:{err.column}
                            </Text>
                            <Text color={theme.text.secondary}> {err.message}</Text>
                        </Box>
                    ))}
                </Box>
            )}

            {/* Warnings */}
            {result.warnings.length > 0 && (
                <Box flexDirection="column" marginTop={1}>
                    <Divider title={`Warnings (${result.warnings.length})`} />
                    {result.warnings.map((warn, i) => (
                        <Box key={i} marginLeft={1} marginTop={i === 0 ? 1 : 0}>
                            <Text color={theme.status.warning}>
                                {EMOJI.warning}{warn.file}:{warn.line}
                            </Text>
                            <Text color={theme.text.secondary}> {warn.message}</Text>
                        </Box>
                    ))}
                </Box>
            )}

            {/* Timing */}
            <Box marginTop={1}>
                <Text color={theme.text.secondary}>
                    {EMOJI.loading}Completed in {elapsed.toFixed(2)}s
                </Text>
            </Box>
        </Box>
    );
};

/**
 * Run validation without Ink (for --json and --quiet modes).
 */
export async function runValidate(file: string, context: CommandContext): Promise<void> {
    try {
        const result = await validateModel(file);

        if (context.mode === 'json') {
            process.stdout.write(JSON.stringify({ success: result.valid, ...result }) + '\n');
            process.exit(result.valid ? 0 : 1);
        }

        if (context.mode === 'quiet') {
            for (const err of result.errors) {
                process.stderr.write(`${err.file}:${err.line}:${err.column}: error: ${err.message}\n`);
            }
            for (const warn of result.warnings) {
                process.stderr.write(`${warn.file}:${warn.line}: warning: ${warn.message}\n`);
            }
            process.exit(result.valid ? 0 : 1);
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (context.mode === 'json') {
            process.stdout.write(JSON.stringify({ success: false, error: message }) + '\n');
        } else {
            process.stderr.write(message + '\n');
        }
        process.exit(1);
    }
}
