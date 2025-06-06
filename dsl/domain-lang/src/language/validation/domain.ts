import type { ValidationAcceptor } from 'langium';
import type { Domain, DomainDocumentationBlock } from '../generated/ast.js';

function checkDomain(domain: Domain, accept: ValidationAcceptor): void {
    const hasVision = domain.documentation?.some(
        (block: DomainDocumentationBlock) => block.$type === 'VisionBlock' && block.vision
    );
    if (!hasVision)
        accept('warning', `Domain '${domain.name}' has no domain vision. Consider adding one.`, { node: domain, property: 'documentation' });
}

export const domainChecks = [checkDomain]; 