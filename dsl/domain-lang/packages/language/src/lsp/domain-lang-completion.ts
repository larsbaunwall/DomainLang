/**
 * Completion provider for DomainLang - context-aware, grammar-aligned.
 *
 * **Design:**
 * - Context-aware: Only suggests what's valid at cursor position
 * - Grammar-aligned: Completions match grammar structure exactly
 * - Simple: Uses parent node to determine context
 * - Maintainable: Clear mapping from grammar to completions
 */

import { CompletionAcceptor, CompletionContext, DefaultCompletionProvider, NextFeature } from 'langium/lsp';
import { CompletionItemKind, InsertTextFormat } from 'vscode-languageserver';
import * as ast from '../generated/ast.js';

/**
 * Top-level snippet templates for creating new AST nodes.
 */
const TOP_LEVEL_SNIPPETS = [
    {
        label: '⚡ Domain (simple)',
        kind: CompletionItemKind.Snippet,
        insertText: 'Domain ${1:Name} {}',
        documentation: '📝 Snippet: Create a simple domain',
        sortText: '0_snippet_domain_simple'
    },
    {
        label: '⚡ Domain (detailed)',
        kind: CompletionItemKind.Snippet,
        insertText: [
            'Domain ${1:Name} {',
            '\tdescription: "${2:Description}"',
            '\tvision: "${3:Vision}"',
            '\tclassification: ${4:CoreDomain}',
            '}'
        ].join('\n'),
        documentation: '📝 Snippet: Create a domain with description and vision',
        sortText: '0_snippet_domain_detailed'
    },
    {
        label: '⚡ BoundedContext (simple)',
        kind: CompletionItemKind.Snippet,
        insertText: 'bc ${1:Name} for ${2:Domain} as ${3:Core} by ${4:Team}',
        documentation: '📝 Snippet: Quick bounded context definition',
        sortText: '0_snippet_bc_simple'
    },
    {
        label: '⚡ BoundedContext (detailed)',
        kind: CompletionItemKind.Snippet,
        insertText: [
            'BoundedContext ${1:Name} for ${2:Domain} {',
            '\tdescription: "${3:Description}"',
            '\tteam: ${4:Team}',
            '\trole: ${5:Core}',
            '\t',
            '\tterminology {',
            '\t\tterm ${6:Term}: "${7:Definition}"',
            '\t}',
            '}'
        ].join('\n'),
        documentation: '📝 Snippet: Full bounded context with all common blocks',
        sortText: '0_snippet_bc_detailed'
    },
    {
        label: '⚡ ContextMap',
        kind: CompletionItemKind.Snippet,
        insertText: [
            'ContextMap ${1:Name} {',
            '\tcontains ${2:Context1}, ${3:Context2}',
            '}'
        ].join('\n'),
        documentation: '📝 Snippet: Create a context map',
        sortText: '0_snippet_contextmap'
    },
    {
        label: '⚡ DomainMap',
        kind: CompletionItemKind.Snippet,
        insertText: [
            'DomainMap ${1:Name} {',
            '\tcontains ${2:Domain1}, ${3:Domain2}',
            '}'
        ].join('\n'),
        documentation: '📝 Snippet: Create a domain map',
        sortText: '0_snippet_domainmap'
    },
    {
        label: '⚡ Team',
        kind: CompletionItemKind.Snippet,
        insertText: 'Team ${1:TeamName}',
        documentation: '📝 Snippet: Define a team',
        sortText: '0_snippet_team'
    },
    {
        label: '⚡ Classification',
        kind: CompletionItemKind.Snippet,
        insertText: 'Classification ${1:Name}',
        documentation: '📝 Snippet: Define a reusable classification label',
        sortText: '0_snippet_classification'
    },
    {
        label: '⚡ Metadata',
        kind: CompletionItemKind.Snippet,
        insertText: 'Metadata ${1:KeyName}',
        documentation: '📝 Snippet: Define a metadata key',
        sortText: '0_snippet_metadata'
    },
    {
        label: '⚡ Namespace',
        kind: CompletionItemKind.Snippet,
        insertText: [
            'Namespace ${1:name.space} {',
            '\t$0',
            '}'
        ].join('\n'),
        documentation: '📝 Snippet: Create a hierarchical namespace',
        sortText: '0_snippet_namespace'
    }
] as const;

