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

describe("aggregations-where-edge-string", () => {
    let testHelper: TestHelper;
    let User: UniqueType;
    let Post: UniqueType;

    beforeEach(async () => {
        testHelper = new TestHelper();
        User = testHelper.createUniqueType("User");
        Post = testHelper.createUniqueType("Post");

        const typeDefs = /* GraphQL */ `
            type ${User} @node {
                testString: String!
            }

            type ${Post} @node {
              testString: String!
              likes: [${User}!]! @relationship(type: "LIKES", direction: IN, properties: "Likes")
            }

            type Likes @relationshipProperties {
                testString: String
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return posts where the SHORTEST edge like String is EQUAL to", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const shortestTestString = generate({
            charset: "alphabetic",
            readable: true,
            length: 10,
        });

        const testString2 = generate({
            charset: "alphabetic",
            readable: true,
            length: 11,
        });

        const longestTestString = generate({
            charset: "alphabetic",
            readable: true,
            length: 12,
        });

        await testHelper.executeCypher(
            `
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES { testString: "${shortestTestString}" }]-(:${User} {testString: "${shortestTestString}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES { testString: "${testString2}" }]-(:${User} {testString: "${testString2}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES { testString: "${longestTestString}" }]-(:${User} {testString: "${longestTestString}"})
                    `
        );

        const query = `
                    {
                        ${Post.plural}(where: { testString_EQ: "${testString}", likesAggregate: { edge: { testString_SHORTEST_LENGTH_EQUAL: ${shortestTestString.length} } } }) {
                            testString
                            likes {
                                testString
                            }
                        }
                    }
                `;

        const gqlResult = await testHelper.executeGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Post.plural]).toEqual([
            {
                testString,
                likes: [{ testString: shortestTestString }],
            },
        ]);
    });

    test("should return posts where the LONGEST edge like String is EQUAL to", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const shortestTestString = generate({
            charset: "alphabetic",
            readable: true,
            length: 10,
        });

        const testString2 = generate({
            charset: "alphabetic",
            readable: true,
            length: 11,
        });

        const longestTestString = generate({
            charset: "alphabetic",
            readable: true,
            length: 12,
        });

        await testHelper.executeCypher(
            `
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES { testString: "${shortestTestString}" }]-(:${User} {testString: "${shortestTestString}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES { testString: "${testString2}" }]-(:${User} {testString: "${testString2}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES { testString: "${longestTestString}" }]-(:${User} {testString: "${longestTestString}"})
                    `
        );

        const query = `
                    {
                        ${Post.plural}(where: { testString_EQ: "${testString}", likesAggregate: { edge: { testString_LONGEST_LENGTH_EQUAL: ${longestTestString.length} } } }) {
                            testString
                            likes {
                                testString
                            }
                        }
                    }
                `;

        const gqlResult = await testHelper.executeGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Post.plural]).toEqual([
            {
                testString,
                likes: [{ testString: longestTestString }],
            },
        ]);
    });

    describe("AVERAGE", () => {
        test("should return posts where the AVERAGE of edge like Strings is EQUAL to", async () => {
            const testString = generate({
                charset: "alphabetic",
                readable: true,
            });

            const testString1 = generate({
                charset: "alphabetic",
                readable: true,
                length: 10,
            });

            const testString2 = generate({
                charset: "alphabetic",
                readable: true,
                length: 11,
            });

            const testString3 = generate({
                charset: "alphabetic",
                readable: true,
                length: 12,
            });

            const avg = (10 + 11 + 12) / 3;

            await testHelper.executeCypher(
                `
                        CREATE (p:${Post} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString1}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString2}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString3}" }]-(:${User} {testString: "${testString}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        ${Post.plural}(where: { testString_EQ: "${testString}", likesAggregate: { edge: { testString_AVERAGE_LENGTH_EQUAL: ${avg} } } }) {
                            testString
                            likes {
                                testString
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.executeGraphQL(query);

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            const [post] = (gqlResult.data as any)[Post.plural] as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });

        test("should return posts where the average of edge like Strings is GT than", async () => {
            const testString = generate({
                charset: "alphabetic",
                readable: true,
            });

            const testString1 = generate({
                charset: "alphabetic",
                readable: true,
                length: 10,
            });

            const testString2 = generate({
                charset: "alphabetic",
                readable: true,
                length: 11,
            });

            const testString3 = generate({
                charset: "alphabetic",
                readable: true,
                length: 12,
            });

            const avg = (10 + 11 + 12) / 3;
            const avgGT = avg - 1;

            await testHelper.executeCypher(
                `
                        CREATE (p:${Post} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString1}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString2}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString3}" }]-(:${User} {testString: "${testString}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        ${Post.plural}(where: { testString_EQ: "${testString}", likesAggregate: { edge: { testString_AVERAGE_LENGTH_GT: ${avgGT} } } }) {
                            testString
                            likes {
                                testString
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.executeGraphQL(query);

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            const [post] = (gqlResult.data as any)[Post.plural] as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });

        test("should return posts where the average of edge like Strings is GTE than", async () => {
            const testString = generate({
                charset: "alphabetic",
                readable: true,
            });

            const testString1 = generate({
                charset: "alphabetic",
                readable: true,
                length: 10,
            });

            const testString2 = generate({
                charset: "alphabetic",
                readable: true,
                length: 11,
            });

            const testString3 = generate({
                charset: "alphabetic",
                readable: true,
                length: 12,
            });

            const avg = (10 + 11 + 12) / 3;

            await testHelper.executeCypher(
                `
                        CREATE (p:${Post} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString1}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString2}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString3}" }]-(:${User} {testString: "${testString}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        ${Post.plural}(where: { testString_EQ: "${testString}", likesAggregate: { edge: { testString_AVERAGE_LENGTH_GTE: ${avg} } } }) {
                            testString
                            likes {
                                testString
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.executeGraphQL(query);

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            const [post] = (gqlResult.data as any)[Post.plural] as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });

        test("should return posts where the average of edge like Strings is LT than", async () => {
            const testString = generate({
                charset: "alphabetic",
                readable: true,
            });

            const testString1 = generate({
                charset: "alphabetic",
                readable: true,
                length: 10,
            });

            const testString2 = generate({
                charset: "alphabetic",
                readable: true,
                length: 11,
            });

            const testString3 = generate({
                charset: "alphabetic",
                readable: true,
                length: 12,
            });

            const avg = (10 + 11 + 12) / 3;
            const avgLT = avg + 1;

            await testHelper.executeCypher(
                `
                        CREATE (p:${Post} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString1}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString2}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString3}" }]-(:${User} {testString: "${testString}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        ${Post.plural}(where: { testString_EQ: "${testString}", likesAggregate: { edge: { testString_AVERAGE_LENGTH_LT: ${avgLT} } } }) {
                            testString
                            likes {
                                testString
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.executeGraphQL(query);

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            const [post] = (gqlResult.data as any)[Post.plural] as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });

        test("should return posts where the average of edge like Strings is LTE than", async () => {
            const testString = generate({
                charset: "alphabetic",
                readable: true,
            });

            const testString1 = generate({
                charset: "alphabetic",
                readable: true,
                length: 10,
            });

            const testString2 = generate({
                charset: "alphabetic",
                readable: true,
                length: 11,
            });

            const testString3 = generate({
                charset: "alphabetic",
                readable: true,
                length: 12,
            });

            const avg = (10 + 11 + 12) / 3;

            await testHelper.executeCypher(
                `
                        CREATE (p:${Post} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString1}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString2}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString3}" }]-(:${User} {testString: "${testString}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        ${Post.plural}(where: { testString_EQ: "${testString}", likesAggregate: { edge: { testString_AVERAGE_LENGTH_LTE: ${avg} } } }) {
                            testString
                            likes {
                                testString
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.executeGraphQL(query);

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            const [post] = (gqlResult.data as any)[Post.plural] as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });
    });
});

