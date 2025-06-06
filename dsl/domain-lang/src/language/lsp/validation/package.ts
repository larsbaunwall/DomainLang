import type { ValidationAcceptor } from 'langium';
import type { PackageDeclaration } from '../../generated/ast.js';

function noopValidation(pkg: PackageDeclaration, accept: ValidationAcceptor): void {
    // TODO: Implement package validation logic
}

export const packageChecks = [noopValidation]; 