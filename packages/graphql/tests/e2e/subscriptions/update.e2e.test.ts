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
import { Neo4jGraphQL } from "../../../src/classes/index.js";
import { Neo4jGraphQLSubscriptionsCDCEngine } from "../../../src/classes/subscription/Neo4jGraphQLSubscriptionsCDCEngine.js";
import { Neo4jGraphQLSubscriptionsDefaultEngine } from "../../../src/classes/subscription/Neo4jGraphQLSubscriptionsDefaultEngine.js";
import type { Neo4jGraphQLSubscriptionsEngine } from "../../../src/index.js";
import { UniqueType } from "../../utils/graphql-types.js";
import type { TestGraphQLServer } from "../setup/apollo-server.js";
import { ApolloTestServer } from "../setup/apollo-server.js";
import Neo4j from "../setup/neo4j.js";
import { WebSocketTestClient } from "../setup/ws-client.js";

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
])("$name Delete Subscription", ({ engine }) => {
    let neo4j: Neo4j;
    let driver: Driver;
    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;
    let typeMovie: UniqueType;
    let typeActor: UniqueType;
    let subscriptionEngine: Neo4jGraphQLSubscriptionsEngine;

    beforeEach(async () => {
        typeMovie = new UniqueType("Movie");
        typeActor = new UniqueType("Actor");
        const typeDefs = `
         type ${typeMovie} {
            title: String
            actors: [${typeActor}]
         }
         type ${typeActor} @subscription(events: []) {
            name: String
         }
         `;

        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

        subscriptionEngine = engine(driver, neo4j.getIntegrationDatabaseName());

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            features: {
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

        wsClient = new WebSocketTestClient(server.wsPath);
    });

    afterEach(async () => {
        await wsClient.close();
        subscriptionEngine.close();
        await server.close();
        await driver.close();
    });

    test("update subscription", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated} {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                    previousState {
                        title
                    }
                    event
                    timestamp
                }
            }
        `);

        await createMovie("movie1");
        await createMovie("movie2");

        await updateMovie("movie1", "movie3");
        await updateMovie("movie2", "movie4");

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie3" },
                    previousState: { title: "movie1" },
                    event: "UPDATE",
                    timestamp: expect.any(Number),
                },
            },
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie4" },
                    previousState: { title: "movie2" },
                    event: "UPDATE",
                    timestamp: expect.any(Number),
                },
            },
        ]);
    });
    test("update subscription with where", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { title: "movie5" }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                }
            }
        `);

        await createMovie("movie5");
        await createMovie("movie6");

        await updateMovie("movie5", "movie7");
        await updateMovie("movie6", "movie8");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie7" },
                },
            },
        ]);
    });

    test("update subscription with same fields after update won't be triggered", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated} {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        title
                    }
                    event
                }
            }
        `);

        await createMovie("movie10");

        await updateMovie("movie10", "movie20");
        await updateMovie("movie20", "movie20");

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { title: "movie20" },
                    event: "UPDATE",
                },
            },
        ]);
    });

    test("delete subscription on excluded type", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeActor.operations.subscribe.updated}(where: { name: "Keanu" }) {
                    ${typeActor.operations.subscribe.payload.updated} {
                        name
                    }
                }
            }
        `,
            onReturnError
        );
        await createActor("Keanu");
        await updateActor("Keanu", "Keanoo");
        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });

    async function createMovie(title): Promise<Response> {
        const result = await supertest(server.path)
            .post("")
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
    async function createActor(name: string): Promise<Response> {
        const result = await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeActor.operations.create}(input: [{ name: "${name}" }]) {
                            ${typeActor.plural} {
                                name
                            }
                        }
                    }
                `,
            })
            .expect(200);
        return result;
    }
    async function updateMovie(oldTitle: string, newTitle: string): Promise<Response> {
        const result = await supertest(server.path)
            .post("")
            .send({
                query: `
                        mutation {
                            ${typeMovie.operations.update}(where: { title: "${oldTitle}" }, update: { title: "${newTitle}" }) {
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
    async function updateActor(oldName: string, newName: string): Promise<Response> {
        const result = await supertest(server.path)
            .post("")
            .send({
                query: `
                        mutation {
                            ${typeActor.operations.update}(where: { name: "${oldName}" }, update: { name: "${newName}" }) {
                                ${typeActor.plural} {
                                    name
                                }
                            }
                        }
                    `,
            })
            .expect(200);
        return result;
    }
});
