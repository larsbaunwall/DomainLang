import type { ValidationAcceptor } from 'langium';
import type { GroupDeclaration } from '../../generated/ast.js';

function noopValidation(group: GroupDeclaration, accept: ValidationAcceptor): void {
    // TODO: Implement group validation logic
}

export const groupChecks = [noopValidation]; 