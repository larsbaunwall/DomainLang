/**
 * Custom completion provider for DomainLang.
 * 
 * Provides intelligent code completion with:
 * - DDD-friendly snippets for common patterns
 * - Context-aware suggestions
 * - Both simple and advanced syntax templates
 */

import { CompletionAcceptor, CompletionContext, DefaultCompletionProvider, NextFeature } from 'langium/lsp';
import { CompletionItemKind, InsertTextFormat } from 'vscode-languageserver';

export class DomainLangCompletionProvider extends DefaultCompletionProvider {
    
    protected override completionFor(
        context: CompletionContext,
        next: NextFeature,
        acceptor: CompletionAcceptor
    ): void {
        
        // Add snippets based on context
        if (context.tokenEndOffset === 0 || this.isAtTopLevel(context)) {
            this.addTopLevelSnippets(acceptor, context);
        }
        
        // Call super to get default completions
        super.completionFor(context, next, acceptor);
    }
    
    private isAtTopLevel(context: CompletionContext): boolean {
        // Check if we're at the model/group level
        const node = context.node;
        return node?.$type === 'Model' || node?.$type === 'GroupDeclaration' || node?.$type === 'PackageDeclaration';
    }
    
    private addTopLevelSnippets(acceptor: CompletionAcceptor, context: CompletionContext): void {
        // Bounded Context snippets
        acceptor(context, {
            label: 'BC (simple)',
            kind: CompletionItemKind.Snippet,
            insertText: 'BC ${1:Name} for ${2:Domain} as ${3:Core} by ${4:Team}',
            insertTextFormat: InsertTextFormat.Snippet,
            documentation: 'Quick bounded context definition',
            detail: 'Inline bounded context with domain, role, and team'
        });
        
        acceptor(context, {
            label: 'BoundedContext (detailed)',
            kind: CompletionItemKind.Snippet,
            insertText: [
                'BoundedContext ${1:Name} implements ${2:Domain} {',
                '\tdescription: "${3:Description}"',
                '\tteam: ${4:Team}',
                '\trole: ${5:Core}',
                '\t',
                '\tlanguage {',
                '\t\tterm ${6:Term}: "${7:Definition}"',
                '\t}',
                '}',
                ''].join('\n'),
            insertTextFormat: InsertTextFormat.Snippet,
            documentation: 'Detailed bounded context with terminology',
            detail: 'Full bounded context with all common blocks'
        });
        
        acceptor(context, {
            label: 'Context (medium)',
            kind: CompletionItemKind.Snippet,
            insertText: [
                'Context ${1:Name} for ${2:Domain} {',
                '\tdescription: "${3:Description}"',
                '\tteam: ${4:Team}',
                '\trole: ${5:Core}',
                '}',
                ''].join('\n'),
            insertTextFormat: InsertTextFormat.Snippet,
            documentation: 'Medium-detail context definition',
            detail: 'Context with description, team, and role'
        });
        
        // Domain snippets
        acceptor(context, {
            label: 'Domain (simple)',
            kind: CompletionItemKind.Snippet,
            insertText: 'Domain ${1:Name}',
            insertTextFormat: InsertTextFormat.Snippet,
            documentation: 'Simple domain declaration',
            detail: 'Just a domain name'
        });
        
        acceptor(context, {
            label: 'Domain (detailed)',
            kind: CompletionItemKind.Snippet,
            insertText: [
                'Domain ${1:Name} {',
                '\tdescription: "${2:Description}"',
                '\tvision: "${3:Vision}"',
                '\tclassifier: ${4:Strategic}',
                '}',
                ''].join('\n'),
            insertTextFormat: InsertTextFormat.Snippet,
            documentation: 'Detailed domain with description and vision',
            detail: 'Full domain declaration'
        });
        
        // Package snippet
        acceptor(context, {
            label: 'package',
            kind: CompletionItemKind.Snippet,
            insertText: [
                'package ${1:namespace} {',
                '\t$0',
                '}',
                ''].join('\n'),
            insertTextFormat: InsertTextFormat.Snippet,
            documentation: 'Package declaration for namespace organization',
            detail: 'Create a namespace package'
        });
        
        // ContextGroup snippet
        acceptor(context, {
            label: 'ContextGroup',
            kind: CompletionItemKind.Snippet,
            insertText: [
                'ContextGroup ${1:Name} for ${2:Domain} {',
                '\trole: ${3:Core}',
                '\tcontains ${4:Context1}, ${5:Context2}',
                '}',
                ''].join('\n'),
            insertTextFormat: InsertTextFormat.Snippet,
            documentation: 'Group contexts by strategic role',
            detail: 'Organize related bounded contexts'
        });
        
        // ContextMap snippet
        acceptor(context, {
            label: 'ContextMap',
            kind: CompletionItemKind.Snippet,
            insertText: [
                'ContextMap ${1:Name} {',
                '\tcontains ${2:Context1}, ${3:Context2}',
                '\t',
                '\t${4:Context1} ${5|<->,->|} ${6:Context2}',
                '}',
                ''].join('\n'),
            insertTextFormat: InsertTextFormat.Snippet,
            documentation: 'Map relationships between bounded contexts',
            detail: 'Create a context map with relationships'
        });
        
        // Relationship patterns
        acceptor(context, {
            label: 'relationship (upstream/downstream)',
            kind: CompletionItemKind.Snippet,
            insertText: '${1:Upstream} U/D ${2:Downstream}',
            insertTextFormat: InsertTextFormat.Snippet,
            documentation: 'Upstream/Downstream relationship',
            detail: 'U/D pattern - upstream influences downstream'
        });
        
        acceptor(context, {
            label: 'relationship (customer/supplier)',
            kind: CompletionItemKind.Snippet,
            insertText: '[${1|PL,ACL,CF|}] ${2:Customer} C/S ${3:Supplier}',
            insertTextFormat: InsertTextFormat.Snippet,
            documentation: 'Customer/Supplier relationship with pattern',
            detail: 'C/S pattern with integration role'
        });
        
        acceptor(context, {
            label: 'relationship (partnership)',
            kind: CompletionItemKind.Snippet,
            insertText: '${1:Context1} <-> ${2:Context2} : Partnership',
            insertTextFormat: InsertTextFormat.Snippet,
            documentation: 'Partnership relationship',
            detail: 'Equal partnership between contexts'
        });
        
        // Classifications
        acceptor(context, {
            label: 'Classification',
            kind: CompletionItemKind.Snippet,
            insertText: 'Classification ${1|Core,Supporting,Generic,Strategic|}',
            insertTextFormat: InsertTextFormat.Snippet,
            documentation: 'Define a classification for categorizing domains/contexts',
            detail: 'Common DDD classifications'
        });
        
        // Team
        acceptor(context, {
            label: 'Team',
            kind: CompletionItemKind.Snippet,
            insertText: 'Team ${1:TeamName}',
            insertTextFormat: InsertTextFormat.Snippet,
            documentation: 'Define a team responsible for contexts',
            detail: 'Team declaration'
        });
        
        // Import patterns
        acceptor(context, {
            label: 'import (file)',
            kind: CompletionItemKind.Snippet,
            insertText: 'import "${1:path/to/file.dlang}" as ${2:Alias}',
            insertTextFormat: InsertTextFormat.Snippet,
            documentation: 'Import from a file',
            detail: 'File-based import with alias'
        });
        
        acceptor(context, {
            label: 'import (package)',
            kind: CompletionItemKind.Snippet,
            insertText: 'import ${1:package.name}.*',
            insertTextFormat: InsertTextFormat.Snippet,
            documentation: 'Import all from a package',
            detail: 'Package wildcard import'
        });
        
        acceptor(context, {
            label: 'import (named)',
            kind: CompletionItemKind.Snippet,
            insertText: 'import { ${1:Symbol1}, ${2:Symbol2} } from ${3:package.name}',
            insertTextFormat: InsertTextFormat.Snippet,
            documentation: 'Import specific symbols from a package',
            detail: 'Named imports'
        });
    }
}
