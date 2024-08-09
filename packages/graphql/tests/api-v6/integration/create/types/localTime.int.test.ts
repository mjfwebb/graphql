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

import neo4jDriver from "neo4j-driver";
import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("Create Nodes with LocalTime fields", () => {
    const testHelper = new TestHelper({ v6Api: true });
    let Movie: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        const typeDefs = /* GraphQL */ `
        type ${Movie.name} @node {
            localTime: LocalTime
        }
    `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should be able to create nodes with LocalTime fields", async () => {
        const time1 = new Date("2024-02-17T11:49:48.322Z");
        const time2 = new Date("2025-02-17T12:49:48.322Z");

        const neoTime1 = neo4jDriver.LocalTime.fromStandardDate(time1);
        const neoTime2 = neo4jDriver.LocalTime.fromStandardDate(time2);

        const mutation = /* GraphQL */ `
            mutation {
                ${Movie.operations.create}(input: [
                        { node: { localTime: "${neoTime1.toString()}" } }
                        { node: { localTime: "${neoTime2.toString()}" } }
                    ]) {
                    ${Movie.plural} {
                        localTime
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(mutation);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Movie.operations.create]: {
                [Movie.plural]: expect.toIncludeSameMembers([
                    { localTime: neoTime1.toString() },
                    { localTime: neoTime2.toString() },
                ]),
            },
        });
    });
});