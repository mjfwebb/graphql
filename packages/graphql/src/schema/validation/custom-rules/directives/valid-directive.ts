/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type {
    ASTVisitor,
    DirectiveNode,
    ObjectTypeDefinitionNode,
    EnumTypeDefinitionNode,
    InterfaceTypeDefinitionNode,
    UnionTypeDefinitionNode,
} from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import type { Neo4jGraphQLCallbacks } from "../../../../types";
import { verifyCoalesce } from "./coalesce";
import { verifyDefault } from "./default";
import { verifyFulltext } from "./fulltext";
import { verifyPopulatedBy } from "./populatedBy";
import { verifyQueryOptions } from "./queryOptions";
import { verifyRelationshipArgumentValue } from "./relationship";
import type { ValidationFunction } from "../utils/document-validation-error";
import { createGraphQLError, assertValid } from "../utils/document-validation-error";
import { getPathToNode } from "../utils/path-parser";

function getValidationFunction(
    directiveName: string,
    relationshipTypeToDirectionAndFieldTypeMap: Map<string, [string, string][]>,
    objectTypeToFieldNameDirectionAndFieldTypePerRelationshipTypeMap: Map<
        string,
        Map<string, [string, string, string][]>
    >,
    interfaceToImplementationsMap: Map<string, Set<string>>,
    extra: {
        enums: EnumTypeDefinitionNode[];
        interfaces: InterfaceTypeDefinitionNode[];
        unions: UnionTypeDefinitionNode[];
        objects: ObjectTypeDefinitionNode[];
    },
    callbacks?: Neo4jGraphQLCallbacks
): ValidationFunction | undefined {
    switch (directiveName) {
        case "coalesce":
            return verifyCoalesce(extra.enums);
        case "default":
            return verifyDefault(extra.enums);
        case "fulltext":
            return verifyFulltext;
        case "populatedBy":
            return verifyPopulatedBy(callbacks);
        case "queryOptions":
            return verifyQueryOptions;
        case "relationship":
            return verifyRelationshipArgumentValue(
                objectTypeToFieldNameDirectionAndFieldTypePerRelationshipTypeMap,
                relationshipTypeToDirectionAndFieldTypeMap,
                interfaceToImplementationsMap,
                extra
            );
        default:
            return;
    }
}

function extraDefinitionsProvided(extra: {
    enums?: EnumTypeDefinitionNode[];
    interfaces?: InterfaceTypeDefinitionNode[];
    unions?: UnionTypeDefinitionNode[];
    objects?: ObjectTypeDefinitionNode[];
}): extra is {
    enums: EnumTypeDefinitionNode[];
    interfaces: InterfaceTypeDefinitionNode[];
    unions: UnionTypeDefinitionNode[];
    objects: ObjectTypeDefinitionNode[];
} {
    if (!extra.enums || !extra.interfaces || !extra.unions || !extra.objects) {
        return false;
    }
    return true;
}

export function directiveIsValid(
    extra: {
        enums?: EnumTypeDefinitionNode[];
        interfaces?: InterfaceTypeDefinitionNode[];
        unions?: UnionTypeDefinitionNode[];
        objects?: ObjectTypeDefinitionNode[];
    },
    callbacks?: Neo4jGraphQLCallbacks
) {
    if (!extraDefinitionsProvided(extra)) {
        throw new Error("Missing data.");
    }
    return function (context: SDLValidationContext): ASTVisitor {
        const relationshipTypeToDirectionAndFieldTypeMap = new Map<string, [string, string][]>();
        const objectTypeToFieldNameDirectionAndFieldTypePerRelationshipTypeMap = new Map<
            string,
            Map<string, [string, string, string][]>
        >();
        const interfaceToImplementationsMap = new Map<string, Set<string>>();
        return {
            Directive(directiveNode: DirectiveNode, _key, _parent, path, ancenstors) {
                const validationFn = getValidationFunction(
                    directiveNode.name.value,
                    relationshipTypeToDirectionAndFieldTypeMap,
                    objectTypeToFieldNameDirectionAndFieldTypePerRelationshipTypeMap,
                    interfaceToImplementationsMap,
                    extra,
                    callbacks
                );
                if (!validationFn) {
                    return;
                }

                const [pathToNode, traversedDef, parentOfTraversedDef] = getPathToNode(path, ancenstors);
                const pathToHere = [...pathToNode, `@${directiveNode.name.value}`];

                if (!traversedDef) {
                    console.error("No last definition traversed");
                    return;
                }

                const { isValid, errorMsg, errorPath } = assertValid(
                    validationFn.bind(null, {
                        directiveNode,
                        traversedDef,
                        parentDef: parentOfTraversedDef,
                    })
                );
                if (!isValid) {
                    context.reportError(
                        createGraphQLError({
                            nodes: [directiveNode, traversedDef],
                            path: [...pathToHere, ...errorPath],
                            errorMsg,
                        })
                    );
                }
            },
        };
    };
}
