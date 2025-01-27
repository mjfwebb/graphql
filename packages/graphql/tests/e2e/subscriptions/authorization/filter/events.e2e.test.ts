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

import type { Response } from "supertest";
import supertest from "supertest";
import { createJwtHeader } from "../../../../utils/create-jwt-request";
import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";
import type { TestGraphQLServer } from "../../../setup/apollo-server";
import { ApolloTestServer } from "../../../setup/apollo-server";
import { WebSocketTestClient } from "../../../setup/ws-client";

describe("Subscriptions authorization with create events", () => {
    const testHelper = new TestHelper({ cdc: true });
    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;
    let User: UniqueType;
    let key: string;

    beforeAll(async () => {
        await testHelper.assertCDCEnabled();
    });

    beforeEach(async () => {
        key = "secret";

        User = testHelper.createUniqueType("User");

        const typeDefs = `#graphql
            type JWTPayload @jwt {
                roles: [String!]! @jwtClaim(path: "myApplication.roles")
            }

            type ${User} @node
                @subscriptionsAuthorization(
                    filter: [
                        { events: [CREATED], where: { node: { id_EQ: "$jwt.sub" } } }
                    ]
                ) {
                id: ID!
            }
        `;

        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: { key },
                subscriptions: await testHelper.getSubscriptionEngine(),
            },
        });

        // eslint-disable-next-line @typescript-eslint/require-await
        server = new ApolloTestServer(neoSchema, async ({ req }) => ({
            sessionConfig: {
                database: testHelper.database,
            },
            token: req.headers.authorization,
        }));
        await server.start();
    });

    afterEach(async () => {
        await wsClient.close();

        await server.close();
        await testHelper.close();
    });

    test("authorization filters don't apply to delete events", async () => {
        const jwtToken = createJwtHeader(key, { sub: "user1", myApplication: { roles: ["user"] } });
        wsClient = new WebSocketTestClient(server.wsPath, jwtToken);

        await wsClient.subscribe(`
            subscription {
                ${User.operations.subscribe.deleted} {
                    ${User.operations.subscribe.payload.deleted} {
                        id
                    }
                }
            }
        `);

        await createUser("user1");
        await createUser("user2");
        await deleteUser("user1");
        await deleteUser("user2");

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [User.operations.subscribe.deleted]: {
                    [User.operations.subscribe.payload.deleted]: { id: "user1" },
                },
            },
            {
                [User.operations.subscribe.deleted]: {
                    [User.operations.subscribe.payload.deleted]: { id: "user2" },
                },
            },
        ]);
    });

    async function createUser(id: string): Promise<Response> {
        const result = await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${User.operations.create}(input: [{ id: "${id}" }]) {
                            ${User.plural} {
                                id
                            }
                        }
                    }
                `,
            })
            .expect(200);
        return result;
    }

    async function deleteUser(id: string): Promise<Response> {
        const result = await supertest(server.path)
            .post("")
            .set("Authorization", createJwtHeader(key, { sub: "user1", myApplication: { roles: ["admin"] } }))
            .send({
                query: `
                    mutation {
                        ${User.operations.delete}(where: { id_EQ: "${id}" }) {
                            nodesDeleted
                        }
                    }
                `,
            })
            .expect(200);
        return result;
    }
});
