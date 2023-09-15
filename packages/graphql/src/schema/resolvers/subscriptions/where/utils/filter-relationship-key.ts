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

import type { ConcreteEntityAdapter } from "../../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { InterfaceEntityAdapter } from "../../../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { UnionEntityAdapter } from "../../../../../schema-model/entity/model-adapters/UnionEntityAdapter";
import type { RelationshipAdapter } from "../../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { Node, RelationField, RelationshipSubscriptionsEvent } from "../../../../../types";
import type { ObjectFields } from "../../../../get-obj-field-meta";
import type { InterfaceType, RecordType, RelationshipType, StandardType, UnionType } from "../../types";
import { filterByProperties, filterByProperties2 } from "../filters/filter-by-properties";
import {
    isInterfaceSpecificFieldType,
    isInterfaceType,
    isInterfaceType2,
    isStandardType,
    isStandardType2,
} from "./type-checks";

type EventProperties = {
    from: Record<string, unknown>;
    to: Record<string, unknown>;
    relationship: Record<string, unknown>;
};

export function filterRelationshipKey({
    receivedEventRelationship,
    where,
    relationshipFields,
    receivedEvent,
    nodes,
}: {
    receivedEventRelationship: RelationField;
    where: RecordType | Record<string, RelationshipType | RecordType> | Record<string, RecordType>[];
    relationshipFields: Map<string, ObjectFields>;
    receivedEvent: RelationshipSubscriptionsEvent;
    nodes: Node[];
}): boolean {
    const receivedEventProperties = receivedEvent.properties;
    const receivedEventRelationshipName = receivedEventRelationship.fieldName;
    const receivedEventRelationshipData = where[receivedEventRelationshipName] as Record<string, RelationshipType>;
    const isRelationshipOfReceivedTypeFilteredOut = !receivedEventRelationshipData;
    if (isRelationshipOfReceivedTypeFilteredOut) {
        // case `actors: {}` filtering out relationships of other type
        return false;
    }
    const isRelationshipOfReceivedTypeIncludedWithNoFilters = !Object.keys(receivedEventRelationshipData).length;
    if (isRelationshipOfReceivedTypeIncludedWithNoFilters) {
        // case `actors: {}` including all relationships of the type
        return true;
    }
    const relationshipPropertiesInterfaceName = receivedEventRelationship.properties || "";

    const { edge: edgeProperty, node: nodeProperty, ...unionTypes } = receivedEventRelationshipData;

    // relationship properties
    if (edgeProperty) {
        // apply the filter
        if (
            !filterRelationshipEdgeProperty({
                relationshipFields,
                relationshipPropertiesInterfaceName,
                edgeProperty,
                receivedEventProperties,
            })
        ) {
            return false;
        }
    }

    const key = receivedEventRelationship.direction === "IN" ? "from" : "to";

    const isSimpleRelationship = nodeProperty && isStandardType(nodeProperty, receivedEventRelationship);
    const isInterfaceRelationship = nodeProperty && isInterfaceType(nodeProperty, receivedEventRelationship);
    const isUnionRelationship = Object.keys(unionTypes).length;

    if (isSimpleRelationship) {
        const nodeTo = nodes.find((n) => n.name === receivedEventRelationship.typeMeta.name) as Node;

        // apply the filter
        if (
            !filterByProperties({
                node: nodeTo,
                whereProperties: nodeProperty,
                receivedProperties: receivedEventProperties[key],
            })
        ) {
            return false;
        }
    }

    if (isInterfaceRelationship) {
        const targetNodeTypename = receivedEvent[`${key}Typename`];

        // apply the filter
        if (
            !filterRelationshipInterfaceProperty({
                nodeProperty,
                nodes,
                receivedEventProperties,
                targetNodeTypename,
                key,
            })
        ) {
            return false;
        }
    }

    if (isUnionRelationship) {
        const targetNodeTypename = receivedEvent[`${key}Typename`];
        const targetNodePropsByTypename = unionTypes[targetNodeTypename] as Record<string, UnionType>;
        const isRelationshipOfReceivedTypeFilteredOut = !targetNodePropsByTypename;
        if (isRelationshipOfReceivedTypeFilteredOut) {
            return false;
        }

        // apply the filter
        if (
            !filterRelationshipUnionProperties({
                targetNodePropsByTypename,
                targetNodeTypename,
                receivedEventProperties,
                relationshipFields,
                relationshipPropertiesInterfaceName,
                key,
                nodes,
            })
        ) {
            return false;
        }
    }
    return true;
}
export function filterRelationshipKey2({
    receivedEventRelationship,
    where,
    receivedEvent,
}: {
    receivedEventRelationship: RelationshipAdapter;
    where: RecordType | Record<string, RelationshipType | RecordType> | Record<string, RecordType>[];
    receivedEvent: RelationshipSubscriptionsEvent;
}): boolean {
    const receivedEventProperties = receivedEvent.properties;
    const receivedEventRelationshipName = receivedEventRelationship.name;
    const receivedEventRelationshipData = where[receivedEventRelationshipName] as Record<string, RelationshipType>;
    const isRelationshipOfReceivedTypeFilteredOut = !receivedEventRelationshipData;
    if (isRelationshipOfReceivedTypeFilteredOut) {
        // case `actors: {}` filtering out relationships of other type
        return false;
    }
    const isRelationshipOfReceivedTypeIncludedWithNoFilters = !Object.keys(receivedEventRelationshipData).length;
    if (isRelationshipOfReceivedTypeIncludedWithNoFilters) {
        // case `actors: {}` including all relationships of the type
        return true;
    }

    const { edge: edgeProperty, node: nodeProperty, ...unionTypes } = receivedEventRelationshipData;

    // relationship properties
    if (edgeProperty) {
        // apply the filter
        if (
            !filterRelationshipEdgeProperty2({
                relationshipAdapter: receivedEventRelationship,
                edgeProperty,
                receivedEventProperties,
            })
        ) {
            return false;
        }
    }

    const key = receivedEventRelationship.direction === "IN" ? "from" : "to";

    const isSimpleRelationship = nodeProperty && isStandardType2(nodeProperty, receivedEventRelationship);
    const isInterfaceRelationship = nodeProperty && isInterfaceType2(nodeProperty, receivedEventRelationship);
    const isUnionRelationship = Object.keys(unionTypes).length;

    if (isSimpleRelationship) {
        // const nodeTo = nodes.find((n) => n.name === receivedEventRelationship.typeMeta.name) as Node;
        const nodeTo = receivedEventRelationship.target as ConcreteEntityAdapter; //TODO: fix ts. Should be concreteEntity since isSimpleRelationship right??

        // apply the filter
        if (
            !filterByProperties2({
                attributes: nodeTo.attributes,
                whereProperties: nodeProperty,
                receivedProperties: receivedEventProperties[key],
            })
        ) {
            return false;
        }
    }

    if (isInterfaceRelationship) {
        const targetNodeTypename = receivedEvent[`${key}Typename`];

        // apply the filter
        if (
            !filterRelationshipInterfaceProperty2({
                nodeProperty,
                relationshipAdapter: receivedEventRelationship,
                receivedEventProperties,
                targetNodeTypename,
                key,
            })
        ) {
            return false;
        }
    }

    if (isUnionRelationship) {
        const targetNodeTypename = receivedEvent[`${key}Typename`];
        const targetNodePropsByTypename = unionTypes[targetNodeTypename] as Record<string, UnionType>;
        const isRelationshipOfReceivedTypeFilteredOut = !targetNodePropsByTypename;
        if (isRelationshipOfReceivedTypeFilteredOut) {
            return false;
        }

        // apply the filter
        if (
            !filterRelationshipUnionProperties2({
                targetNodePropsByTypename,
                targetNodeTypename,
                receivedEventProperties,
                relationshipAdapter: receivedEventRelationship,
                key,
            })
        ) {
            return false;
        }
    }
    return true;
}

