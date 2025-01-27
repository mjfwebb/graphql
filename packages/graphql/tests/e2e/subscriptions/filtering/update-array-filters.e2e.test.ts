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
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";
import type { TestGraphQLServer } from "../../setup/apollo-server";
import { ApolloTestServer } from "../../setup/apollo-server";
import { WebSocketTestClient } from "../../setup/ws-client";

describe("Create Subscription with optional filters valid for all types", () => {
    const testHelper = new TestHelper({ cdc: true });
    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;
    let typeMovie: UniqueType;

    beforeAll(async () => {
        await testHelper.assertCDCEnabled();
    });

    beforeEach(async () => {
        typeMovie = testHelper.createUniqueType("Movie");
        const typeDefs = `
         type ${typeMovie} @node {
            id: ID
            similarIds: [ID]
            title: String
            similarTitles: [String]
            releasedIn: Int
            allDates: [Int]
            averageRating: Float
            allRatings: [Float]
            fileSize: BigInt
            allSizes: [BigInt]
            isFavorite: Boolean
         }
         `;

        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
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

        wsClient = new WebSocketTestClient(server.wsPath);
    });

    afterEach(async () => {
        await wsClient.close();
        await server.close();
        await testHelper.close();
    });

    test("$name - subscription with INCLUDES on String", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { similarTitles_INCLUDES: "movie" }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        similarTitles
                    }
                }
            }
        `);

        await createMovie({ similarTitles: ["dummy", "movie"] });
        await createMovie({ similarTitles: ["mock"] });

        await updateMovie("similarTitles", ["dummy", "movie"], ["dummy", "movie", "a"]);
        await updateMovie("similarTitles", ["mock"], ["mock", "a"]);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { similarTitles: ["dummy", "movie", "a"] },
                },
            },
        ]);
    });
    test("subscription with INCLUDES on ID as String", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { similarIds_INCLUDES: "1" }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        similarIds
                    }
                }
            }
        `);

        await createMovie({ similarIds: ["1", "12"] });
        await createMovie({ similarIds: ["11"] });

        await updateMovie("similarIds", ["1", "12"], ["1", "122"]);
        await updateMovie("similarIds", ["11"], ["1"]);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { similarIds: ["1", "122"] },
                },
            },
        ]);
    });
    test("subscription with INCLUDES on ID as number", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { similarIds_INCLUDES: 42 }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        similarIds
                    }
                }
            }
        `);

        await createMovie({ similarIds: [42] });
        await createMovie({ similarIds: [4, 2] });

        await updateMovie("similarIds", [42], [420]);
        await updateMovie("similarIds", [4, 2], [42]);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { similarIds: ["420"] },
                },
            },
        ]);
    });
    test("subscription with INCLUDES on Int", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { allDates_INCLUDES: 2019 }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        allDates
                    }
                }
            }
        `);

        await createMovie({ allDates: [2020, 2019] });
        await createMovie({ allDates: [2019] });

        await updateMovie("allDates", [2020, 2019], [2020]);
        await updateMovie("allDates", [2019], [2020, 2018]);

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { allDates: [2020] },
                },
            },
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { allDates: [2020, 2018] },
                },
            },
        ]);
    });
    test("subscription with INCLUDES on Float", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { allRatings_INCLUDES: 5.4 }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        allRatings
                    }
                }
            }
        `);

        await createMovie({ allRatings: [6, 5.4] });
        await createMovie({ allRatings: [5.0] });

        await updateMovie("allRatings", [6, 5.4], [6, 54]);
        await updateMovie("allRatings", [5.0], [6, 5.4]);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { allRatings: [6, 54] },
                },
            },
        ]);
    });
    test("subscription with INCLUDES on BigInt", async () => {
        await wsClient.subscribe(`
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { allSizes_INCLUDES: "9223372036854775608" }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        allSizes
                    }
                }
            }
        `);

        await createMovie({
            allSizes: ["9223372036854775608", "922372036854775608"],
        });
        await createMovie({ allSizes: ["123"] });

        await updateMovie("allSizes", ["9223372036854775608", "922372036854775608"], ["1234"]);
        await updateMovie("allSizes", ["123"], ["9223372036854775608", "922372036854775608"]);

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([
            {
                [typeMovie.operations.subscribe.updated]: {
                    [typeMovie.operations.subscribe.payload.updated]: { allSizes: ["1234"] },
                },
            },
        ]);
    });

    test("subscription with INCLUDES on String should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { similarTitles_INCLUDES: ["movie"] }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        similarTitles
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ title: "movie24", similarTitles: ["dummy", "movie"] });
        await createMovie({ title: "movie25", similarTitles: ["mock"] });

        await updateMovie("similarTitles", ["dummy", "movie"], ["dummy"]);
        await updateMovie("similarTitles", ["mock"], ["mockmv"]);

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });
    test("subscription with INCLUDES on Boolean should error", async () => {
        const onReturnError = jest.fn();
        await wsClient.subscribe(
            `
            subscription {
                ${typeMovie.operations.subscribe.updated}(where: { isFavorite_INCLUDES: true }) {
                    ${typeMovie.operations.subscribe.payload.updated} {
                        isFavorite
                    }
                }
            }
        `,
            onReturnError
        );

        await createMovie({ title: "movie26", isFavorite: true });
        await createMovie({ title: "movie27", isFavorite: false });

        await updateMovie("title", "movie26", "movie26.6");
        await updateMovie("title", "movie27", "movie27.7");

        expect(onReturnError).toHaveBeenCalled();
        expect(wsClient.events).toEqual([]);
    });

    const makeTypedFieldValue = (value) => {
        if (typeof value === "string") {
            return `"${value}"`;
        }
        if (Array.isArray(value)) {
            return `[${value.map(makeTypedFieldValue)}]`;
        }
        return value;
    };
    async function createMovie(all: {
        id?: string | number;
        title?: string;
        releasedIn?: number;
        averageRating?: number;
        fileSize?: string;
        isFavorite?: boolean;
        similarTitles?: string[];
        similarIds?: number[] | string[];
        allDates?: number[];
        allRatings?: number[];
        allSizes?: string[];
    }): Promise<Response> {
        const input = Object.entries(all)
            .filter(([, v]) => v)
            .map(([k, v]) => {
                return `${k}: ${makeTypedFieldValue(v)}`;
            })
            .join(", ");
        const result = await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.create}(input: [{ ${input} }]) {
                            ${typeMovie.plural} {
                                id
                                similarIds
                                title
                                similarTitles
                                releasedIn
                                allDates
                                averageRating
                                allRatings
                                fileSize
                                allSizes
                                isFavorite
                            }
                        }
                    }
                `,
            })
            .expect(200);
        return result;
    }

    async function updateMovie(
        fieldName: string,
        oldValue: number | string | number[] | string[],
        newValue: number | string | number[] | string[]
    ): Promise<Response> {
        const result = await supertest(server.path)
            .post("")
            .send({
                query: `
                        mutation {
                            ${typeMovie.operations.update}(where: { ${fieldName}_EQ: ${makeTypedFieldValue(
                    oldValue
                )} }, update: { ${fieldName}: ${makeTypedFieldValue(newValue)} }) {
                                ${typeMovie.plural} {
                                    title
                                    releasedIn
                                    averageRating
                                    fileSize
                                }
                            }
                        }
                    `,
            })
            .expect(200);
        return result;
    }
});
