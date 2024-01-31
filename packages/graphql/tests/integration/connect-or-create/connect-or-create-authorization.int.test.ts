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

import type { DocumentNode } from "graphql";
import { graphql } from "graphql";
import { gql } from "graphql-tag";
import type { Driver, Integer, Session } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src/index.js";
import { createBearerToken } from "../../utils/create-bearer-token.js";
import { getQuerySource } from "../../utils/get-query-source.js";
import { UniqueType } from "../../utils/graphql-types.js";
import Neo4j from "../neo4j.js";

describe("connectOrCreate", () => {
    describe("Update -> ConnectOrCreate", () => {
        let driver: Driver;
        let neo4j: Neo4j;
        let session: Session;
        let typeDefs: DocumentNode;
        let queryUpdate: DocumentNode;
        let queryCreate: DocumentNode;

        const typeMovie = new UniqueType("Movie");
        const typeGenre = new UniqueType("Genre");
        const secret = "secret";
        let neoSchema: Neo4jGraphQL;

        beforeAll(async () => {
            neo4j = new Neo4j();
            driver = await neo4j.getDriver();

            typeDefs = gql`
            type JWTPayload @jwt {
                roles: [String!]!
            }
            
            type ${typeMovie.name} {
                title: String
                genres: [${typeGenre.name}!]! @relationship(type: "IN_GENRE", direction: OUT)
            }
    
            type ${typeGenre.name} @authorization(validate: [{ operations: [CREATE_RELATIONSHIP, CREATE], where: { jwt: { roles_INCLUDES: "admin" } } }]) {
                name: String @unique
            }
            `;

            queryUpdate = gql`
                mutation {
                  ${typeMovie.operations.update}(
                    update: {
                        title: "Forrest Gump 2"
                        genres: {
                          connectOrCreate: {
                            where: { node: { name: "Horror" } }
                            onCreate: { node: { name: "Horror" } }
                          }
                        }
                      }
                  ) {
                    ${typeMovie.plural} {
                      title
                    }
                  }
                }
                `;

            queryCreate = gql`
                mutation {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: "Cool Movie"
                                genres: {
                                    connectOrCreate: {
                                        where: { node: { name: "Comedy" } },
                                        onCreate: { node: { name: "Comedy" } }
                                    }
                                }
                            }
                        ]
                    ) {
                        ${typeMovie.plural} {
                            title
                        }
                    }
                }
                `;

            neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });
        });

        beforeEach(async () => {
            session = await neo4j.getSession();
        });

        afterEach(async () => {
            await session.run(`MATCH (m:${typeMovie.name}) DETACH DELETE m`);
            await session.run(`MATCH (g:${typeGenre.name}) DETACH DELETE g`);

            await session.close();
        });

        afterAll(async () => {
            await driver.close();
        });

        test("cannot update with ConnectOrCreate auth", async () => {
            await session.run(`CREATE (:${typeMovie.name} { title: "RandomMovie1"})`);
            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: getQuerySource(queryUpdate),
                contextValue: neo4j.getContextValues(),
            });

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("update with ConnectOrCreate auth", async () => {
            await session.run(`CREATE (:${typeMovie.name} { title: "Forrest Gump"})`);
            const token = createBearerToken(secret, { roles: ["admin"] });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: getQuerySource(queryUpdate),
                contextValue: neo4j.getContextValues({ token }),
            });
            expect(gqlResult.errors).toBeUndefined();

            const genreCount: any = await session.run(`
              MATCH (m:${typeGenre.name} { name: "Horror" })
              RETURN COUNT(m) as count
            `);
            expect((genreCount.records[0].toObject().count as Integer).toNumber()).toBe(1);
        });

        test("create with ConnectOrCreate auth", async () => {
            const token = createBearerToken(secret, { roles: ["admin"] });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: getQuerySource(queryCreate),
                contextValue: neo4j.getContextValues({ token }),
            });
            expect(gqlResult.errors).toBeUndefined();

            const genreCount: any = await session.run(`
              MATCH (m:${typeGenre.name} { name: "Comedy" })
              RETURN COUNT(m) as count
            `);
            expect((genreCount.records[0].toObject().count as Integer).toNumber()).toBe(1);
        });
    });

    describe("authorization rules on source and target types", () => {
        let driver: Driver;
        let neo4j: Neo4j;
        let session: Session;
        let typeDefs: DocumentNode;
        let queryUpdate: DocumentNode;
        let queryCreate: DocumentNode;

        const typeMovie = new UniqueType("Movie");
        const typeGenre = new UniqueType("Genre");
        const secret = "secret";
        let neoSchema: Neo4jGraphQL;

        beforeAll(async () => {
            neo4j = new Neo4j();
            driver = await neo4j.getDriver();

            typeDefs = gql`
            type JWTPayload @jwt {
                roles: [String!]!
            }
            
            type ${typeMovie.name} @authorization(validate: [{ operations: [CREATE_RELATIONSHIP, CREATE], where: { jwt: { roles_INCLUDES: "admin" } } }]) {
                title: String
                genres: [${typeGenre.name}!]! @relationship(type: "IN_GENRE", direction: OUT)
            }
    
            type ${typeGenre.name} @authorization(validate: [{ operations: [CREATE_RELATIONSHIP, CREATE], where: { jwt: { roles_INCLUDES: "admin" } } }]) {
                name: String @unique
            }
            `;

            queryUpdate = gql`
                mutation {
                  ${typeMovie.operations.update}(
                    update: {
                        title: "Forrest Gump 2"
                        genres: {
                          connectOrCreate: {
                            where: { node: { name: "Horror" } }
                            onCreate: { node: { name: "Horror" } }
                          }
                        }
                      }
                  ) {
                    ${typeMovie.plural} {
                      title
                    }
                  }
                }
                `;

            queryCreate = gql`
                mutation {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: "Cool Movie"
                                genres: {
                                    connectOrCreate: {
                                        where: { node: { name: "Comedy" } },
                                        onCreate: { node: { name: "Comedy" } }
                                    }
                                }
                            }
                        ]
                    ) {
                        ${typeMovie.plural} {
                            title
                        }
                    }
                }
                `;

            neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });
        });

        beforeEach(async () => {
            session = await neo4j.getSession();
        });

        afterEach(async () => {
            await session.run(`MATCH (m:${typeMovie.name}) DETACH DELETE m`);
            await session.run(`MATCH (g:${typeGenre.name}) DETACH DELETE g`);

            await session.close();
        });

        afterAll(async () => {
            await driver.close();
        });

        test("cannot update with ConnectOrCreate auth", async () => {
            await session.run(`CREATE (:${typeMovie.name} { title: "RandomMovie1"})`);
            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: getQuerySource(queryUpdate),
                contextValue: neo4j.getContextValues(),
            });

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("update with ConnectOrCreate auth", async () => {
            await session.run(`CREATE (:${typeMovie.name} { title: "Forrest Gump"})`);
            const token = createBearerToken(secret, { roles: ["admin"] });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: getQuerySource(queryUpdate),
                contextValue: neo4j.getContextValues({ token }),
            });
            expect(gqlResult.errors).toBeUndefined();

            const genreCount: any = await session.run(`
              MATCH (m:${typeGenre.name} { name: "Horror" })
              RETURN COUNT(m) as count
            `);
            expect((genreCount.records[0].toObject().count as Integer).toNumber()).toBe(1);
        });

        test("create with ConnectOrCreate auth", async () => {
            const token = createBearerToken(secret, { roles: ["admin"] });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: getQuerySource(queryCreate),
                contextValue: neo4j.getContextValues({ token }),
            });
            expect(gqlResult.errors).toBeUndefined();

            const genreCount: any = await session.run(`
              MATCH (m:${typeGenre.name} { name: "Comedy" })
              RETURN COUNT(m) as count
            `);
            expect((genreCount.records[0].toObject().count as Integer).toNumber()).toBe(1);
        });
    });
});
