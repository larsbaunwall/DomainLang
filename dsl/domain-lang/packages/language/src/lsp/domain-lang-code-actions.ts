/**
 * Code Action Provider for DomainLang.
 * 
 * Provides quick-fix code actions for validation diagnostics.
 * 
 * Key Features:
 * - "Add dependency to model.yaml" for unknown import aliases
 * - "Run dlang install" for uninstalled dependencies
 * 
 * @module
 */

import type { CodeAction, CodeActionParams, Command, Diagnostic } from 'vscode-languageserver';
import { CodeActionKind } from 'vscode-languageserver';
import type { MaybePromise, LangiumDocument } from 'langium';
import type { CodeActionProvider } from 'langium/lsp';
import { IssueCodes } from '../validation/constants.js';

/**
 * Shape of diagnostic data used for code action matching.
 * Must match the data structure used in validators.
 */
interface ImportDiagnosticData {
    code: string;
    alias?: string;
    specifier?: string;
    path?: string;
}

/**
 * Code action provider for DomainLang LSP features.
 * 
 * Implements quick fixes for:
 * - Import validation errors (add to model.yaml, run install)
 */
export class DomainLangCodeActionProvider implements CodeActionProvider {

    /**
     * Generates code actions for the given diagnostics.
     * 
     * @param document - The document containing the diagnostics
     * @param params - Code action request parameters including diagnostics
     * @returns Array of code actions, or undefined if none applicable
     */
    getCodeActions(
        document: LangiumDocument, 
        params: CodeActionParams
    ): MaybePromise<Array<Command | CodeAction> | undefined> {
        const result: CodeAction[] = [];
        const acceptor = (ca: CodeAction | undefined): void => {
            if (ca) result.push(ca);
        };

        for (const diagnostic of params.context.diagnostics) {
            this.createCodeActions(diagnostic, document, acceptor);
        }

        return result.length > 0 ? result : undefined;
    }

    /**
     * Creates code actions for a specific diagnostic.
     * 
     * Matches on diagnostic.data.code to determine which quick fix to offer.
     */
    private createCodeActions(
        diagnostic: Diagnostic, 
        document: LangiumDocument, 
        accept: (ca: CodeAction | undefined) => void
    ): void {
        const data = diagnostic.data as ImportDiagnosticData | undefined;
        if (!data?.code) return;

        switch (data.code) {
            case IssueCodes.ImportNotInManifest:
                if (data.alias) {
                    accept(this.createAddToManifestAction(diagnostic, document, data.alias));
                }
                break;

            case IssueCodes.ImportRequiresManifest:
                if (data.specifier) {
                    accept(this.createCreateManifestAction(diagnostic, document, data.specifier));
                }
                break;

            case IssueCodes.ImportNotInstalled:
                if (data.alias) {
                    accept(this.createRunInstallAction(diagnostic, data.alias));
                }
                break;

            case IssueCodes.ImportMissingRef:
                if (data.alias) {
                    accept(this.createAddRefAction(diagnostic, data.alias));
                }
                break;
        }
    }

    /**
     * Creates a code action to add a dependency to model.yaml.
     * 
     * This generates a WorkspaceEdit that modifies model.yaml to add
     * the missing dependency with a placeholder version.
     */
    private createAddToManifestAction(
        diagnostic: Diagnostic,
        _document: LangiumDocument,
        alias: string
    ): CodeAction {
        // Create a command that will be executed to add the dependency
        // Since we can't directly edit model.yaml from here (it's not the current document),
        // we provide a command that the extension can handle
        return {
            title: `Add '${alias}' to model.yaml`,
            kind: CodeActionKind.QuickFix,
            diagnostics: [diagnostic],
            isPreferred: true,
            command: {
                title: `Add '${alias}' to model.yaml`,
                command: 'domainlang.addDependency',
                arguments: [alias]
            }
        };
    }

    /**
     * Creates a code action to create model.yaml with the dependency.
     */
    private createCreateManifestAction(
        diagnostic: Diagnostic,
        _document: LangiumDocument,
        specifier: string
    ): CodeAction {
        const alias = specifier.split('/')[0];
        return {
            title: `Create model.yaml with '${alias}' dependency`,
            kind: CodeActionKind.QuickFix,
            diagnostics: [diagnostic],
            isPreferred: true,
            command: {
                title: `Create model.yaml`,
                command: 'domainlang.createManifest',
                arguments: [alias, specifier]
            }
        };
    }

    /**
     * Creates a code action to run dlang install.
     */
    private createRunInstallAction(
        diagnostic: Diagnostic,
        alias: string
    ): CodeAction {
        return {
            title: `Run 'dlang install' to fetch '${alias}'`,
            kind: CodeActionKind.QuickFix,
            diagnostics: [diagnostic],
            isPreferred: true,
            command: {
                title: 'Install dependencies',
                command: 'domainlang.install',
                arguments: []
            }
        };
    }

    /**
     * Creates a code action to add ref to dependency.
     */
    private createAddRefAction(
        diagnostic: Diagnostic,
        alias: string
    ): CodeAction {
        return {
            title: `Add git ref to '${alias}' in model.yaml`,
            kind: CodeActionKind.QuickFix,
            diagnostics: [diagnostic],
            isPreferred: false,
            command: {
                title: 'Add ref',
                command: 'domainlang.addRef',
                arguments: [alias]
            }
        };
    }
}
