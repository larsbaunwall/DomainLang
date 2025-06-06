/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import type { AstNode, AstNodeDescription, LangiumDocument, PrecomputedScopes } from 'langium';
import { DefaultScopeComputation, interruptAndCheck, MultiMap, AstUtils } from 'langium';
import { CancellationToken } from 'vscode-jsonrpc';
import { isType, isGroupDeclaration, GroupDeclaration, Model, Container } from '../generated/ast.js';
import { QualifiedNameProvider } from './domain-lang-naming.js';
import { DomainLangServices } from '../domain-lang-module.js';

export class DomainLangScopeComputation extends DefaultScopeComputation {

    qualifiedNameProvider: QualifiedNameProvider;

    constructor(services: DomainLangServices) {
        super(services);
        this.qualifiedNameProvider = services.references.QualifiedNameProvider;
    }

    /**
     * Exports only types (`DataType or `Entity`) with their qualified names.
     */
    override async computeExports(document: LangiumDocument, cancelToken = CancellationToken.None): Promise<AstNodeDescription[]> {
        const descr: AstNodeDescription[] = [];
        for (const modelNode of AstUtils.streamAllContents(document.parseResult.value)) {
            await interruptAndCheck(cancelToken);
            if (isType(modelNode)) {
                let name = this.nameProvider.getName(modelNode);
                if (name) {
                    if (isGroupDeclaration(modelNode.$container)) {
                        name = this.qualifiedNameProvider.getQualifiedName(modelNode.$container as GroupDeclaration, name);
                    }
                    descr.push(this.descriptions.createDescription(modelNode, name, document));
                }
            }
        }
        return descr;
    }

    override async computeLocalScopes(document: LangiumDocument, cancelToken = CancellationToken.None): Promise<PrecomputedScopes> {
        const model = document.parseResult.value as Model;
        const scopes = new MultiMap<AstNode, AstNodeDescription>();
        await this.processContainer(model, scopes, document, cancelToken);
        return scopes;
    }

    protected async processContainer(container: Container, scopes: PrecomputedScopes, document: LangiumDocument, cancelToken: CancellationToken): Promise<AstNodeDescription[]> {
        const localDescriptions: AstNodeDescription[] = [];
        for (const element of container.children) {
            await interruptAndCheck(cancelToken);
            if (isType(element) && element.name) {
                const description = this.descriptions.createDescription(element, element.name, document);
                localDescriptions.push(description);
            } else if (isGroupDeclaration(element)) {
                const nestedDescriptions = await this.processContainer(element, scopes, document, cancelToken);
                for (const description of nestedDescriptions) {
                    // Add qualified names to the container
                    const qualified = this.createQualifiedDescription(element, description, document);
                    localDescriptions.push(qualified);
                }
            }
        }
        scopes.addAll(container, localDescriptions);
        return localDescriptions;
    }

    protected createQualifiedDescription(group: GroupDeclaration, description: AstNodeDescription, document: LangiumDocument): AstNodeDescription {
        const name = this.qualifiedNameProvider.getQualifiedName(group.name, description.name);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.descriptions.createDescription(description.node!, name, document);
    }

}