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

import type { DirectiveNode } from "graphql";
import { StringMappingType } from "typescript";
import { DEPRECATED } from "../constants";
import { Attribute } from "../schema-model/attribute/Attribute";
import { AttributeAdapter } from "../schema-model/attribute/model-adapters/AttributeAdapter";
import type { ConcreteEntityAdapter } from "../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "../schema-model/relationship/model-adapters/RelationshipAdapter";
import type {
    CustomEnumField,
    CustomScalarField,
    Neo4jFeaturesSettings,
    PointField,
    PrimitiveField,
    TemporalField,
} from "../types";
import { DEPRECATE_NOT } from "./constants";
import { graphqlDirectivesToCompose } from "./to-compose";

interface Fields {
    scalarFields: CustomScalarField[];
    enumFields: CustomEnumField[];
    primitiveFields: PrimitiveField[];
    temporalFields: TemporalField[];
    pointFields: PointField[];
}

function getWhereFields({
    typeName,
    fields,
    isInterface,
    features,
}: {
    typeName: string;
    fields: Fields;
    isInterface?: boolean;
    features?: Neo4jFeaturesSettings;
}) {
    return {
        ...(isInterface ? {} : { OR: `[${typeName}Where!]`, AND: `[${typeName}Where!]`, NOT: `${typeName}Where` }),
        ...[
            ...fields.primitiveFields,
            ...fields.temporalFields,
            ...fields.enumFields,
            ...fields.pointFields,
            ...fields.scalarFields,
        ].reduce((res, f) => {
            if (f.filterableOptions.byValue === false) {
                return res;
            }

            const deprecatedDirectives = graphqlDirectivesToCompose(
                f.otherDirectives.filter((directive) => directive.name.value === DEPRECATED)
            );

            res[f.fieldName] = {
                type: f.typeMeta.input.where.pretty,
                directives: deprecatedDirectives,
            };
            res[`${f.fieldName}_NOT`] = {
                type: f.typeMeta.input.where.pretty,
                directives: deprecatedDirectives.length ? deprecatedDirectives : [DEPRECATE_NOT],
            };

            if (f.typeMeta.name === "Boolean") {
                return res;
            }

            if (f.typeMeta.array) {
                res[`${f.fieldName}_INCLUDES`] = {
                    type: f.typeMeta.input.where.type,
                    directives: deprecatedDirectives,
                };
                res[`${f.fieldName}_NOT_INCLUDES`] = {
                    type: f.typeMeta.input.where.type,
                    directives: deprecatedDirectives.length ? deprecatedDirectives : [DEPRECATE_NOT],
                };
                return res;
            }

            res[`${f.fieldName}_IN`] = {
                type: `[${f.typeMeta.input.where.pretty}${f.typeMeta.required ? "!" : ""}]`,
                directives: deprecatedDirectives,
            };
            res[`${f.fieldName}_NOT_IN`] = {
                type: `[${f.typeMeta.input.where.pretty}${f.typeMeta.required ? "!" : ""}]`,
                directives: deprecatedDirectives.length ? deprecatedDirectives : [DEPRECATE_NOT],
            };

            if (
                [
                    "Float",
                    "Int",
                    "BigInt",
                    "DateTime",
                    "Date",
                    "LocalDateTime",
                    "Time",
                    "LocalTime",
                    "Duration",
                ].includes(f.typeMeta.name)
            ) {
                ["_LT", "_LTE", "_GT", "_GTE"].forEach((comparator) => {
                    res[`${f.fieldName}${comparator}`] = { type: f.typeMeta.name, directives: deprecatedDirectives };
                });
                return res;
            }

            if (["Point", "CartesianPoint"].includes(f.typeMeta.name)) {
                ["_DISTANCE", "_LT", "_LTE", "_GT", "_GTE"].forEach((comparator) => {
                    res[`${f.fieldName}${comparator}`] = {
                        type: `${f.typeMeta.name}Distance`,
                        directives: deprecatedDirectives,
                    };
                });
                return res;
            }

            if (["String", "ID"].includes(f.typeMeta.name)) {
                const stringWhereOperators: Array<{ comparator: string; typeName: string }> = [
                    { comparator: "_CONTAINS", typeName: f.typeMeta.name },
                    { comparator: "_STARTS_WITH", typeName: f.typeMeta.name },
                    { comparator: "_ENDS_WITH", typeName: f.typeMeta.name },
                ];

                const stringWhereOperatorsNegate = ["_NOT_CONTAINS", "_NOT_STARTS_WITH", "_NOT_ENDS_WITH"];

                Object.entries(features?.filters?.[f.typeMeta.name] || {}).forEach(([filter, enabled]) => {
                    if (enabled) {
                        if (filter === "MATCHES") {
                            stringWhereOperators.push({ comparator: `_${filter}`, typeName: "String" });
                        } else {
                            stringWhereOperators.push({ comparator: `_${filter}`, typeName: f.typeMeta.name });
                        }
                    }
                });
                stringWhereOperators.forEach(({ comparator, typeName }) => {
                    res[`${f.fieldName}${comparator}`] = { type: typeName, directives: deprecatedDirectives };
                });

                stringWhereOperatorsNegate.forEach((comparator) => {
                    res[`${f.fieldName}${comparator}`] = {
                        type: f.typeMeta.name,
                        directives: deprecatedDirectives.length ? deprecatedDirectives : [DEPRECATE_NOT],
                    };
                });
                return res;
            }

            return res;
        }, {}),
    };
}

