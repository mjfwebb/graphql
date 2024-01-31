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

import { graphql } from "graphql";
import { gql } from "graphql-tag";
import type { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../src/index.js";
import { UniqueType } from "../../utils/graphql-types.js";
import Neo4j from "../neo4j.js";

describe("https://github.com/neo4j/graphql/issues/4007", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    const typeMovie = new UniqueType("Movie");
    const typeActor = new UniqueType("Actor");

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should return all the selected node fields", async () => {
        const session = await neo4j.getSession();

        const typeDefs = gql`
            type ${typeMovie.name} {
                title: String!
                actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${typeActor.name} {
                name: String!
                surname: String
                movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${typeMovie.plural} {
                    actorsConnection {
                        edges {
                            node {
                                surname
                            }
                            no: node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                    CREATE (m:${typeMovie.name} {title: $movieTitle})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: randomUUID(), surname: randomUUID()})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: randomUUID(), surname: randomUUID()})
                    CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: randomUUID(), surname: randomUUID()})
                `,
                {
                    movieTitle,
                }
            );

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            expect(result.errors).toBeUndefined();

            expect((result.data as any)[typeMovie.plural][0].actorsConnection.edges[0].no.name).toBeDefined();
            expect((result.data as any)[typeMovie.plural][0].actorsConnection.edges[0].node.surname).toBeDefined();
        } finally {
            await session.close();
        }
    });
});
