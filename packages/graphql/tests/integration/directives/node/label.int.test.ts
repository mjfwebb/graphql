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

import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import type { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import Neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";
import { UniqueType } from "../../../utils/graphql-types";
import { createJwtRequest } from "../../../utils/create-jwt-request";

describe("Node directive labels", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;

    const typeFilm = new UniqueType("Film");

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
        session = await neo4j.getSession();

        await session.run(`CREATE (m:${typeFilm.name} {title: "The Matrix",year:1999})`);
    });

    afterAll(async () => {
        await driver.close();
        await session.close();
    });

    test("custom labels", async () => {
        const typeDefs = `type Movie @node(label: "${typeFilm.name}") {
            id: ID
            title: String
        }`;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const query = `query {
            movies {
                title
                }
            }`;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });
        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data.movies[0]).toEqual({
            title: "The Matrix",
        });
    });

    test("custom jwt labels", async () => {
        const typeDefs = `type Movie @node(label: "$jwt.filmLabel") {
            id: ID
            title: String
        }`;

        const secret = "1234";

        const req = createJwtRequest(secret, { filmLabel: typeFilm.name });

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret,
                }),
            },
        });

        const query = `query {
            movies {
                title
                }
            }`;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
        });
        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data.movies[0]).toEqual({
            title: "The Matrix",
        });
    });

    test("custom context labels", async () => {
        const typeDefs = `type Movie @node(label: "$context.filmLabel") {
            id: ID
            title: String
        }`;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const query = `query {
            movies {
                title
                }
            }`;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), {
                filmLabel: typeFilm.name,
            }),
        });
        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data.movies[0]).toEqual({
            title: "The Matrix",
        });
    });
});
