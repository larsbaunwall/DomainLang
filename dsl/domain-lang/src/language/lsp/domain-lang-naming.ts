/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

// domain-lang-naming.ts
// Provides utilities for generating fully qualified names (FQN) for domain language elements, supporting nested groups and disambiguation.

import type { Model } from '../generated/ast.js';
import { isModel } from '../generated/ast.js';

/**
 * Joins parent and child names into a fully qualified name, using '.' as a separator.
 * Ensures no leading or trailing dots and supports arbitrary nesting.
 * @param parent - The parent name or empty string
 * @param child - The child name
 * @returns The fully qualified name
 */
export function joinQualifiedName(parent: string, child: string): string {
    return parent ? `${parent}.${child}` : child;
}

/**
 * Provides qualified name computation for domain language elements, supporting nested groups and models.
 * Used for FQN disambiguation and reference resolution.
 */
export class QualifiedNameProvider {
    /**
     * Computes the qualified name for a given qualifier and name.
     * @param qualifier - The parent container (Model, GroupDeclaration, or string)
     * @param name - The simple name of the element
     * @returns The fully qualified name as a string
     */
    getQualifiedName(qualifier: Model | string, name: string): string {
        let prefix = isModel(qualifier) ? '' : qualifier;
        return prefix ? `${prefix}.${name}` : name;
    }
}