export default getWhereFields;

export function getWhereFieldsFromConcreteEntity({
    concreteEntityAdapter,
    userDefinedFieldDirectives,
    features,
}: {
    concreteEntityAdapter: ConcreteEntityAdapter;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    features?: Neo4jFeaturesSettings;
}): Record<string, any> {
    // Add the default where fields
    const result = {
        OR: `[${concreteEntityAdapter.name}Where!]`,
        AND: `[${concreteEntityAdapter.name}Where!]`,
        NOT: `${concreteEntityAdapter.name}Where`,
    };

    const fields = getWhereFieldsForAttributes({
        attributes: Array.from(concreteEntityAdapter.attributes.values()),
        userDefinedFieldDirectives,
        features,
    });

    return { ...result, ...fields };
}

export function getWhereFieldsFromRelationshipProperties({
    relationshipAdapter,
    userDefinedFieldDirectives,
    features,
}: {
    relationshipAdapter: RelationshipAdapter;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    features?: Neo4jFeaturesSettings;
}): Record<string, any> {
    // Add the default where fields
    const result = {
        OR: `[${relationshipAdapter.propertiesTypeName}Where!]`,
        AND: `[${relationshipAdapter.propertiesTypeName}Where!]`,
        NOT: `${relationshipAdapter.propertiesTypeName}Where`,
    };

    const fields = getWhereFieldsForAttributes({
        attributes: Array.from(relationshipAdapter.attributes.values()),
        userDefinedFieldDirectives,
        features,
    });

    return { ...result, ...fields };
}

