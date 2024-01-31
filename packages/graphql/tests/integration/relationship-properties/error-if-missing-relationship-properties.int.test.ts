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

import { gql } from "graphql-tag";
import type { Driver } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src/index.js";
import { getErrorAsync } from "../../utils/get-error.js";
import Neo4j from "../neo4j.js";

describe("Throw error if missing @relationshipProperties", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should throw error if the @relationshipProperties directive is not used", async () => {
        const typeDefs = gql`
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            interface ActedIn {
                screenTime: Int!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const errors: Error[] = await getErrorAsync(() => neoSchema.getSchema());
        expect(errors).toHaveLength(2);
        expect(errors[0]).toHaveProperty(
            "message",
            "@relationship.properties invalid. Properties interface ActedIn must use directive `@relationshipProperties`."
        );
        expect(errors[0]).toHaveProperty("path", ["Movie", "actors", "@relationship", "properties"]);
        expect(errors[1]).toHaveProperty(
            "message",
            "@relationship.properties invalid. Properties interface ActedIn must use directive `@relationshipProperties`."
        );
        expect(errors[1]).toHaveProperty("path", ["Actor", "movies", "@relationship", "properties"]);
    });

    test("should not throw error if the @relationshipProperties directive is used", async () => {
        const typeDefs = gql`
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            interface ActedIn @relationshipProperties {
                screenTime: Int!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        await expect(neoSchema.getSchema()).resolves.not.toThrow();
    });
});