function filterRelationshipUnionProperties({
    targetNodePropsByTypename,
    targetNodeTypename,
    receivedEventProperties,
    relationshipFields,
    relationshipPropertiesInterfaceName,
    key,
    nodes,
}: {
    targetNodePropsByTypename: Record<string, UnionType>;
    targetNodeTypename: string;
    receivedEventProperties: EventProperties;
    relationshipFields: Map<string, ObjectFields>;
    relationshipPropertiesInterfaceName: string;
    key: string;
    nodes: Node[];
}): boolean {
    for (const [propertyName, propertyValueAsUnionTypeData] of Object.entries(targetNodePropsByTypename)) {
        if (propertyName === "node") {
            const nodeTo = nodes.find((n) => targetNodeTypename === n.name) as Node;
            if (
                !filterByProperties({
                    node: nodeTo,
                    whereProperties: propertyValueAsUnionTypeData,
                    receivedProperties: receivedEventProperties[key],
                })
            ) {
                return false;
            }
        }
        if (
            propertyName === "edge" &&
            !filterRelationshipEdgeProperty({
                relationshipFields,
                relationshipPropertiesInterfaceName,
                edgeProperty: propertyValueAsUnionTypeData,
                receivedEventProperties,
            })
        ) {
            return false;
        }
    }
    return true;
}
function filterRelationshipUnionProperties2({
    targetNodePropsByTypename,
    targetNodeTypename,
    receivedEventProperties,
    relationshipAdapter,
    key,
}: {
    targetNodePropsByTypename: Record<string, UnionType>;
    targetNodeTypename: string;
    receivedEventProperties: EventProperties;
    relationshipAdapter: RelationshipAdapter;
    key: string;
}): boolean {
    for (const [propertyName, propertyValueAsUnionTypeData] of Object.entries(targetNodePropsByTypename)) {
        if (propertyName === "node") {
            const unionTarget = relationshipAdapter.target;
            if (!(unionTarget instanceof UnionEntityAdapter)) {
                throw new Error(`Expected ${unionTarget.name} to be union`);
            }
            const nodeTo = unionTarget.concreteEntities.find((e) => e.name === targetNodeTypename);
            if (!nodeTo) {
                throw new Error(`${targetNodeTypename} not found as part of union ${unionTarget.name}`);
            }
            if (
                !filterByProperties2({
                    attributes: nodeTo.attributes,
                    whereProperties: propertyValueAsUnionTypeData,
                    receivedProperties: receivedEventProperties[key],
                })
            ) {
                return false;
            }
        }
        if (
            propertyName === "edge" &&
            !filterRelationshipEdgeProperty2({
                relationshipAdapter,
                edgeProperty: propertyValueAsUnionTypeData,
                receivedEventProperties,
            })
        ) {
            return false;
        }
    }
    return true;
}

