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

import { Neo4jGraphQL } from "../../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../../utils/tck-test-utils";

describe("Cypher Aggregations where edge with DateTime", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type User @node {
                name: String
            }

            type Post @node {
                content: String!
                likes: [User!]! @relationship(type: "LIKES", direction: IN, properties: "Likes")
            }

            type Likes @relationshipProperties {
                someDateTime: DateTime
                someDateTimeAlias: DateTime @alias(property: "_someDateTimeAlias")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("MIN_EQUAL", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { edge: { someDateTime_MIN_EQUAL: "2021-09-25T12:51:24.037Z" } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:User)
                RETURN min(this0.someDateTime) = $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"year\\": 2021,
                    \\"month\\": 9,
                    \\"day\\": 25,
                    \\"hour\\": 12,
                    \\"minute\\": 51,
                    \\"second\\": 24,
                    \\"nanosecond\\": 37000000,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });

    test("MIN_GT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { edge: { someDateTime_MIN_GT: "2021-09-25T12:51:24.037Z" } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:User)
                RETURN min(this0.someDateTime) > $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"year\\": 2021,
                    \\"month\\": 9,
                    \\"day\\": 25,
                    \\"hour\\": 12,
                    \\"minute\\": 51,
                    \\"second\\": 24,
                    \\"nanosecond\\": 37000000,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });

    test("MIN_GTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { edge: { someDateTime_MIN_GTE: "2021-09-25T12:51:24.037Z" } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:User)
                RETURN min(this0.someDateTime) >= $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"year\\": 2021,
                    \\"month\\": 9,
                    \\"day\\": 25,
                    \\"hour\\": 12,
                    \\"minute\\": 51,
                    \\"second\\": 24,
                    \\"nanosecond\\": 37000000,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });

    test("MIN_LT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { edge: { someDateTime_MIN_LT: "2021-09-25T12:51:24.037Z" } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:User)
                RETURN min(this0.someDateTime) < $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"year\\": 2021,
                    \\"month\\": 9,
                    \\"day\\": 25,
                    \\"hour\\": 12,
                    \\"minute\\": 51,
                    \\"second\\": 24,
                    \\"nanosecond\\": 37000000,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });

    test("MIN_LTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { edge: { someDateTime_MIN_LTE: "2021-09-25T12:51:24.037Z" } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:User)
                RETURN min(this0.someDateTime) <= $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"year\\": 2021,
                    \\"month\\": 9,
                    \\"day\\": 25,
                    \\"hour\\": 12,
                    \\"minute\\": 51,
                    \\"second\\": 24,
                    \\"nanosecond\\": 37000000,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });

    test("MAX_EQUAL", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { edge: { someDateTime_MAX_EQUAL: "2021-09-25T12:51:24.037Z" } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:User)
                RETURN max(this0.someDateTime) = $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"year\\": 2021,
                    \\"month\\": 9,
                    \\"day\\": 25,
                    \\"hour\\": 12,
                    \\"minute\\": 51,
                    \\"second\\": 24,
                    \\"nanosecond\\": 37000000,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });

    test("MAX_GT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { edge: { someDateTime_MAX_GT: "2021-09-25T12:51:24.037Z" } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:User)
                RETURN max(this0.someDateTime) > $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"year\\": 2021,
                    \\"month\\": 9,
                    \\"day\\": 25,
                    \\"hour\\": 12,
                    \\"minute\\": 51,
                    \\"second\\": 24,
                    \\"nanosecond\\": 37000000,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });

    test("MAX_GTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { edge: { someDateTime_MAX_GTE: "2021-09-25T12:51:24.037Z" } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:User)
                RETURN max(this0.someDateTime) >= $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"year\\": 2021,
                    \\"month\\": 9,
                    \\"day\\": 25,
                    \\"hour\\": 12,
                    \\"minute\\": 51,
                    \\"second\\": 24,
                    \\"nanosecond\\": 37000000,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });

    test("MAX_LT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { edge: { someDateTime_MAX_LT: "2021-09-25T12:51:24.037Z" } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:User)
                RETURN max(this0.someDateTime) < $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"year\\": 2021,
                    \\"month\\": 9,
                    \\"day\\": 25,
                    \\"hour\\": 12,
                    \\"minute\\": 51,
                    \\"second\\": 24,
                    \\"nanosecond\\": 37000000,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });

    test("MAX_LTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { edge: { someDateTime_MAX_LTE: "2021-09-25T12:51:24.037Z" } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:User)
                RETURN max(this0.someDateTime) <= $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"year\\": 2021,
                    \\"month\\": 9,
                    \\"day\\": 25,
                    \\"hour\\": 12,
                    \\"minute\\": 51,
                    \\"second\\": 24,
                    \\"nanosecond\\": 37000000,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });
});