export class DomainLangCompletionProvider extends DefaultCompletionProvider {
    protected override completionFor(
        context: CompletionContext,
        next: NextFeature,
        acceptor: CompletionAcceptor
    ): void {
        const node = context.node;
        if (!node) {
            super.completionFor(context, next, acceptor);
            return;
        }

        // Strategy: Check node type and container to determine what's allowed at cursor position
        
        // Check if cursor is after the node (for top-level positioning)
        const offset = context.offset;
        const nodeEnd = node.$cstNode?.end ?? 0;
        const isAfterNode = offset >= nodeEnd;
        
        // If we're positioned after a BC/Domain (e.g., on next line): show top-level
        if ((ast.isBoundedContext(node) || ast.isDomain(node)) && isAfterNode) {
            this.addTopLevelSnippets(acceptor, context);
            // Let Langium provide keywords like "bc", "Domain", etc.
            super.completionFor(context, next, acceptor);
            return;
        }
        
        // If we're AT a BoundedContext node: only BC documentation blocks
        if (ast.isBoundedContext(node)) {
            this.addBoundedContextCompletions(node, acceptor, context);
            super.completionFor(context, next, acceptor);
            return;
        }

        // If we're AT a Domain node: only Domain documentation blocks
        if (ast.isDomain(node)) {
            this.addDomainCompletions(node, acceptor, context);
            super.completionFor(context, next, acceptor);
            return;
        }

        // If we're AT a ContextMap node: relationships and contains
        if (ast.isContextMap(node)) {
            this.addContextMapCompletions(node, acceptor, context);
            super.completionFor(context, next, acceptor);
            return;
        }

        // If we're AT a DomainMap node: contains
        if (ast.isDomainMap(node)) {
            this.addDomainMapCompletions(node, acceptor, context);
            super.completionFor(context, next, acceptor);
            return;
        }

        // If we're AT the Model or NamespaceDeclaration level: all top-level constructs
        if (ast.isModel(node) || ast.isNamespaceDeclaration(node)) {
            this.addTopLevelSnippets(acceptor, context);
            super.completionFor(context, next, acceptor);
            return;
        }

        const container = node.$container;

        // Inside BoundedContext body: suggest missing scalar properties and collections
        if (ast.isBoundedContext(container)) {
            this.addBoundedContextCompletions(container, acceptor, context);
            super.completionFor(context, next, acceptor);
            return;
        }

        // Inside Domain body: suggest missing scalar properties
        if (ast.isDomain(container)) {
            this.addDomainCompletions(container, acceptor, context);
            super.completionFor(context, next, acceptor);
            return;
        }

        // Inside ContextMap body: relationships and contains
        if (ast.isContextMap(container)) {
            this.addContextMapCompletions(container, acceptor, context);
            super.completionFor(context, next, acceptor);
            return;
        }

        // Inside DomainMap body: contains
        if (ast.isDomainMap(container)) {
            this.addDomainMapCompletions(container, acceptor, context);
            super.completionFor(context, next, acceptor);
            return;
        }

        if (ast.isRelationship(node) || ast.isRelationship(container)) {
            this.addRelationshipCompletions(acceptor, context);
            super.completionFor(context, next, acceptor);
            return;
        }

        // Top level container (Model or NamespaceDeclaration): all top-level constructs
        if (ast.isModel(container) || ast.isNamespaceDeclaration(container)) {
            this.addTopLevelSnippets(acceptor, context);
        }

        // Let Langium handle default completions
        super.completionFor(context, next, acceptor);
    }

    private addTopLevelSnippets(acceptor: CompletionAcceptor, context: CompletionContext): void {
        for (const snippet of TOP_LEVEL_SNIPPETS) {
            acceptor(context, {
                label: snippet.label,
                kind: snippet.kind,
                insertText: snippet.insertText,
                insertTextFormat: InsertTextFormat.Snippet,
                documentation: snippet.documentation,
                sortText: snippet.sortText
            });
        }
    }

