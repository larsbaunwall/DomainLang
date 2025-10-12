// domain-lang-scope.ts
// Implements custom scope computation for the DomainLang DSL, supporting FQN disambiguation, nested groups, and cross-file references.

/****************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ***************************************************************************/

import type { 
    AstNode, 
    AstNodeDescription, 
    LangiumDocument, 
    LocalSymbols 
} from 'langium';
import { 
    DefaultScopeComputation, 
    interruptAndCheck, 
    MultiMap, 
    AstUtils 
} from 'langium';
import { CancellationToken } from 'vscode-jsonrpc';
import type { NamespaceDeclaration, Model, Container } from '../generated/ast.js';
import { isType, isNamespaceDeclaration } from '../generated/ast.js';
import { QualifiedNameProvider } from './domain-lang-naming.js';
import type { DomainLangServices } from '../domain-lang-module.js';

/**
 * Computes the scope for DomainLang elements, supporting nested namespaces, FQN disambiguation, and cross-file references.
 * Extends Langium's DefaultScopeComputation to provide custom export and local scope logic.
 */
export class DomainLangScopeComputation extends DefaultScopeComputation {
    qualifiedNameProvider: QualifiedNameProvider;

    /**
     * Constructs a new DomainLangScopeComputation with injected services.
     * @param services - The DomainLangServices instance
     */
    constructor(services: DomainLangServices) {
        super(services);
        this.qualifiedNameProvider = services.references.QualifiedNameProvider;
    }

    /**
    * Computes exported node descriptions for types, using fully qualified names for nested namespaces.
     * @param document - The LangiumDocument to process
     * @param cancelToken - Optional cancellation token
     * @returns A promise resolving to an array of AstNodeDescription
     */
    override async collectExportedSymbols(document: LangiumDocument, cancelToken = CancellationToken.None): Promise<AstNodeDescription[]> {
        const descr: AstNodeDescription[] = [];
        for (const modelNode of AstUtils.streamAllContents(document.parseResult.value)) {
            await interruptAndCheck(cancelToken);
            if (isType(modelNode)) {
                let name = this.nameProvider.getName(modelNode);
                if (!name) {
                    // Defensive: skip unnamed types
                    continue;
                }
                if (isNamespaceDeclaration(modelNode.$container)) {
                    name = this.qualifiedNameProvider.getQualifiedName(modelNode.$container as NamespaceDeclaration, name);
                }
                descr.push(this.descriptions.createDescription(modelNode, name, document));
            }
        }
        return descr;
    }

    /**
    * Computes local scopes for all containers, recursively processing nested namespaces.
     * @param document - The LangiumDocument to process
     * @param cancelToken - Optional cancellation token
     * @returns A promise resolving to a LocalSymbols map
     */
    override async collectLocalSymbols(document: LangiumDocument, cancelToken = CancellationToken.None): Promise<LocalSymbols> {
        const model = document.parseResult.value as Model;
        const scopes = new MultiMap<AstNode, AstNodeDescription>();
        await this.processContainer(model, scopes, document, cancelToken);
        return scopes;
    }

    /**
     * Recursively processes a container and its children, adding local descriptions and qualified names.
    * @param container - The container node (Model or NamespaceDeclaration)
     * @param scopes - The LocalSymbols map to populate
     * @param document - The LangiumDocument being processed
     * @param cancelToken - Optional cancellation token
     * @returns A promise resolving to an array of AstNodeDescription
     */
    protected async processContainer(
        container: Container,
        scopes: LocalSymbols,
        document: LangiumDocument,
        cancelToken: CancellationToken
    ): Promise<AstNodeDescription[]> {
        const localDescriptions: AstNodeDescription[] = [];
        for (const element of container.children) {
            await interruptAndCheck(cancelToken);
            if (isType(element) && element.name) {
                const description = this.descriptions.createDescription(element, element.name, document);
                localDescriptions.push(description);
            } else if (isNamespaceDeclaration(element)) {
                const nestedDescriptions = await this.processContainer(element, scopes, document, cancelToken);
                for (const description of nestedDescriptions) {
                    // Add qualified names to the container
                    const qualified = this.createQualifiedDescription(element, description, document);
                    localDescriptions.push(qualified);
                }
            }
        }
        // MultiMap implements LocalSymbols interface with add/addAll methods
        (scopes as MultiMap<AstNode, AstNodeDescription>).addAll(container, localDescriptions);
        return localDescriptions;
    }

    /**
    * Creates a qualified AstNodeDescription for a node within a namespace.
     * 
    * @param namespace - The NamespaceDeclaration containing the node
     * @param description - The AstNodeDescription to qualify
     * @param document - The LangiumDocument being processed
     * @returns A new AstNodeDescription with a fully qualified name
     * 
     * @example
     * // For a Domain "Sales" in namespace "Shared"
     * // Returns description with name "Shared.Sales"
     */
    protected createQualifiedDescription(
        namespace: NamespaceDeclaration,
        description: AstNodeDescription,
        document: LangiumDocument
    ): AstNodeDescription {
        const name = this.qualifiedNameProvider.getQualifiedName(namespace.name, description.name);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.descriptions.createDescription(description.node!, name, document);
    }
}