function filterRelationshipInterfaceProperty({
    nodeProperty,
    nodes,
    receivedEventProperties,
    targetNodeTypename,
    key,
}: {
    nodeProperty: InterfaceType;
    nodes: Node[];
    receivedEventProperties: EventProperties;
    targetNodeTypename: string;
    key: string;
}): boolean {
    const { _on, ...commonFields } = nodeProperty;
    const targetNode = nodes.find((n) => n.name === targetNodeTypename) as Node;
    if (commonFields && !_on) {
        if (
            !filterByProperties({
                node: targetNode,
                whereProperties: commonFields,
                receivedProperties: receivedEventProperties[key],
            })
        ) {
            return false;
        }
    }
    if (isInterfaceSpecificFieldType(_on)) {
        const isRelationshipOfReceivedTypeFilteredOut = !_on[targetNodeTypename];
        if (isRelationshipOfReceivedTypeFilteredOut) {
            return false;
        }
        const commonFieldsMergedWithSpecificFields = { ...commonFields, ..._on[targetNodeTypename] }; //override common <fields, filter> combination with specific <fields, filter>

        if (
            !filterByProperties({
                node: targetNode,
                whereProperties: commonFieldsMergedWithSpecificFields,
                receivedProperties: receivedEventProperties[key],
            })
        ) {
            return false;
        }
    }
    return true;
}
function filterRelationshipInterfaceProperty2({
    nodeProperty,
    relationshipAdapter,
    receivedEventProperties,
    targetNodeTypename,
    key,
}: {
    nodeProperty: InterfaceType;
    relationshipAdapter: RelationshipAdapter;
    receivedEventProperties: EventProperties;
    targetNodeTypename: string;
    key: string;
}): boolean {
    const { _on, ...commonFields } = nodeProperty;
    const targetNode = relationshipAdapter.target;
    if (!(targetNode instanceof InterfaceEntityAdapter)) {
        throw new Error(`Expected ${targetNode.name} to be interface`);
    }
    const nodeTo = targetNode.concreteEntities.find((e) => e.name === targetNodeTypename);
    if (!nodeTo) {
        throw new Error(`${targetNodeTypename} not found as part of interface ${targetNode.name}`);
    }
    // const targetNode = nodes.find((n) => n.name === targetNodeTypename) as Node;
    if (commonFields && !_on) {
        if (
            !filterByProperties2({
                attributes: nodeTo.attributes,
                whereProperties: commonFields,
                receivedProperties: receivedEventProperties[key],
            })
        ) {
            return false;
        }
    }
    if (isInterfaceSpecificFieldType(_on)) {
        const isRelationshipOfReceivedTypeFilteredOut = !_on[targetNodeTypename];
        if (isRelationshipOfReceivedTypeFilteredOut) {
            return false;
        }
        const commonFieldsMergedWithSpecificFields = { ...commonFields, ..._on[targetNodeTypename] }; //override common <fields, filter> combination with specific <fields, filter>

        if (
            !filterByProperties2({
                attributes: nodeTo.attributes,
                whereProperties: commonFieldsMergedWithSpecificFields,
                receivedProperties: receivedEventProperties[key],
            })
        ) {
            return false;
        }
    }
    return true;
}

function filterRelationshipEdgeProperty({
    relationshipFields,
    relationshipPropertiesInterfaceName,
    edgeProperty,
    receivedEventProperties,
}: {
    relationshipFields: Map<string, ObjectFields>;
    relationshipPropertiesInterfaceName: string;
    edgeProperty: StandardType;
    receivedEventProperties: EventProperties;
}): boolean {
    const relationship = relationshipFields.get(relationshipPropertiesInterfaceName);
    const noRelationshipPropertiesFound = !relationship;
    if (noRelationshipPropertiesFound) {
        return true;
    }
    return filterByProperties({
        node: relationship as Node,
        whereProperties: edgeProperty,
        receivedProperties: receivedEventProperties.relationship,
    });
}
function filterRelationshipEdgeProperty2({
    relationshipAdapter,
    edgeProperty,
    receivedEventProperties,
}: {
    relationshipAdapter: RelationshipAdapter;
    edgeProperty: StandardType;
    receivedEventProperties: EventProperties;
}): boolean {
    const noRelationshipPropertiesFound = !relationshipAdapter.attributes.size;
    if (noRelationshipPropertiesFound) {
        return true;
    }
    return filterByProperties2({
        attributes: relationshipAdapter.attributes,
        whereProperties: edgeProperty,
        receivedProperties: receivedEventProperties.relationship,
    });
}