    /**
     * Add property/collection completions for BoundedContext.
     */
    private addBoundedContextCompletions(
        node: ast.BoundedContext,
        acceptor: CompletionAcceptor,
        context: CompletionContext
    ): void {
        if (!node.description) {
            acceptor(context, {
                label: '⚡ description',
                kind: CompletionItemKind.Snippet,
                insertText: 'description: "${1:Description}"',
                insertTextFormat: InsertTextFormat.Snippet,
                documentation: '📝 Snippet: Describe the bounded context\'s responsibility',
                sortText: '0_snippet_description'
            });
        }

        if (node.team.length === 0) {
            acceptor(context, {
                label: '⚡ team',
                kind: CompletionItemKind.Snippet,
                insertText: 'team: ${1:TeamName}',
                insertTextFormat: InsertTextFormat.Snippet,
                documentation: '📝 Snippet: Assign the responsible team',
                sortText: '0_snippet_team'
            });
        }

        if (node.classification.length === 0) {
            acceptor(context, {
                label: '⚡ classification',
                kind: CompletionItemKind.Snippet,
                insertText: 'classification: ${1:Core}',
                insertTextFormat: InsertTextFormat.Snippet,
                documentation: '📝 Snippet: Assign the strategic classification (Core, Supporting, Generic)',
                sortText: '0_snippet_classification'
            });
        }

        if (!node.businessModel) {
            acceptor(context, {
                label: '⚡ businessModel',
                kind: CompletionItemKind.Snippet,
                insertText: 'businessModel: ${1:Commercial}',
                insertTextFormat: InsertTextFormat.Snippet,
                documentation: '📝 Snippet: Classify the business model',
                sortText: '0_snippet_businessModel'
            });
        }

        if (!node.evolution) {
            acceptor(context, {
                label: '⚡ evolution',
                kind: CompletionItemKind.Snippet,
                insertText: 'evolution: ${1:Product}',
                insertTextFormat: InsertTextFormat.Snippet,
                documentation: '📝 Snippet: Define the evolution stage (Genesis, Custom, Product, Commodity)',
                sortText: '0_snippet_evolution'
            });
        }

        if (node.terminology.length === 0) {
            acceptor(context, {
                label: '⚡ terminology',
                kind: CompletionItemKind.Snippet,
                insertText: [
                    'terminology {',
                    '\tterm ${1:Term}: "${2:Definition}"',
                    '}'
                ].join('\n'),
                insertTextFormat: InsertTextFormat.Snippet,
                documentation: '📝 Snippet: Define ubiquitous language terms',
                sortText: '0_snippet_terminology'
            });
        }

        if (node.decisions.length === 0) {
            acceptor(context, {
                label: '⚡ decisions',
                kind: CompletionItemKind.Snippet,
                insertText: [
                    'decisions {',
                    '\tdecision [${1|technical,business|}] ${2:DecisionName}: "${3:Rationale}"',
                    '}'
                ].join('\n'),
                insertTextFormat: InsertTextFormat.Snippet,
                documentation: '📝 Snippet: Document architectural decisions',
                sortText: '0_snippet_decisions'
            });
        }

        if (node.relationships.length === 0) {
            acceptor(context, {
                label: '⚡ relationships',
                kind: CompletionItemKind.Snippet,
                insertText: [
                    'relationships {',
                    '\t${1:Context1} -> ${2:Context2}',
                    '}'
                ].join('\n'),
                insertTextFormat: InsertTextFormat.Snippet,
                documentation: '📝 Snippet: Define relationships with other bounded contexts',
                sortText: '0_snippet_relationships'
            });
        }

        if (node.metadata.length === 0) {
            acceptor(context, {
                label: '⚡ metadata',
                kind: CompletionItemKind.Snippet,
                insertText: [
                    'metadata {',
                    '\t${1:Language}: "${2:TypeScript}"',
                    '}'
                ].join('\n'),
                insertTextFormat: InsertTextFormat.Snippet,
                documentation: '📝 Snippet: Add metadata key-value pairs',
                sortText: '0_snippet_metadata'
            });
        }
    }

    /**
     * Add property completions for Domain.
     */
    private addDomainCompletions(
        node: ast.Domain,
        acceptor: CompletionAcceptor,
        context: CompletionContext
    ): void {
        if (!node.description) {
            acceptor(context, {
                label: '⚡ description',
                kind: CompletionItemKind.Snippet,
                insertText: 'description: "${1:Description}"',
                insertTextFormat: InsertTextFormat.Snippet,
                documentation: '📝 Snippet: Describe what this domain encompasses',
                sortText: '0_snippet_description'
            });
        }

        if (!node.vision) {
            acceptor(context, {
                label: '⚡ vision',
                kind: CompletionItemKind.Snippet,
                insertText: 'vision: "${1:Vision statement}"',
                insertTextFormat: InsertTextFormat.Snippet,
                documentation: '📝 Snippet: Define the strategic vision for this domain',
                sortText: '0_snippet_vision'
            });
        }

        if (!node.type) {
            acceptor(context, {
                label: '⚡ type',
                kind: CompletionItemKind.Snippet,
                insertText: 'type: ${1:Core}',
                insertTextFormat: InsertTextFormat.Snippet,
                documentation: '📝 Snippet: Classify as Core, Supporting, or Generic domain type',
                sortText: '0_snippet_type'
            });
        }
    }

