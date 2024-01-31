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
import { gql } from "graphql-tag";
import { Neo4jGraphQL } from "../../../src/index.js";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils.js";

describe("Cypher Aggregations String", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie {
                title: String
                testId: ID
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Shortest", async () => {
        const query = gql`
            {
                moviesAggregate {
                    title {
                        shortest
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this:Movie)
                WITH this
                ORDER BY size(this.title) DESC
                WITH collect(this.title) AS list
                RETURN { shortest: last(list) } AS var0
            }
            RETURN { title: var0 }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Longest", async () => {
        const query = gql`
            {
                moviesAggregate {
                    title {
                        longest
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this:Movie)
                WITH this
                ORDER BY size(this.title) DESC
                WITH collect(this.title) AS list
                RETURN { longest: head(list) } AS var0
            }
            RETURN { title: var0 }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Shortest and longest", async () => {
        const query = gql`
            {
                moviesAggregate {
                    title {
                        shortest
                        longest
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this:Movie)
                WITH this
                ORDER BY size(this.title) DESC
                WITH collect(this.title) AS list
                RETURN { longest: head(list), shortest: last(list) } AS var0
            }
            RETURN { title: var0 }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Shortest with filter", async () => {
        const query = gql`
            {
                moviesAggregate(where: { testId: "10" }) {
                    title {
                        shortest
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this:Movie)
                WHERE this.testId = $param0
                WITH this
                ORDER BY size(this.title) DESC
                WITH collect(this.title) AS list
                RETURN { shortest: last(list) } AS var0
            }
            RETURN { title: var0 }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"10\\"
            }"
        `);
    });
});
