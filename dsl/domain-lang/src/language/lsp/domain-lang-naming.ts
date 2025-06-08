/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

// domain-lang-naming.ts
// Provides utilities for generating fully qualified names (FQN) for domain language elements, supporting nested groups and disambiguation.

import type { Container, GroupDeclaration } from '../generated/ast.js';
import { isModel, isGroupDeclaration } from '../generated/ast.js';

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
 * Recursively computes the fully qualified name for a child element within nested groups.
 * @param group - The current group declaration
 * @param childName - The name of the child element
 * @returns The fully qualified name as a string
 */
export function toQualifiedName(group: GroupDeclaration, childName: string): string {
    return isGroupDeclaration(group.$container)
        ? joinQualifiedName(toQualifiedName(group.$container, group.name), childName)
        : joinQualifiedName(group.name, childName);
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
    getQualifiedName(qualifier: Container | string, name: string): string {
        let prefix = isModel(qualifier) ? '' : qualifier;
        if (isGroupDeclaration(prefix)) {
            prefix = isGroupDeclaration(prefix.$container)
                ? this.getQualifiedName(prefix.$container, prefix.name)
                : prefix.name;
        }
        return prefix ? `${prefix}.${name}` : name;
    }
}