function getWhereFieldsForAttributes({
    attributes,
    userDefinedFieldDirectives,
    features,
}: {
    attributes: AttributeAdapter[];
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    features?: Neo4jFeaturesSettings;
}): Record<string, string>[] {
    const result: Record<string, string>[] = [];

    // Add the where fields for each attribute
    for (const field of attributes) {
        // If the field is not a where field, skip it
        if (field.isWhereField() === false) {
            continue;
        }

        // If the attribute is not filterable, skip it
        if (field.isFilterable() === false) {
            continue;
        }

        // If the field has a custom resolver, skip it
        if (field.isCustomResolvable()) {
            continue;
        }

        // If the field is a custom cypher field, skip it
        if (field.isCypher()) {
            continue;
        }

        const userDefinedDirectivesOnField = userDefinedFieldDirectives.get(field.name);
        const deprecatedDirectives = graphqlDirectivesToCompose(
            (userDefinedDirectivesOnField || []).filter((directive) => directive.name.value === DEPRECATED)
        );

        result[field.name] = {
            type: field.getInputTypeNames().where.pretty,
            directives: deprecatedDirectives,
        };

        result[`${field.name}_NOT`] = {
            type: field.getInputTypeNames().where.pretty,
            directives: deprecatedDirectives.length ? deprecatedDirectives : [DEPRECATE_NOT],
        };

        // If the field is a boolean, skip it
        // This is done here because the previous additions are still added for boolean fields
        if (field.isBoolean()) {
            continue;
        }

        // If the field is an array, add the includes and not includes fields
        // if (field.isArray()) {
        if (field.isList()) {
            result[`${field.name}_INCLUDES`] = {
                type: field.getInputTypeNames().where.type,
                directives: deprecatedDirectives,
            };
            result[`${field.name}_NOT_INCLUDES`] = {
                type: field.getInputTypeNames().where.type,
                directives: deprecatedDirectives.length ? deprecatedDirectives : [DEPRECATE_NOT],
            };
            continue;
        }

        // If the field is not an array, add the in and not in fields
        result[`${field.name}_IN`] = {
            type: field.getFilterableInputTypeName(),
            directives: deprecatedDirectives,
        };

        result[`${field.name}_NOT_IN`] = {
            type: field.getFilterableInputTypeName(),
            directives: deprecatedDirectives.length ? deprecatedDirectives : [DEPRECATE_NOT],
        };

        // If the field is a number or temporal, add the comparison operators
        if (field.isNumericalOrTemporal()) {
            ["_LT", "_LTE", "_GT", "_GTE"].forEach((comparator) => {
                result[`${field.name}${comparator}`] = {
                    type: field.getInputTypeNames().where.type,
                    directives: deprecatedDirectives,
                };
            });
            continue;
        }

        // If the field is spatial, add the point comparison operators
        if (field.isSpatial()) {
            ["_DISTANCE", "_LT", "_LTE", "_GT", "_GTE"].forEach((comparator) => {
                result[`${field.name}${comparator}`] = {
                    type: `${field.getTypeName()}Distance`,
                    directives: deprecatedDirectives,
                };
            });
            continue;
        }

        // If the field is a string, add the string comparison operators
        if (field.isString() || field.isID()) {
            const stringWhereOperators: Array<{ comparator: string; typeName: string }> = [
                { comparator: "_CONTAINS", typeName: field.getInputTypeNames().where.type },
                { comparator: "_STARTS_WITH", typeName: field.getInputTypeNames().where.type },
                { comparator: "_ENDS_WITH", typeName: field.getInputTypeNames().where.type },
            ];

            Object.entries(features?.filters?.[field.getInputTypeNames().where.type] || {}).forEach(
                ([filter, enabled]) => {
                    if (enabled) {
                        if (filter === "MATCHES") {
                            stringWhereOperators.push({ comparator: `_${filter}`, typeName: "String" });
                        } else {
                            stringWhereOperators.push({
                                comparator: `_${filter}`,
                                typeName: field.getInputTypeNames().where.type,
                            });
                        }
                    }
                }
            );
            stringWhereOperators.forEach(({ comparator, typeName }) => {
                result[`${field.name}${comparator}`] = { type: typeName, directives: deprecatedDirectives };
            });

            ["_NOT_CONTAINS", "_NOT_STARTS_WITH", "_NOT_ENDS_WITH"].forEach((comparator) => {
                result[`${field.name}${comparator}`] = {
                    type: field.getInputTypeNames().where.type,
                    directives: deprecatedDirectives.length ? deprecatedDirectives : [DEPRECATE_NOT],
                };
            });
        }
    }

    return result;
}
