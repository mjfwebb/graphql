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

import { upperFirst } from "graphql-compose";
import type { Entity } from "../../entity/Entity";
import { ConcreteEntityAdapter } from "../../entity/model-adapters/ConcreteEntityAdapter";
import type { NestedOperation, QueryDirection, Relationship, RelationshipDirection } from "../Relationship";
import { AttributeAdapter } from "../../attribute/model-adapters/AttributeAdapter";
import type { Attribute } from "../../attribute/Attribute";
import { ConcreteEntity } from "../../entity/ConcreteEntity";
import { CompositeEntity } from "../../entity/CompositeEntity";
import { CompositeEntityAdapter } from "../../entity/model-adapters/CompositeEntityAdapter";

export class RelationshipAdapter {
    public readonly name: string;
    public readonly type: string;
    public readonly attributes: Map<string, AttributeAdapter> = new Map();
    public readonly source: ConcreteEntityAdapter;
    private rawEntity: Entity;
    private _target: ConcreteEntityAdapter | CompositeEntityAdapter | undefined;
    public readonly direction: RelationshipDirection;
    public readonly queryDirection: QueryDirection;
    public readonly nestedOperations: NestedOperation[];
    public readonly aggregate: boolean;

    public get prefixForTypename(): string {
        // TODO: if relationship field is inherited  by source (part of a implemented Interface, not necessarily annotated as rel)
        // then return this.interface.name
        // TODO: how to get implemented interfaces here??
        return this.source.name;
    }

    /**Note: Required for now to infer the types without ResolveTree */
    public get connectionFieldTypename(): string {
        return `${this.prefixForTypename}${upperFirst(this.name)}Connection`;
    }

    /**Note: Required for now to infer the types without ResolveTree */
    public get relationshipFieldTypename(): string {
        return `${this.prefixForTypename}${upperFirst(this.name)}Relationship`;
    }

    public get connectionFieldName(): string {
        return `${this.name}Connection`;
    }

    constructor(relationship: Relationship, sourceAdapter?: ConcreteEntityAdapter) {
        const {
            name,
            type,
            attributes = new Map<string, Attribute>(),
            source,
            target,
            direction,
            queryDirection,
            nestedOperations,
            aggregate,
        } = relationship;
        this.name = name;
        this.type = type;
        if (sourceAdapter) {
            this.source = sourceAdapter;
        } else {
            this.source = new ConcreteEntityAdapter(source);
        }
        this.direction = direction;
        this.queryDirection = queryDirection;
        this.nestedOperations = nestedOperations;
        this.aggregate = aggregate;
        this.rawEntity = target;
        this.initAttributes(attributes);
    }

    private initAttributes(attributes: Map<string, Attribute>) {
        for (const [attributeName, attribute] of attributes.entries()) {
            const attributeAdapter = new AttributeAdapter(attribute);
            this.attributes.set(attributeName, attributeAdapter);
        }
    }

    // construct the target entity only when requested
    get target(): ConcreteEntityAdapter | CompositeEntityAdapter {
        if (!this._target) {
            if (this.rawEntity instanceof ConcreteEntity) {
                this._target = new ConcreteEntityAdapter(this.rawEntity);
            } else if (this.rawEntity instanceof CompositeEntity) {
                this._target = new CompositeEntityAdapter(this.rawEntity);
            } else {
                throw new Error("invalid target entity type");
            }
        }
        return this._target;
    }
}
