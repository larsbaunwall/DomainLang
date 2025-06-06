import type { ValidationAcceptor } from 'langium';
import type { Classification } from '../../generated/ast.js';

function noopValidation(classification: Classification, accept: ValidationAcceptor): void {
    // TODO: Implement classification validation logic
}

export const classificationChecks = [noopValidation]; 