import type { ValidationCheck } from 'langium';
import type { GroupDeclaration } from '../generated/ast.js';

// No validation checks needed for groups currently
export const groupChecks: ValidationCheck<GroupDeclaration>[] = []; 