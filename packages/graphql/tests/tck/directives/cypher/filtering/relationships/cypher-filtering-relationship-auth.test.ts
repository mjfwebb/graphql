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

import { Neo4jGraphQL } from "../../../../../../src";
import { createBearerToken } from "../../../../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../../../../utils/tck-test-utils";

describe("cypher directive filtering - relationship auth filter", () => {
    test("relationship with auth filter on type PASS", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node @authorization(filter: [{ where: { node: { actors: { name: "$jwt.custom_value" } } } }]) {
                title: String
                actors: [Actor!]!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                        RETURN actor
                        """
                        columnName: "actor"
                    )
            }

            type Actor @node {
                name: String
                movies: [Movie!]!
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(movie:Movie)
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const token = createBearerToken("secret", { custom_value: "Keanu Reeves" });

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const query = /* GraphQL */ `
            query {
                movies(where: { title: "The Matrix" }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                    RETURN actor
                }
                WITH actor AS this0
                RETURN collect(this0) AS this1
            }
            WITH *
            WHERE (this.title = $param0 AND ($isAuthenticated = true AND any(this2 IN this1 WHERE ($jwt.custom_value IS NOT NULL AND this2.name = $jwt.custom_value))))
            RETURN this { .title } AS this"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"custom_value\\": \\"Keanu Reeves\\"
                }
            }"
        `);
    });

    test("relationship with auth filter on type FAIL", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node @authorization(filter: [{ where: { node: { actors: { name: "$jwt.custom_value" } } } }]) {
                title: String
                actors: [Actor!]!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                        RETURN actor
                        """
                        columnName: "actor"
                    )
            }

            type Actor @node {
                name: String
                movies: [Movie!]!
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(movie:Movie)
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const token = createBearerToken("secret", { custom_value: "Something Incorrect" });

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const query = /* GraphQL */ `
            query {
                movies(where: { title: "The Matrix" }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                    RETURN actor
                }
                WITH actor AS this0
                RETURN collect(this0) AS this1
            }
            WITH *
            WHERE (this.title = $param0 AND ($isAuthenticated = true AND any(this2 IN this1 WHERE ($jwt.custom_value IS NOT NULL AND this2.name = $jwt.custom_value))))
            RETURN this { .title } AS this"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"custom_value\\": \\"Something Incorrect\\"
                }
            }"
        `);
    });

    test("relationship with auth validate on type PASS", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie
                @node
                @authorization(validate: [{ where: { node: { actors: { name: "$jwt.custom_value" } } } }]) {
                title: String
                actors: [Actor!]!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                        RETURN actor
                        """
                        columnName: "actor"
                    )
            }

            type Actor @node {
                name: String
                movies: [Movie!]!
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(movie:Movie)
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const token = createBearerToken("secret", { custom_value: "Keanu Reeves" });

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const query = /* GraphQL */ `
            query {
                movies(where: { title: "The Matrix" }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                    RETURN actor
                }
                WITH actor AS this0
                RETURN collect(this0) AS this1
            }
            WITH *
            WHERE (this.title = $param0 AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND any(this2 IN this1 WHERE ($jwt.custom_value IS NOT NULL AND this2.name = $jwt.custom_value))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            RETURN this { .title } AS this"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"custom_value\\": \\"Keanu Reeves\\"
                }
            }"
        `);
    });

    test("relationship with auth validate on type FAIL", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie
                @node
                @authorization(validate: [{ where: { node: { actors: { name: "$jwt.custom_value" } } } }]) {
                title: String
                actors: [Actor!]!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                        RETURN actor
                        """
                        columnName: "actor"
                    )
            }

            type Actor @node {
                name: String
                movies: [Movie!]!
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(movie:Movie)
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const token = createBearerToken("secret", { custom_value: "Something Incorrect" });

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const query = /* GraphQL */ `
            query {
                movies(where: { title: "The Matrix" }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                    RETURN actor
                }
                WITH actor AS this0
                RETURN collect(this0) AS this1
            }
            WITH *
            WHERE (this.title = $param0 AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND any(this2 IN this1 WHERE ($jwt.custom_value IS NOT NULL AND this2.name = $jwt.custom_value))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            RETURN this { .title } AS this"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"custom_value\\": \\"Something Incorrect\\"
                }
            }"
        `);
    });
});
