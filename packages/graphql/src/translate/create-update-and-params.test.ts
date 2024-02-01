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

import { ContextBuilder } from "../../tests/utils/builders/context-builder.js";
import { NodeBuilder } from "../../tests/utils/builders/node-builder.js";
import { CallbackBucket } from "../classes/CallbackBucket.js";
import { Neo4jGraphQLSchemaModel } from "../schema-model/Neo4jGraphQLSchemaModel.js";
import { Attribute } from "../schema-model/attribute/Attribute.js";
import { GraphQLBuiltInScalarType, ScalarType } from "../schema-model/attribute/AttributeType.js";
import { ConcreteEntity } from "../schema-model/entity/ConcreteEntity.js";
import type { BaseField } from "../types/index.js";
import { trimmer } from "../utils/index.js";
import createUpdateAndParams from "./create-update-and-params.js";

describe("createUpdateAndParams", () => {
    test("should return the correct update and params", () => {
        const idField: BaseField = {
            fieldName: "id",
            typeMeta: {
                name: "String",
                array: false,
                required: false,
                pretty: "String",
                input: {
                    where: {
                        type: "String",
                        pretty: "String",
                    },
                    create: {
                        type: "String",
                        pretty: "String",
                    },
                    update: {
                        type: "String",
                        pretty: "String",
                    },
                },
            },
            selectableOptions: {
                onRead: true,
                onAggregate: false,
            },
            settableOptions: {
                onCreate: true,
                onUpdate: true,
            },
            filterableOptions: {
                byValue: true,
                byAggregate: true,
            },
            otherDirectives: [],
            arguments: [],
        };

        const node = new NodeBuilder({
            name: "Movie",
            primitiveFields: [idField],
        }).instance();

        const context = new ContextBuilder({
            schemaModel: new Neo4jGraphQLSchemaModel({
                concreteEntities: [
                    new ConcreteEntity({
                        name: "Movie",
                        labels: ["Movie"],
                        attributes: [
                            new Attribute({
                                name: "id",
                                type: new ScalarType(GraphQLBuiltInScalarType.String, true),
                                annotations: {},
                                args: [],
                            }),
                        ],
                    }),
                ],
                compositeEntities: [],
                operations: {},
                annotations: {},
            }),
        }).instance();

        const result = createUpdateAndParams({
            updateInput: { id: "new" },
            node,
            context,
            varName: "this",
            parentVar: "this",
            withVars: ["this"],
            parameterPrefix: "this",
            callbackBucket: new CallbackBucket(context),
        });

        expect(trimmer(result[0])).toEqual(
            trimmer(`
                SET this.id = $this_update_id
            `)
        );

        expect(result[1]).toMatchObject({
            this_update_id: "new",
        });
    });
});
