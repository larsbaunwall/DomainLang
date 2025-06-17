import type { AstNode, ReferenceInfo, Scope, LangiumDocuments, AstNodeDescription } from 'langium';
import { DefaultScopeProvider, EMPTY_SCOPE, StreamScope, stream, URI } from 'langium';
import { Model, ImportStatement, isModel, isType } from '../generated/ast.js';
import type { DomainLangServices } from '../domain-lang-module.js';

export class DomainLangScopeProvider extends DefaultScopeProvider {
    protected langiumDocuments: LangiumDocuments;

    constructor(services: DomainLangServices) {
        super(services);
        this.langiumDocuments = services.shared.workspace.LangiumDocuments;
    }

    /**
     * Synchronous scope resolution as required by Langium's ScopeProvider interface.
     * Imported documents must be preloaded and built before scope resolution.
     */
    override getScope(context: ReferenceInfo): Scope {
        const container = context.container;
        const model = this.findModel(container);
        if (!model) return EMPTY_SCOPE;

        // Build import alias map
        const importMap = new Map<string, ImportStatement>();
        for (const imp of model.imports ?? []) {
            if (imp.alias) {
                importMap.set(imp.alias, imp);
            } else {
                const base = this.getBaseName(imp.uri);
                importMap.set(base, imp);
            }
        }

        // Determine if the reference is qualified (e.g. types.Sales)
        const refText = context.reference.$refText;
        if (!refText) return EMPTY_SCOPE;
        const [alias, symbol] = refText.split('.', 2);
        if (!symbol) {
            // Not qualified, only allow local scope
            return super.getScope(context);
        }

        const importStmt = importMap.get(alias);
        if (!importStmt) return EMPTY_SCOPE;

        // Synchronously resolve the imported document (must be preloaded)
        const filePath = this.resolveImportPath(importStmt.uri);
        const docUri = URI.file(filePath);
        const importedDoc = this.langiumDocuments.getDocument(docUri);
        if (!importedDoc) return EMPTY_SCOPE;

        // Expose only top-level types from the imported document
        const importedModel = importedDoc.parseResult.value as Model;
        const descriptions: AstNodeDescription[] = [];
        for (const child of importedModel.children) {
            if (isType(child) && child.name) {
                descriptions.push(this.descriptions.createDescription(child, `${alias}.${child.name}`, importedDoc));
            }
        }
        return new StreamScope(stream(descriptions));
    }

    protected findModel(node: AstNode): Model | undefined {
        let current: AstNode | undefined = node;
        while (current) {
            if (isModel(current)) return current;
            current = current.$container;
        }
        return undefined;
    }

    protected getBaseName(uri: string): string {
        const parts = uri.split(/[\\/]/);
        let base = parts[parts.length - 1];
        if (base.endsWith('.dlang')) base = base.slice(0, -6);
        return base;
    }

    protected resolveImportPath(uri: string): string {
        if (uri.startsWith('http://') || uri.startsWith('https://')) {
            const crypto = require('crypto');
            const path = require('path');
            const CACHE_DIR = path.resolve('.dlang/cache');
            const hash = crypto.createHash('sha256').update(uri).digest('hex');
            return path.join(CACHE_DIR, hash + '.dlang');
        } else {
            const path = require('path');
            return path.resolve(uri);
        }
    }
} 