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

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Cypher sort deprecated", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            interface Production {
                id: ID!
                title: String!
            }
            type Movie implements Production @node {
                id: ID!
                title: String!
                runtime: Int!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                genres: [Genre!]! @relationship(type: "HAS_GENRE", direction: OUT)
                numberOfActors: Int!
                    @cypher(
                        statement: "MATCH (actor:Actor)-[:ACTED_IN]->(this) RETURN count(actor) as count"
                        columnName: "count"
                    )
                totalGenres: Int!
                    @cypher(
                        statement: """
                        MATCH (this)-[:HAS_GENRE]->(genre:Genre)
                        RETURN count(DISTINCT genre) as result
                        """
                        columnName: "result"
                    )
            }

            type Genre @node {
                id: ID
                name: String
                totalMovies: Int!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:HAS_GENRE]-(movie:Movie)
                        RETURN count(DISTINCT movie) as result
                        """
                        columnName: "result"
                    )
            }

            type Series implements Production @node {
                id: ID!
                title: String!
                episodes: Int!
            }
            type Actor @node {
                id: ID!
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
                totalScreenTime: Int!
                    @cypher(
                        statement: """
                        MATCH (this)-[r:ACTED_IN]->(:Movie)
                        RETURN sum(r.screenTime) as sum
                        """
                        columnName: "sum"
                    )
            }
            type ActedIn @relationshipProperties {
                screenTime: Int!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    describe("Simple Sort", () => {
        test("with field in selection set", async () => {
            const query = /* GraphQL */ `
                {
                    movies(options: { sort: [{ id: DESC }] }) {
                        id
                        title
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                WITH *
                ORDER BY this.id DESC
                RETURN this { .id, .title } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });

        test("with field aliased in selection set", async () => {
            const query = /* GraphQL */ `
                {
                    movies(options: { sort: [{ id: DESC }] }) {
                        aliased: id
                        title
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                WITH *
                ORDER BY this.id DESC
                RETURN this { .title, .id, aliased: this.id } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });

        test("with field not in selection set", async () => {
            const query = /* GraphQL */ `
                {
                    movies(options: { sort: [{ id: DESC }] }) {
                        title
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                WITH *
                ORDER BY this.id DESC
                RETURN this { .title, .id } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });
    });

    test("Simple Sort On Cypher Field Without Projection", async () => {
        const query = /* GraphQL */ `
            {
                movies(options: { sort: [{ totalGenres: DESC }] }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)-[:HAS_GENRE]->(genre:Genre)
                    RETURN count(DISTINCT genre) as result
                }
                WITH result AS this0
                RETURN this0 AS var1
            }
            WITH *
            ORDER BY var1 DESC
            RETURN this { .title, totalGenres: var1 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Simple Sort On Cypher Field Without Projection --projection", async () => {
        const query = /* GraphQL */ `
            {
                movies {
                    totalGenres
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)-[:HAS_GENRE]->(genre:Genre)
                    RETURN count(DISTINCT genre) as result
                }
                WITH result AS this0
                RETURN this0 AS var1
            }
            RETURN this { totalGenres: var1 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
    
    test("Simple Sort On Cypher Field", async () => {
        const query = /* GraphQL */ `
            {
                movies(options: { sort: [{ totalGenres: DESC }] }) {
                    totalGenres
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)-[:HAS_GENRE]->(genre:Genre)
                    RETURN count(DISTINCT genre) as result
                }
                WITH result AS this0
                RETURN this0 AS var1
            }
            WITH *
            ORDER BY var1 DESC
            RETURN this { totalGenres: var1 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Multi Sort", async () => {
        const query = /* GraphQL */ `
            {
                movies(options: { sort: [{ id: DESC }, { title: ASC }] }) {
                    id
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WITH *
            ORDER BY this.id DESC, this.title ASC
            RETURN this { .id, .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Sort with offset limit & with other variables", async () => {
        const query = /* GraphQL */ `
            query ($title: String, $offset: Int, $limit: Int) {
                movies(
                    options: { sort: [{ id: DESC }, { title: ASC }], offset: $offset, limit: $limit }
                    where: { title_EQ: $title }
                ) {
                    id
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            variableValues: { limit: 2, offset: 1, title: "some title" },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.title = $param0
            WITH *
            ORDER BY this.id DESC, this.title ASC
            SKIP $param1
            LIMIT $param2
            RETURN this { .id, .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\",
                \\"param1\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"param2\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Nested Sort DESC", async () => {
        const query = /* GraphQL */ `
            {
                movies {
                    genres(options: { sort: [{ name: DESC }] }) {
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                MATCH (this)-[this0:HAS_GENRE]->(this1:Genre)
                WITH this1 { .name } AS this1
                ORDER BY this1.name DESC
                RETURN collect(this1) AS var2
            }
            RETURN this { genres: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Nested Sort ASC", async () => {
        const query = /* GraphQL */ `
            {
                movies {
                    genres(options: { sort: [{ name: ASC }] }) {
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                MATCH (this)-[this0:HAS_GENRE]->(this1:Genre)
                WITH this1 { .name } AS this1
                ORDER BY this1.name ASC
                RETURN collect(this1) AS var2
            }
            RETURN this { genres: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Nested Sort On Cypher Field ASC", async () => {
        const query = /* GraphQL */ `
            {
                movies {
                    genres(options: { sort: [{ totalMovies: ASC }] }) {
                        name
                        totalMovies
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                MATCH (this)-[this0:HAS_GENRE]->(this1:Genre)
                CALL {
                    WITH this1
                    CALL {
                        WITH this1
                        WITH this1 AS this
                        MATCH (this)<-[:HAS_GENRE]-(movie:Movie)
                        RETURN count(DISTINCT movie) as result
                    }
                    WITH result AS this2
                    RETURN this2 AS var3
                }
                WITH this1 { .name, totalMovies: var3 } AS this1
                ORDER BY var3 ASC
                RETURN collect(this1) AS var4
            }
            RETURN this { genres: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Connection top level", async () => {
        const query = /* GraphQL */ `
            query {
                moviesConnection(first: 2, sort: { title: DESC, numberOfActors: ASC }) {
                    totalCount
                    edges {
                        node {
                            title
                            actorsConnection {
                                edges {
                                    node {
                                        name
                                        totalScreenTime
                                    }
                                }
                            }
                        }
                    }
                    pageInfo {
                        hasNextPage
                        endCursor
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Movie)
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                CALL {
                    WITH this0
                    CALL {
                        WITH this0
                        WITH this0 AS this
                        MATCH (actor:Actor)-[:ACTED_IN]->(this) RETURN count(actor) as count
                    }
                    WITH count AS this1
                    RETURN this1 AS var2
                }
                WITH *
                ORDER BY this0.title DESC, var2 ASC
                LIMIT $param0
                CALL {
                    WITH this0
                    MATCH (this0)<-[this3:ACTED_IN]-(this4:Actor)
                    WITH collect({ node: this4, relationship: this3 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS this4, edge.relationship AS this3
                        CALL {
                            WITH this4
                            CALL {
                                WITH this4
                                WITH this4 AS this
                                MATCH (this)-[r:ACTED_IN]->(:Movie)
                                RETURN sum(r.screenTime) as sum
                            }
                            WITH sum AS this5
                            RETURN this5 AS var6
                        }
                        RETURN collect({ node: { name: this4.name, totalScreenTime: var6, __resolveType: \\"Actor\\" } }) AS var7
                    }
                    RETURN { edges: var7, totalCount: totalCount } AS var8
                }
                RETURN collect({ node: { title: this0.title, actorsConnection: var8, __resolveType: \\"Movie\\" } }) AS var9
            }
            RETURN { edges: var9, totalCount: totalCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Connection nested", async () => {
        const query = /* GraphQL */ `
            query {
                actors {
                    moviesConnection(first: 2, sort: { node: { title: DESC, numberOfActors: ASC } }) {
                        totalCount
                        edges {
                            node {
                                title
                                actorsConnection {
                                    edges {
                                        node {
                                            name
                                            totalScreenTime
                                        }
                                    }
                                }
                            }
                        }
                        pageInfo {
                            hasNextPage
                            endCursor
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            CALL {
                WITH this
                MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                WITH collect({ node: this1, relationship: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this1, edge.relationship AS this0
                    CALL {
                        WITH this1
                        CALL {
                            WITH this1
                            WITH this1 AS this
                            MATCH (actor:Actor)-[:ACTED_IN]->(this) RETURN count(actor) as count
                        }
                        WITH count AS this2
                        RETURN this2 AS var3
                    }
                    WITH *
                    ORDER BY this1.title DESC, var3 ASC
                    LIMIT $param0
                    CALL {
                        WITH this1
                        MATCH (this1)<-[this4:ACTED_IN]-(this5:Actor)
                        WITH collect({ node: this5, relationship: this4 }) AS edges
                        WITH edges, size(edges) AS totalCount
                        CALL {
                            WITH edges
                            UNWIND edges AS edge
                            WITH edge.node AS this5, edge.relationship AS this4
                            CALL {
                                WITH this5
                                CALL {
                                    WITH this5
                                    WITH this5 AS this
                                    MATCH (this)-[r:ACTED_IN]->(:Movie)
                                    RETURN sum(r.screenTime) as sum
                                }
                                WITH sum AS this6
                                RETURN this6 AS var7
                            }
                            RETURN collect({ node: { name: this5.name, totalScreenTime: var7, __resolveType: \\"Actor\\" } }) AS var8
                        }
                        RETURN { edges: var8, totalCount: totalCount } AS var9
                    }
                    RETURN collect({ node: { title: this1.title, actorsConnection: var9, __resolveType: \\"Movie\\" } }) AS var10
                }
                RETURN { edges: var10, totalCount: totalCount } AS var11
            }
            RETURN this { moviesConnection: var11 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
