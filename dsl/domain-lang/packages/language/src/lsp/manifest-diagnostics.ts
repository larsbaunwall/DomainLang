/**
 * Manifest Diagnostics Service for DomainLang.
 * 
 * Provides LSP diagnostics for model.yaml files by integrating the ManifestValidator
 * with the VS Code language server protocol.
 * 
 * This service:
 * - Validates model.yaml files using ManifestValidator
 * - Converts ManifestDiagnostic to LSP Diagnostic format
 * - Sends diagnostics to the LSP connection
 * 
 * @module
 */

import type { Connection } from 'vscode-languageserver';
import { Diagnostic, DiagnosticSeverity, Position, Range } from 'vscode-languageserver-types';
import YAML, { type Document as YAMLDocument, type YAMLMap, type Pair, isMap, isPair, isScalar } from 'yaml';
import { ManifestValidator, type ManifestDiagnostic, type ManifestSeverity } from '../validation/manifest.js';
import type { ModelManifest } from '../services/types.js';

/**
 * Service for validating model.yaml and sending diagnostics via LSP.
 */
export class ManifestDiagnosticsService {
    private readonly validator = new ManifestValidator();
    private connection: Connection | undefined;

    /**
     * Sets the LSP connection for sending diagnostics.
     * Must be called before validateAndSendDiagnostics.
     */
    setConnection(connection: Connection): void {
        this.connection = connection;
    }

    /**
     * Validates a model.yaml file and sends diagnostics to the LSP connection.
     * 
     * @param manifestUri - URI of the model.yaml file
     * @param content - Raw YAML content of the file
     * @param options - Validation options
     */
    async validateAndSendDiagnostics(
        manifestUri: string,
        content: string,
        options?: { requirePublishable?: boolean }
    ): Promise<void> {
        if (!this.connection) {
            return; // No connection, skip diagnostics
        }

        const diagnostics = this.validate(content, options);
        
        await this.connection.sendDiagnostics({
            uri: manifestUri,
            diagnostics
        });
    }

    /**
     * Validates manifest content and returns LSP diagnostics.
     * 
     * @param content - Raw YAML content
     * @param options - Validation options
     * @returns Array of LSP diagnostics
     */
    validate(
        content: string,
        options?: { requirePublishable?: boolean }
    ): Diagnostic[] {
        // Parse YAML to get both the manifest object and source map
        let yamlDoc: YAMLDocument.Parsed;
        let manifest: ModelManifest;
        
        try {
            yamlDoc = YAML.parseDocument(content);
            
            // Check for YAML parse errors (they're in the errors array, not thrown)
            if (yamlDoc.errors && yamlDoc.errors.length > 0) {
                return yamlDoc.errors.map(err => ({
                    severity: DiagnosticSeverity.Error,
                    range: this.yamlErrorToRange(err, content),
                    message: `YAML parse error: ${err.message}`,
                    source: 'domainlang'
                }));
            }
            
            manifest = (yamlDoc.toJSON() ?? {}) as ModelManifest;
        } catch (error) {
            // Fallback for unexpected errors
            const message = error instanceof Error ? error.message : 'Invalid YAML syntax';
            return [{
                severity: DiagnosticSeverity.Error,
                range: Range.create(Position.create(0, 0), Position.create(0, 1)),
                message: `YAML parse error: ${message}`,
                source: 'domainlang'
            }];
        }

        // Run manifest validation
        const result = this.validator.validate(manifest, options);
        
        // Convert to LSP diagnostics with source locations
        return result.diagnostics.map(diag => 
            this.toVSCodeDiagnostic(diag, yamlDoc)
        );
    }

    /**
     * Converts a YAML error to an LSP Range.
     */
    private yamlErrorToRange(err: YAML.YAMLError, _content: string): Range {
        if (err.linePos && err.linePos.length >= 1) {
            const startPos = err.linePos[0];
            const startLine = startPos.line - 1; // YAML uses 1-based lines
            const startCol = startPos.col - 1;   // YAML uses 1-based columns
            const endPos = err.linePos.length >= 2 ? err.linePos[1] : undefined;
            const endLine = endPos ? endPos.line - 1 : startLine;
            const endCol = endPos ? endPos.col - 1 : startCol + 1;
            return Range.create(
                Position.create(startLine, startCol),
                Position.create(endLine, endCol)
            );
        }
        return Range.create(Position.create(0, 0), Position.create(0, 1));
    }

