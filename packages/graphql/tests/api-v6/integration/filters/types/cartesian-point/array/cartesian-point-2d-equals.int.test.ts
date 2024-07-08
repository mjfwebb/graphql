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

import type { UniqueType } from "../../../../../../utils/graphql-types";
import { TestHelper } from "../../../../../../utils/tests-helper";

// Skip Spatial types waiting for the new operator design
// eslint-disable-next-line jest/no-disabled-tests
describe.skip("CartesianPoint 2d array EQ", () => {
    const testHelper = new TestHelper({ v6Api: true });

    let Location: UniqueType;
    const London = { x: -14221.955504767046, y: 6711533.711877272 };
    const Rome = { x: 1391088.9885668862, y: 5146427.7652232265 };
    const Paris = { x: 261848.15527273554, y: 6250566.54904563 };

    beforeEach(async () => {
        Location = testHelper.createUniqueType("Location");

        const typeDefs = /* GraphQL */ `
            type ${Location} @node {
                id: ID!
                value: [CartesianPoint!]!
            }
        `;
        await testHelper.executeCypher(
            `
                    CREATE (:${Location} { id: "1", value: [point($London), point($Paris) ]})
                    CREATE (:${Location} { id: "2", value: [point($Rome)]})
                `,
            { London, Rome, Paris }
        );
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });
    test("wgs-84-2d point filter by EQ", async () => {
        const query = /* GraphQL */ `
            query {
                ${Location.plural}(where: { edges: { node: { value: { equals: [{ x: ${London.x}, y: ${London.y} }, { x: ${Paris.x}, y: ${Paris.y} }] } } } }) {
                    connection {
                        edges {
                            node {
                                id
                                value {
                                    y
                                    x
                                    z
                                    crs
                                }
                            }
                        }
                    }
                   
                }
            }
        `;

        const equalsResult = await testHelper.executeGraphQL(query);

        expect(equalsResult.errors).toBeFalsy();
        expect(equalsResult.data).toEqual({
            [Location.plural]: {
                connection: {
                    edges: [
                        {
                            node: {
                                id: "1",

                                value: expect.toIncludeSameMembers([
                                    {
                                        y: London.y,
                                        x: London.x,
                                        z: null,
                                        crs: "cartesian",
                                    },
                                    {
                                        y: Paris.y,
                                        x: Paris.x,
                                        z: null,
                                        crs: "cartesian",
                                    },
                                ]),
                            },
                        },
                    ],
                },
            },
        });
    });
});
