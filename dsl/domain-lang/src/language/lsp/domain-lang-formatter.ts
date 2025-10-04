import type { AstNode } from "langium";
import { AbstractFormatter, Formatting } from "langium/lsp";
import * as ast from '../generated/ast.js';

/**
 * Provides formatting for DomainLang documents.
 * Handles indentation and newlines for block-based constructs.
 */
export class DomainLangFormatter extends AbstractFormatter {

    protected format(node: AstNode): void {
        // Group declarations
        if (ast.isGroupDeclaration(node)) {
            this.formatBlock(node);
        }
        
        // Domain declarations
        if (ast.isDomain(node)) {
            this.formatBlock(node);
        }
        
        // Bounded contexts
        if (ast.isBoundedContext(node)) {
            this.formatBlock(node);
        }
        
        // Context maps
        if (ast.isContextMap(node)) {
            this.formatBlock(node);
        }
        
        // Domain maps
        if (ast.isDomainMap(node)) {
            this.formatBlock(node);
        }
    }
    
    /**
     * Formats a block node with standard indentation and newlines.
     * 
     * @param node - The AST node to format
     */
    private formatBlock(node: AstNode): void {
        const formatter = this.getNodeFormatter(node);
        const open = formatter.keyword('{');
        const close = formatter.keyword('}');
        
        formatter.interior(open, close).prepend(Formatting.indent());
        close.prepend(Formatting.newLine());
    }
}