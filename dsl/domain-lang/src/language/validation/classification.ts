import type { ValidationCheck } from 'langium';
import type { Classification } from '../generated/ast.js';

// No validation checks needed for classifications currently
export const classificationChecks: ValidationCheck<Classification>[] = []; 