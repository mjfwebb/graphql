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

import type { ValueNode } from "graphql";
import { Neo4jGraphQLSchemaValidationError } from "../../classes/Error";
import { annotationToKey, type Annotation, type Annotations } from "../annotation/Annotation";
import { parseValueNode } from "../parser/parse-value-node";
import type { AttributeType } from "./AttributeType";

export class InputValue {
    // these are arguments (eg field arguments)
    public readonly name: string;
    public readonly type: AttributeType;
    public readonly defaultValue?: string;
    public readonly description: string;
    // public readonly annotations: Partial<Annotations> = {};

    constructor({
        name,
        type,
        defaultValue,
        description,
    }: {
        name: string;
        type: AttributeType;
        defaultValue?: ValueNode;
        description?: string;
    }) {
        this.name = name;
        this.type = type;
        this.defaultValue = defaultValue ? parseValueNode(defaultValue) : undefined;
        this.description = description || "";
    }
}

export class Attribute {
    public readonly name: string;
    public readonly annotations: Partial<Annotations> = {};
    public readonly type: AttributeType;
    public readonly databaseName: string;
    public readonly description: string;
    public readonly attributeArguments: InputValue[];

    constructor({
        name,
        annotations = [],
        type,
        attributeArguments,
        databaseName,
        description,
    }: {
        name: string;
        annotations: Annotation[];
        type: AttributeType;
        attributeArguments: InputValue[];
        databaseName?: string;
        description?: string;
    }) {
        this.name = name;
        this.type = type;
        this.attributeArguments = attributeArguments;
        this.databaseName = databaseName ?? name;
        this.description = description || "";

        for (const annotation of annotations) {
            this.addAnnotation(annotation);
        }
    }

    public clone(): Attribute {
        return new Attribute({
            name: this.name,
            annotations: Object.values(this.annotations),
            type: this.type,
            attributeArguments: this.attributeArguments,
            databaseName: this.databaseName,
            description: this.description,
        });
    }

    private addAnnotation(annotation: Annotation): void {
        const annotationKey = annotationToKey(annotation);
        if (this.annotations[annotationKey]) {
            throw new Neo4jGraphQLSchemaValidationError(`Annotation ${annotationKey} already exists in ${this.name}`);
        }

        // We cast to any because we aren't narrowing the Annotation type here.
        // There's no reason to narrow either, since we care more about performance.
        this.annotations[annotationKey] = annotation as any;
    }
}
