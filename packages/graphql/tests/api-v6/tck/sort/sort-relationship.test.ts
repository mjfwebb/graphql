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

import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../../tck/utils/tck-test-utils";

describe("Sort relationship", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                ratings: Int!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Actor @node {
                name: String
                age: Int
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                year: Int
                role: String
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Relationship sort", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    connection {
                        edges {
                            node {
                                title
                                actors {
                                    connection(sort: { edges: { node: { name: DESC } } }) {
                                        edges {
                                            node {
                                                name
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { v6Api: true });

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
                    MATCH (this0)<-[this1:ACTED_IN]-(this2:Actor)
                    WITH collect({ node: this2, relationship: this1 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS this2, edge.relationship AS this1
                        WITH *
                        ORDER BY this2.name DESC
                        RETURN collect({ node: { name: this2.name, __resolveType: \\"Actor\\" } }) AS var3
                    }
                    RETURN { connection: { edges: var3, totalCount: totalCount } } AS var4
                }
                RETURN collect({ node: { title: this0.title, actors: var4, __resolveType: \\"Movie\\" } }) AS var5
            }
            RETURN { connection: { edges: var5, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Relationship sort multiple sort fields", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    connection {
                        edges {
                            node {
                                title
                                actors {
                                    connection(
                                        sort: [{ edges: { node: { name: DESC } } }, { edges: { node: { age: DESC } } }]
                                    ) {
                                        edges {
                                            node {
                                                name
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { v6Api: true });

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
                    MATCH (this0)<-[this1:ACTED_IN]-(this2:Actor)
                    WITH collect({ node: this2, relationship: this1 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS this2, edge.relationship AS this1
                        WITH *
                        ORDER BY this2.name DESC, this2.age DESC
                        RETURN collect({ node: { name: this2.name, __resolveType: \\"Actor\\" } }) AS var3
                    }
                    RETURN { connection: { edges: var3, totalCount: totalCount } } AS var4
                }
                RETURN collect({ node: { title: this0.title, actors: var4, __resolveType: \\"Movie\\" } }) AS var5
            }
            RETURN { connection: { edges: var5, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Relationship sort on relationship properties", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    connection {
                        edges {
                            node {
                                title
                                actors {
                                    connection(sort: { edges: { properties: { year: DESC } } }) {
                                        edges {
                                            node {
                                                name
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { v6Api: true });

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
                    MATCH (this0)<-[this1:ACTED_IN]-(this2:Actor)
                    WITH collect({ node: this2, relationship: this1 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS this2, edge.relationship AS this1
                        WITH *
                        ORDER BY this1.year DESC
                        RETURN collect({ node: { name: this2.name, __resolveType: \\"Actor\\" } }) AS var3
                    }
                    RETURN { connection: { edges: var3, totalCount: totalCount } } AS var4
                }
                RETURN collect({ node: { title: this0.title, actors: var4, __resolveType: \\"Movie\\" } }) AS var5
            }
            RETURN { connection: { edges: var5, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Should respect input order on sorting", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    connection {
                        edges {
                            node {
                                title
                                actors {
                                    connection(
                                        sort: [
                                            { edges: { properties: { year: DESC } } }
                                            { edges: { node: { name: ASC } } }
                                            { edges: { properties: { role: ASC } } }
                                        ]
                                    ) {
                                        edges {
                                            node {
                                                age
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { v6Api: true });

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
                    MATCH (this0)<-[this1:ACTED_IN]-(this2:Actor)
                    WITH collect({ node: this2, relationship: this1 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS this2, edge.relationship AS this1
                        WITH *
                        ORDER BY this1.year DESC, this2.name ASC, this1.role ASC
                        RETURN collect({ node: { age: this2.age, __resolveType: \\"Actor\\" } }) AS var3
                    }
                    RETURN { connection: { edges: var3, totalCount: totalCount } } AS var4
                }
                RETURN collect({ node: { title: this0.title, actors: var4, __resolveType: \\"Movie\\" } }) AS var5
            }
            RETURN { connection: { edges: var5, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
