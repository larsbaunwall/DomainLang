import { AstNode, AstNodeDescription, DefaultScopeComputation, interruptAndCheck, LangiumDocument, LangiumServices, MultiMap, PrecomputedScopes } from 'langium';
import { CancellationToken } from 'vscode-jsonrpc';
import { DomainModelNameProvider } from './domain-model-naming';
import { Model, isType, PackageDeclaration, isPackageDeclaration } from './generated/ast';

export class DomainModelScopeComputation extends DefaultScopeComputation {

    constructor(services: LangiumServices) {
        super(services);
    }

    async computeScope(document: LangiumDocument, cancelToken = CancellationToken.None): Promise<PrecomputedScopes> {
        const model = document.parseResult.value as Model;
        const scopes = new MultiMap<AstNode, AstNodeDescription>();
        await this.processContainer(model, scopes, document, cancelToken);
        return scopes;
    }

    protected async processContainer(container: Model | PackageDeclaration, scopes: PrecomputedScopes, document: LangiumDocument, cancelToken: CancellationToken): Promise<AstNodeDescription[]> {
        const localDescriptions: AstNodeDescription[] = [];
        for (const element of container.elements) {
            await interruptAndCheck(cancelToken);
            if (isType(element)) {
                const description = this.descriptions.createDescription(element, element.name, document);
                localDescriptions.push(description);
            } else if (isPackageDeclaration(element)) {
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

    protected createQualifiedDescription(pack: PackageDeclaration, description: AstNodeDescription, document: LangiumDocument): AstNodeDescription {
        const name = (this.nameProvider as DomainModelNameProvider).getQualifiedName(pack.name, description.name);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.descriptions.createDescription(description.node!, name, document);
    }

}