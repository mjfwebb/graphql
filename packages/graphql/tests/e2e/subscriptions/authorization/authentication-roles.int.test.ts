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

import type { Driver } from "neo4j-driver";
import type { Response } from "supertest";
import supertest from "supertest";
import { Neo4jGraphQL } from "../../../../src/classes/index.js";
import { Neo4jGraphQLSubscriptionsCDCEngine } from "../../../../src/classes/subscription/Neo4jGraphQLSubscriptionsCDCEngine.js";
import { Neo4jGraphQLSubscriptionsDefaultEngine } from "../../../../src/classes/subscription/Neo4jGraphQLSubscriptionsDefaultEngine.js";
import type { Neo4jGraphQLSubscriptionsEngine } from "../../../../src/index.js";
import { createBearerToken } from "../../../utils/create-bearer-token.js";
import { UniqueType } from "../../../utils/graphql-types.js";
import type { TestGraphQLServer } from "../../setup/apollo-server.js";
import { ApolloTestServer } from "../../setup/apollo-server.js";
import Neo4j from "../../setup/neo4j.js";
import { WebSocketTestClient } from "../../setup/ws-client.js";

describe.each([
    {
        name: "Neo4jGraphQLSubscriptionsDefaultEngine",
        engine: (_driver: Driver, _db: string) => new Neo4jGraphQLSubscriptionsDefaultEngine(),
    },
    {
        name: "Neo4jGraphQLSubscriptionsCDCEngine",
        engine: (driver: Driver, db: string) =>
            new Neo4jGraphQLSubscriptionsCDCEngine({
                driver,
                pollTime: 100,
                queryConfig: {
                    database: db,
                },
            }),
    },
])("$name - Subscription authentication roles", ({ engine }) => {
    const typeMovie = new UniqueType("Movie");
    let neo4j: Neo4j;
    let driver: Driver;
    let jwtToken: string;
    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;
    let subscriptionEngine: Neo4jGraphQLSubscriptionsEngine;

    const typeDefs = `
    type JWTPayload @jwt {
        roles: [String!]!
    }
    
    type ${typeMovie} {
        title: String!
    }

    extend type ${typeMovie} @authentication(operations: [SUBSCRIBE], jwt: { roles_INCLUDES: "admin" })
    `;

    beforeAll(async () => {
        jwtToken = createBearerToken("secret", { roles: ["admin"] });
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
        subscriptionEngine = engine(driver, neo4j.getIntegrationDatabaseName());
        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            features: {
                authorization: {
                    key: "secret",
                },
                subscriptions: subscriptionEngine,
            },
        });

        // eslint-disable-next-line @typescript-eslint/require-await
        server = new ApolloTestServer(neoSchema, async ({ req }) => ({
            sessionConfig: {
                database: neo4j.getIntegrationDatabaseName(),
            },
            token: req.headers.authorization,
        }));
        await server.start();
    });

    afterEach(async () => {
        await wsClient.close();
    });

    afterAll(async () => {
        await server.close();
        subscriptionEngine.close();
        await driver.close();
    });

    test("auth with roles pass", async () => {
        wsClient = new WebSocketTestClient(server.wsPath, jwtToken);
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created} {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
            `);

        const result = await createMovie("movie1", server);

        await wsClient.waitForEvents(1);

        expect(result.body.errors).toBeUndefined();
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: {
                        title: "movie1",
                    },
                },
            },
        ]);
        expect(wsClient.errors).toEqual([]);
    });

    test("auth with one of roles pass", async () => {
        jwtToken = createBearerToken("secret", { roles: ["super-admin", "admin"] });
        wsClient = new WebSocketTestClient(server.wsPath, jwtToken);
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created} {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
            `);

        const result = await createMovie("movie1", server);

        await wsClient.waitForEvents(1);

        expect(result.body.errors).toBeUndefined();
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.created]: {
                    [typeMovie.operations.subscribe.payload.created]: {
                        title: "movie1",
                    },
                },
            },
        ]);
        expect(wsClient.errors).toEqual([]);
    });

    test("auth with different role fails", async () => {
        const wrongToken = createBearerToken("secret", { roles: ["not-admin"] });
        wsClient = new WebSocketTestClient(server.wsPath, wrongToken);
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created} {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
            `);

        await wsClient.waitForEvents(1);
        expect(wsClient.events).toEqual([]);
        expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Unauthenticated" })]);
    });

    test("auth with role and wrong secret fails", async () => {
        const wrongToken = createBearerToken("secret2", { roles: ["admin"] });
        wsClient = new WebSocketTestClient(server.wsPath, wrongToken);
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.created} {
                    ${typeMovie.operations.subscribe.payload.created} {
                        title
                    }
                }
            }
            `);

        await wsClient.waitForEvents(1);
        expect(wsClient.events).toEqual([]);
        expect(wsClient.errors).toEqual([expect.objectContaining({ message: "Unauthenticated" })]);
    });

    async function createMovie(title: string, graphQLServer: TestGraphQLServer): Promise<Response> {
        const result = await supertest(graphQLServer.path)
            .post("")
            .set("authorization", jwtToken)
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.create}(input: [{ title: "${title}" }]) {
                            ${typeMovie.plural} {
                                title
                            }
                        }
                    }
                `,
            })
            .expect(200);
        return result;
    }
});