    /**
     * Clears diagnostics for a manifest file.
     * Call this when the file is closed or deleted.
     */
    async clearDiagnostics(manifestUri: string): Promise<void> {
        if (!this.connection) {
            return;
        }

        await this.connection.sendDiagnostics({
            uri: manifestUri,
            diagnostics: []
        });
    }

    /**
     * Converts a ManifestDiagnostic to an LSP Diagnostic.
     */
    private toVSCodeDiagnostic(
        diag: ManifestDiagnostic,
        yamlDoc: YAMLDocument.Parsed
    ): Diagnostic {
        const range = this.findRangeForPath(diag.path, yamlDoc);
        
        let message = diag.message;
        if (diag.hint) {
            message += `\nHint: ${diag.hint}`;
        }

        return {
            severity: this.toVSCodeSeverity(diag.severity),
            range,
            message,
            source: 'domainlang',
            code: diag.code
        };
    }

    /**
     * Converts ManifestSeverity to LSP DiagnosticSeverity.
     */
    private toVSCodeSeverity(severity: ManifestSeverity): DiagnosticSeverity {
        switch (severity) {
            case 'error':
                return DiagnosticSeverity.Error;
            case 'warning':
                return DiagnosticSeverity.Warning;
            case 'info':
                return DiagnosticSeverity.Information;
            default:
                return DiagnosticSeverity.Warning;
        }
    }

    /**
     * Finds the source range for a YAML path like "dependencies.core.version".
     * Returns a fallback range at start of file if path not found.
     */
    private findRangeForPath(path: string, yamlDoc: YAMLDocument.Parsed): Range {
        const fallback = Range.create(Position.create(0, 0), Position.create(0, 1));
        
        if (!yamlDoc.contents || !isMap(yamlDoc.contents)) {
            return fallback;
        }

        const parts = path.split('.');
        let currentNode: unknown = yamlDoc.contents;

        for (const part of parts) {
            if (!isMap(currentNode)) {
                return fallback;
            }
            
            const mapNode = currentNode as YAMLMap;
            const item = mapNode.items.find((pair): pair is Pair => 
                isPair(pair) && isScalar(pair.key) && String(pair.key.value) === part
            );

            if (!item) {
                return fallback;
            }

            // If this is the last part, return the range of the key
            if (part === parts[parts.length - 1]) {
                const keyNode = item.key;
                if (isScalar(keyNode) && keyNode.range) {
                    const [start, end] = keyNode.range;
                    return this.offsetsToRange(start, end, yamlDoc.toString());
                }
            }

            currentNode = item.value;
        }

        return fallback;
    }

    /**
     * Converts byte offsets to a VS Code Range using line/column calculation.
     */
    private offsetsToRange(startOffset: number, endOffset: number, content: string): Range {
        const lines = content.split('\n');
        let currentOffset = 0;
        let startLine = 0;
        let startCol = 0;
        let endLine = 0;
        let endCol = 0;
        let foundStart = false;
        let foundEnd = false;

        for (let lineNum = 0; lineNum < lines.length && !foundEnd; lineNum++) {
            const lineLength = lines[lineNum].length + 1; // +1 for newline

            if (!foundStart && currentOffset + lineLength > startOffset) {
                startLine = lineNum;
                startCol = startOffset - currentOffset;
                foundStart = true;
            }

            if (!foundEnd && currentOffset + lineLength >= endOffset) {
                endLine = lineNum;
                endCol = endOffset - currentOffset;
                foundEnd = true;
            }

            currentOffset += lineLength;
        }

        return Range.create(
            Position.create(startLine, startCol),
            Position.create(endLine, endCol)
        );
    }
}

/**
 * Singleton instance for use across the language server.
 */
let manifestDiagnosticsService: ManifestDiagnosticsService | undefined;

/**
 * Gets or creates the manifest diagnostics service singleton.
 */
export function getManifestDiagnosticsService(): ManifestDiagnosticsService {
    if (!manifestDiagnosticsService) {
        manifestDiagnosticsService = new ManifestDiagnosticsService();
    }
    return manifestDiagnosticsService;
}

/**
 * Helper to validate a manifest URI with the given content.
 * Convenience function for use in file watchers.
 */
export async function validateManifestFile(
    connection: Connection,
    manifestUri: string,
    content: string
): Promise<void> {
    const service = getManifestDiagnosticsService();
    service.setConnection(connection);
    await service.validateAndSendDiagnostics(manifestUri, content);
}
