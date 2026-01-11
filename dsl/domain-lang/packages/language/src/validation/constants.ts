/**
 * Validation message constants for DomainLang.
 * 
 * Centralizes all validation messages to ensure consistency
 * and facilitate internationalization in the future.
 */
export const ValidationMessages = {
    /**
     * Warning message when a domain lacks a vision statement.
     * @param name - The name of the domain
     */
    DOMAIN_NO_VISION: (name: string) => 
        `Domain '${name}' has no domain vision. Consider adding one.`,
    
    /**
     * Warning message when a bounded context lacks a description.
     * @param name - The name of the bounded context
     */
    BOUNDED_CONTEXT_NO_DESCRIPTION: (name: string) => 
        `Bounded Context '${name}' has no description`,
    
    /**
     * Warning when role is specified both inline and in a block.
     * Inline value takes precedence.
     * @param bcName - The name of the bounded context
     * @param inlineRole - The inline role name (from 'as')
     * @param blockRole - The block role name (from 'role:' or classifications block)
     */
    BOUNDED_CONTEXT_ROLE_CONFLICT: (bcName: string, inlineRole?: string, blockRole?: string) =>
        `Role specified both inline${inlineRole ? ` ('as ${inlineRole}')` : ''} and in block${blockRole ? ` ('role: ${blockRole}')` : ''}. Inline value takes precedence. Consider using only one form for clarity.`,
    
    /**
     * Warning when team is specified both inline and in a block.
     * Inline value takes precedence.
     * @param bcName - The name of the bounded context
     * @param inlineTeam - The inline team name (from 'by')
     * @param blockTeam - The block team name (from 'team:')
     */
    BOUNDED_CONTEXT_TEAM_CONFLICT: (bcName: string, inlineTeam?: string, blockTeam?: string) =>
        `Team specified both inline${inlineTeam ? ` ('by ${inlineTeam}')` : ''} and in block${blockTeam ? ` ('team: ${blockTeam}')` : ''}. Inline value takes precedence. Consider using only one form for clarity.`,
    
    /**
     * Error message when an element is defined multiple times.
     * @param fqn - The fully qualified name of the duplicate element
     */
    DUPLICATE_ELEMENT: (fqn: string) => 
        `This element is already defined elsewhere: '${fqn}'`
} as const;
