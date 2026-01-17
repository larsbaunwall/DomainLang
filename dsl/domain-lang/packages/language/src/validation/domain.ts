import type { ValidationAcceptor } from 'langium';
import type { Domain } from '../generated/ast.js';
import { ValidationMessages, buildCodeDescription } from './constants.js';

/**
 * Validates that a domain has a vision statement.
 * 
 * @param domain - The domain to validate
 * @param accept - The validation acceptor for reporting issues
 */
function validateDomainHasVision(
    domain: Domain, 
    accept: ValidationAcceptor
): void {
    if (!domain.vision) {
        accept('warning', ValidationMessages.DOMAIN_NO_VISION(domain.name), { 
            node: domain,
            keyword: 'Domain',
            codeDescription: buildCodeDescription('language.md', 'domain-vision')
        });
    }
}

export const domainChecks = [validateDomainHasVision]; 