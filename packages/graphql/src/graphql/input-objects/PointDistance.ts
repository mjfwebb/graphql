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

import { GraphQLFloat, GraphQLInputObjectType, GraphQLNonNull } from "graphql";
import { PointInput } from "./PointInput.js";

export const PointDistance = new GraphQLInputObjectType({
    name: "PointDistance",
    description: "Input type for a point with a distance",
    fields: {
        point: {
            type: new GraphQLNonNull(PointInput),
        },
        distance: {
            type: new GraphQLNonNull(GraphQLFloat),
            description: "The distance in metres to be used when comparing two points",
        },
    },
});
