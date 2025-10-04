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
     * Error message when an element is defined multiple times.
     * @param fqn - The fully qualified name of the duplicate element
     */
    DUPLICATE_ELEMENT: (fqn: string) => 
        `This element is already defined elsewhere: '${fqn}'`,
    
    /**
     * Warning message when a context group has no contexts.
     * @param name - The name of the context group
     */
    CONTEXT_GROUP_NO_CONTEXTS: (name: string) =>
        `ContextGroup '${name}' contains no bounded contexts. Consider adding at least one.`,
    
    /**
     * Error message when a context group has an invalid role classifier reference.
     * @param name - The name of the context group
     */
    CONTEXT_GROUP_INVALID_ROLE: (name: string) =>
        `ContextGroup '${name}' has an invalid role classifier reference.`
} as const;
