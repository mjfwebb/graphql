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

import type { Attribute } from "../../attribute/Attribute";
import { AttributeAdapter } from "../../attribute/model-adapters/AttributeAdapter";
import { getFromMap } from "../../utils/get-from-map";
import type { CompositeEntity } from "../CompositeEntity";
import type { ConcreteEntity } from "../ConcreteEntity";
import { ConcreteEntityAdapter } from "./ConcreteEntityAdapter";

// As the composite entity is not yet implemented, this is a placeholder
export class CompositeEntityAdapter {
    public readonly name: string;
    public concreteEntities: ConcreteEntityAdapter[];
    public readonly attributes: Map<string, AttributeAdapter> = new Map();
    // TODO: add type interface or union, and for interface add fields
    // TODO: add annotations

    private updateInputTypeFieldKeys: string[] = [];
    private createInputTypeFieldKeys: string[] = [];
    private whereInputTypeFieldKeys: string[] = [];

    constructor({ name, concreteEntities, attributes }: CompositeEntity) {
        this.name = name;
        this.concreteEntities = [];
        this.initConcreteEntities(concreteEntities);
        this.initAttributes(attributes);
    }

    private initAttributes(attributes: Map<string, Attribute>) {
        for (const [attributeName, attribute] of attributes.entries()) {
            const attributeAdapter = new AttributeAdapter(attribute);
            this.attributes.set(attributeName, attributeAdapter);
            if (attributeAdapter.isPartOfUpdateInputType()) {
                this.updateInputTypeFieldKeys.push(attribute.name);
            }
            if (attributeAdapter.isPartOfWhereInputType()) {
                this.whereInputTypeFieldKeys.push(attribute.name);
            }
        }
    }

    private initConcreteEntities(concreteEntities: ConcreteEntity[]) {
        for (const entity of concreteEntities) {
            this.concreteEntities.push(new ConcreteEntityAdapter(entity));
        }
    }

    getUpdateInputTypeFields() {
        return this.updateInputTypeFieldKeys.map((key) => getFromMap(this.attributes, key));
    }

    getCreateInputTypeFields() {
        return this.createInputTypeFieldKeys.map((key) => getFromMap(this.attributes, key));
    }

    getWhereInputTypeFields() {
        return this.whereInputTypeFieldKeys.map((key) => getFromMap(this.attributes, key));
    }
}
