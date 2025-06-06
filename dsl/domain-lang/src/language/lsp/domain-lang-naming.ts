/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import type { Container, GroupDeclaration } from '../generated/ast.js';
import { isModel, isGroupDeclaration } from '../generated/ast.js';

export function toQualifiedName(group: GroupDeclaration, childName: string): string {
    return (isGroupDeclaration(group.$container) ? toQualifiedName(group.$container, group.name) : group.name) + '.' + childName;
}

export class QualifiedNameProvider {

    /**
     * @param qualifier if the qualifier is a `string`, simple string concatenation is done: `qualifier.name`.
     *      if the qualifier is a `GroupDeclaration` fully qualified name is created: `group1.group2.name`.
     * @param name simple name
     * @returns qualified name separated by `.`
     */
    getQualifiedName(qualifier: Container | string, name: string): string {
        let prefix = isModel(qualifier) ? '' : qualifier;
        if (isGroupDeclaration(prefix)) {
            prefix = (isGroupDeclaration(prefix.$container)
                ? this.getQualifiedName(prefix.$container, prefix.name) : prefix.name);
        }
        return prefix ? prefix + '.' + name : name;
    }

}