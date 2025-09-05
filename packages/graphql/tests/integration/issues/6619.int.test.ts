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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/6619", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;

    let ProductInstance: UniqueType;

    beforeAll(async () => {
        ProductInstance = testHelper.createUniqueType("ProductInstance");

        typeDefs = /* GraphQL */ `
            type ${ProductInstance} @node @limit(max: 100, default: 2) {
                serialNumber: String!
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("connection query respects @limit default", async () => {
        const create = /* GraphQL */ `
            mutation {
                ${ProductInstance.operations.create}(input: [
                    { serialNumber: "one" }
                    { serialNumber: "two" }
                    { serialNumber: "three" }
                ]) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        const createResult = await testHelper.executeGraphQL(create);
        expect(createResult.errors).toBeUndefined();
        expect(createResult.data).toBeDefined();
        const createData = createResult.data as any;
        expect(createData?.[ProductInstance.operations.create].info.nodesCreated).toBe(3);

        const connectionQuery = /* GraphQL */ `
            query {
                ${ProductInstance.operations.connection} {
                    edges {
                        node {
                            serialNumber
                        }
                    }
                }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(connectionQuery);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toBeDefined();

        const conn = (queryResult.data as any)?.[ProductInstance.operations.connection];
        expect(conn.edges).toHaveLength(2);
    });
});
