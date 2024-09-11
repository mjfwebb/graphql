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

import { generate } from "randomstring";
import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("interface relationships", () => {
    const testHelper = new TestHelper();
    let Episode: UniqueType;
    let Actor: UniqueType;
    let Movie: UniqueType;
    let Series: UniqueType;

    beforeEach(async () => {
        Episode = testHelper.createUniqueType("Episode");
        Actor = testHelper.createUniqueType("Actor");
        Movie = testHelper.createUniqueType("Movie");
        Series = testHelper.createUniqueType("Series");

        const typeDefs = /* GraphQL */ `
            type ${Episode} @node {
                runtime: Int!
                series: ${Series}! @relationship(type: "HAS_EPISODE", direction: IN)
            }

            interface Production {
                title: String!
                actors: [${Actor}!]! @declareRelationship
            }

            type ${Movie} implements Production @node {
                title: String!
                runtime: Int!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ${Series} implements Production @node {
                title: String!
                episodes: [${Episode}!]! @relationship(type: "HAS_EPISODE", direction: OUT)
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type ${Actor} @node {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should disconnect using interface relationship fields", async () => {
        const actorName = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieRuntime = 59348;
        const movieScreenTime = 7079;

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesScreenTime = 5423;

        const query = `
            mutation DisconnectMovie($name: String, $title: String) {
                ${Actor.operations.update}(where: { name: $name }, disconnect: { actedIn: { where: { node: { title: $title } } } }) {
                    ${Actor.plural} {
                        name
                        actedIn {
                            title
                            ... on ${Movie} {
                                runtime
                            }
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                CREATE (a:${Actor} { name: $actorName })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:${Movie} { title: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:${Series} { title: $seriesTitle })
            `,
            {
                actorName,
                movieTitle,
                movieRuntime,
                movieScreenTime,
                seriesTitle,
                seriesScreenTime,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { name: actorName, title: movieTitle },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [Actor.operations.update]: {
                [Actor.plural]: [
                    {
                        actedIn: [
                            {
                                title: seriesTitle,
                            },
                        ],
                        name: actorName,
                    },
                ],
            },
        });
    });

    test("should nested disconnect using interface relationship fields", async () => {
        const actorName1 = generate({
            readable: true,
            charset: "alphabetic",
        });
        const actorName2 = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieRuntime = 77473;
        const movieScreenTime = 72796;

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesScreenTime = 61111;

        const query = `
            mutation DisconnectMovie($name1: String, $name2: String, $title: String) {
                ${Actor.operations.update}(
                    where: { name: $name1 }
                    disconnect: {
                        actedIn: {
                            where: { node: { title: $title } }
                            disconnect: { actors: { where: { node: { name: $name2 } } } }
                        }
                    }
                ) {
                    ${Actor.plural} {
                        name
                        actedIn {
                            title
                            actors {
                                name
                            }
                            ... on ${Movie} {
                                runtime
                            }
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                CREATE (a:${Actor} { name: $actorName1 })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:${Movie} { title: $movieTitle, runtime:$movieRuntime })<-[:ACTED_IN]-(aa:${Actor} { name: $actorName2 })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:${Series} { title: $seriesTitle })<-[:ACTED_IN]-(aa)
            `,
            {
                actorName1,
                actorName2,
                movieTitle,
                movieRuntime,
                movieScreenTime,
                seriesTitle,
                seriesScreenTime,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { name1: actorName1, name2: actorName2, title: movieTitle },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [Actor.operations.update]: {
                [Actor.plural]: [
                    {
                        actedIn: [
                            {
                                title: seriesTitle,
                                actors: expect.toIncludeSameMembers([{ name: actorName1 }, { name: actorName2 }]),
                            },
                        ],
                        name: actorName1,
                    },
                ],
            },
        });
    });
});
