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

describe("Cypher -> fulltext -> Match", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie @fulltext(indexes: [{ name: "MovieTitle", fields: ["title"] }]) {
                title: String
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("simple match with single fulltext property", async () => {
        const query = gql`
            query {
                movies(fulltext: { MovieTitle: { phrase: "something AND something" } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {});

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL db.index.fulltext.queryNodes(\\"MovieTitle\\", $param0) YIELD node AS this0, score AS var1
            WHERE $param1 IN labels(this0)
            RETURN this0 { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"something AND something\\",
                \\"param1\\": \\"Movie\\"
            }"
        `);
    });

    test("match with where and single fulltext property", async () => {
        const query = gql`
            query {
                movies(
                    fulltext: { MovieTitle: { phrase: "something AND something" } }
                    where: { title: "some-title" }
                ) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {});

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL db.index.fulltext.queryNodes(\\"MovieTitle\\", $param0) YIELD node AS this0, score AS var1
            WHERE ($param1 IN labels(this0) AND this0.title = $param2)
            RETURN this0 { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"something AND something\\",
                \\"param1\\": \\"Movie\\",
                \\"param2\\": \\"some-title\\"
            }"
        `);
    });
});