describe("aggregations-where-edge-string interface relationships of concrete types", () => {
    let testHelper: TestHelper;
    let User: UniqueType;
    let Post: UniqueType;
    let Person: UniqueType;

    beforeEach(async () => {
        testHelper = new TestHelper();
        User = testHelper.createUniqueType("User");
        Post = testHelper.createUniqueType("Post");
        Person = testHelper.createUniqueType("Person");
        const typeDefs = /* GraphQL */ `
            interface Human {
                testString: String!
            }

            type ${User} implements Human @node {
                testString: String!
            }

            type ${Person} implements Human @node {
                testString: String!
            }

            type ${Post} @node {
                testString: String!
                likes: [Human!]! @relationship(type: "LIKES", direction: IN, properties: "Likes")
                someStringAlias: String @alias(property: "_someStringAlias")
            }

            type Likes @relationshipProperties {
                testString: String
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return posts where the SHORTEST edge like String is EQUAL to", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const shortestTestString = generate({
            charset: "alphabetic",
            readable: true,
            length: 10,
        });

        const testString2 = generate({
            charset: "alphabetic",
            readable: true,
            length: 11,
        });

        const longestTestString = generate({
            charset: "alphabetic",
            readable: true,
            length: 12,
        });

        await testHelper.executeCypher(
            `
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES { testString: "${shortestTestString}" }]-(:${User} {testString: "${shortestTestString}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES { testString: "${testString2}" }]-(:${User} {testString: "${testString2}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES { testString: "${longestTestString}" }]-(:${User} {testString: "${longestTestString}"})
                    `
        );

        const query = `
                    {
                        ${Post.plural}(where: { testString_EQ: "${testString}", likesAggregate: { edge: { testString_SHORTEST_LENGTH_EQUAL: ${shortestTestString.length} } } }) {
                            testString
                            likes {
                                testString
                            }
                        }
                    }
                `;

        const gqlResult = await testHelper.executeGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Post.plural]).toEqual([
            {
                testString,
                likes: [{ testString: shortestTestString }],
            },
        ]);
    });

   
        test(
            "should return posts where the LONGEST edge like String is EQUAL to",
            async () => {
                const testString = generate({
                    charset: "alphabetic",
                    readable: true,
                });

                const shortestTestString = generate({
                    charset: "alphabetic",
                    readable: true,
                    length: 10,
                });

                const testString2 = generate({
                    charset: "alphabetic",
                    readable: true,
                    length: 11,
                });

                const longestTestString = generate({
                    charset: "alphabetic",
                    readable: true,
                    length: 12,
                });

                await testHelper.executeCypher(
                    `
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES { testString: "${shortestTestString}" }]-(:${User} {testString: "${shortestTestString}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES { testString: "${testString2}" }]-(:${User} {testString: "${testString2}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES { testString: "${longestTestString}" }]-(:${User} {testString: "${longestTestString}"})
                    `
                );

                const query = `
                    {
                        ${Post.plural}(where: { testString_EQ: "${testString}", likesAggregate: { edge: { testString_LONGEST_LENGTH_EQUAL: ${longestTestString.length} } } }) {
                            testString
                            likes {
                                testString
                            }
                        }
                    }
                `;

                const gqlResult = await testHelper.executeGraphQL(query);

                if (gqlResult.errors) {
                    console.log(JSON.stringify(gqlResult.errors, null, 2));
                }

                expect(gqlResult.errors).toBeUndefined();

                expect((gqlResult.data as any)[Post.plural]).toEqual([
                    {
                        testString,
                        likes: [{ testString: longestTestString }],
                    },
                ]);
            }
        );


    describe("AVERAGE", () => {
        test(
            "should return posts where the %s of edge like Strings is EQUAL to",
            async () => {
                const testString = generate({
                    charset: "alphabetic",
                    readable: true,
                });

                const testString1 = generate({
                    charset: "alphabetic",
                    readable: true,
                    length: 10,
                });

                const testString2 = generate({
                    charset: "alphabetic",
                    readable: true,
                    length: 11,
                });

                const testString3 = generate({
                    charset: "alphabetic",
                    readable: true,
                    length: 12,
                });

                const avg = (10 + 11 + 12) / 3;

                await testHelper.executeCypher(
                    `
                        CREATE (p:${Post} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString1}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString2}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString3}" }]-(:${User} {testString: "${testString}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
                );

                const query = `
                    {
                        ${Post.plural}(where: { testString_EQ: "${testString}", likesAggregate: { edge: { testString_AVERAGE_LENGTH_EQUAL: ${avg} } } }) {
                            testString
                            likes {
                                testString
                            }
                        }
                    }
                `;

                const gqlResult = await testHelper.executeGraphQL(query);

                if (gqlResult.errors) {
                    console.log(JSON.stringify(gqlResult.errors, null, 2));
                }

                expect(gqlResult.errors).toBeUndefined();

                const [post] = (gqlResult.data as any)[Post.plural] as any[];
                expect(post.testString).toEqual(testString);
                expect(post.likes).toHaveLength(3);
            }
        );

        test("should return posts where the average of edge like Strings is GT than", async () => {
            const testString = generate({
                charset: "alphabetic",
                readable: true,
            });

            const testString1 = generate({
                charset: "alphabetic",
                readable: true,
                length: 10,
            });

            const testString2 = generate({
                charset: "alphabetic",
                readable: true,
                length: 11,
            });

            const testString3 = generate({
                charset: "alphabetic",
                readable: true,
                length: 12,
            });

            const avg = (10 + 11 + 12) / 3;
            const avgGT = avg - 1;

            await testHelper.executeCypher(
                `
                        CREATE (p:${Post} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString1}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString2}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString3}" }]-(:${User} {testString: "${testString}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        ${Post.plural}(where: { testString_EQ: "${testString}", likesAggregate: { edge: { testString_AVERAGE_LENGTH_GT: ${avgGT} } } }) {
                            testString
                            likes {
                                testString
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.executeGraphQL(query);

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            const [post] = (gqlResult.data as any)[Post.plural] as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });

        test("should return posts where the average of edge like Strings is GTE than", async () => {
            const testString = generate({
                charset: "alphabetic",
                readable: true,
            });

            const testString1 = generate({
                charset: "alphabetic",
                readable: true,
                length: 10,
            });

            const testString2 = generate({
                charset: "alphabetic",
                readable: true,
                length: 11,
            });

            const testString3 = generate({
                charset: "alphabetic",
                readable: true,
                length: 12,
            });

            const avg = (10 + 11 + 12) / 3;

            await testHelper.executeCypher(
                `
                        CREATE (p:${Post} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString1}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString2}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString3}" }]-(:${User} {testString: "${testString}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        ${Post.plural}(where: { testString_EQ: "${testString}", likesAggregate: { edge: { testString_AVERAGE_LENGTH_GTE: ${avg} } } }) {
                            testString
                            likes {
                                testString
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.executeGraphQL(query);

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            const [post] = (gqlResult.data as any)[Post.plural] as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });

        test("should return posts where the average of edge like Strings is LT than", async () => {
            const testString = generate({
                charset: "alphabetic",
                readable: true,
            });

            const testString1 = generate({
                charset: "alphabetic",
                readable: true,
                length: 10,
            });

            const testString2 = generate({
                charset: "alphabetic",
                readable: true,
                length: 11,
            });

            const testString3 = generate({
                charset: "alphabetic",
                readable: true,
                length: 12,
            });

            const avg = (10 + 11 + 12) / 3;
            const avgLT = avg + 1;

            await testHelper.executeCypher(
                `
                        CREATE (p:${Post} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString1}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString2}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString3}" }]-(:${User} {testString: "${testString}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        ${Post.plural}(where: { testString_EQ: "${testString}", likesAggregate: { edge: { testString_AVERAGE_LENGTH_LT: ${avgLT} } } }) {
                            testString
                            likes {
                                testString
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.executeGraphQL(query);

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            const [post] = (gqlResult.data as any)[Post.plural] as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });

        test("should return posts where the average of edge like Strings is LTE than", async () => {
            const testString = generate({
                charset: "alphabetic",
                readable: true,
            });

            const testString1 = generate({
                charset: "alphabetic",
                readable: true,
                length: 10,
            });

            const testString2 = generate({
                charset: "alphabetic",
                readable: true,
                length: 11,
            });

            const testString3 = generate({
                charset: "alphabetic",
                readable: true,
                length: 12,
            });

            const avg = (10 + 11 + 12) / 3;

            await testHelper.executeCypher(
                `
                        CREATE (p:${Post} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString1}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString2}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString3}" }]-(:${User} {testString: "${testString}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        ${Post.plural}(where: { testString_EQ: "${testString}", likesAggregate: { edge: { testString_AVERAGE_LENGTH_LTE: ${avg} } } }) {
                            testString
                            likes {
                                testString
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.executeGraphQL(query);

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            const [post] = (gqlResult.data as any)[Post.plural] as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });
    });
});