    /**
     * Add completions for ContextMap.
     * Suggests relationship patterns and context references.
     */
    private addContextMapCompletions(
        node: ast.ContextMap,
        acceptor: CompletionAcceptor,
        context: CompletionContext
    ): void {
        // Suggest contains if no contexts yet
        if (node.boundedContexts.length === 0) {
            acceptor(context, {
                label: 'contains',
                kind: CompletionItemKind.Keyword,
                insertText: 'contains ${1:Context1}, ${2:Context2}',
                insertTextFormat: InsertTextFormat.Snippet,
                documentation: 'Add bounded contexts to this map',
                sortText: '0_contains'
            });
        }

        // Always suggest relationship snippet
        acceptor(context, {
            label: 'relationship (simple)',
            kind: CompletionItemKind.Snippet,
            insertText: '${1:Context1} -> ${2:Context2}',
            insertTextFormat: InsertTextFormat.Snippet,
            documentation: 'Add a simple upstream-downstream relationship',
            sortText: '1_relationship_simple'
        });

        acceptor(context, {
            label: 'relationship (with patterns)',
            kind: CompletionItemKind.Snippet,
            insertText: '[${1|OHS,PL,ACL,CF,P,SK|}] ${2:Context1} -> [${3|OHS,PL,ACL,CF,P,SK|}] ${4:Context2}',
            insertTextFormat: InsertTextFormat.Snippet,
            documentation: 'Add a relationship with integration patterns',
            sortText: '1_relationship_patterns'
        });
    }

    /**
     * Add completions for DomainMap.
     * Suggests domain references.
     */
    private addDomainMapCompletions(
        node: ast.DomainMap,
        acceptor: CompletionAcceptor,
        context: CompletionContext
    ): void {
        // Suggest contains if no domains yet
        if (node.domains.length === 0) {
            acceptor(context, {
                label: 'contains',
                kind: CompletionItemKind.Keyword,
                insertText: 'contains ${1:Domain1}, ${2:Domain2}',
                insertTextFormat: InsertTextFormat.Snippet,
                documentation: 'Add domains to this map',
                sortText: '0_contains'
            });
        }
    }

    /**
     * Add completions for relationships.
     * Provides integration patterns and relationship types.
     */
    private addRelationshipCompletions(
        acceptor: CompletionAcceptor,
        context: CompletionContext
    ): void {
        // Integration pattern completions
        const patterns = [
            { label: 'OHS (Open Host Service)', insertText: '[OHS]', doc: 'Open Host Service pattern' },
            { label: 'PL (Published Language)', insertText: '[PL]', doc: 'Published Language pattern' },
            { label: 'ACL (Anti-Corruption Layer)', insertText: '[ACL]', doc: 'Anti-Corruption Layer pattern' },
            { label: 'CF (Conformist)', insertText: '[CF]', doc: 'Conformist pattern' },
            { label: 'P (Partnership)', insertText: '[P]', doc: 'Partnership pattern' },
            { label: 'SK (Shared Kernel)', insertText: '[SK]', doc: 'Shared Kernel pattern' }
        ];

        for (const pattern of patterns) {
            acceptor(context, {
                label: pattern.label,
                kind: CompletionItemKind.EnumMember,
                insertText: pattern.insertText,
                documentation: pattern.doc,
                sortText: `0_${pattern.label}`
            });
        }

        // Relationship arrow completions
        const arrows = [
            { label: '->', doc: 'Upstream to downstream' },
            { label: '<-', doc: 'Downstream to upstream' },
            { label: '<->', doc: 'Bidirectional/Partnership' },
            { label: '><', doc: 'Separate Ways' }
        ];

        for (const arrow of arrows) {
            acceptor(context, {
                label: arrow.label,
                kind: CompletionItemKind.Operator,
                insertText: arrow.label,
                documentation: arrow.doc,
                sortText: `1_${arrow.label}`
            });
        }
    }
}
