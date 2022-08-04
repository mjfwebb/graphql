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

import * as CypherBuilder from "../../CypherBuilder";
import { CypherEnvironment } from "../../Environment";

describe("RunFirstColumn", () => {
    let env: CypherEnvironment;

    beforeEach(() => {
        env = new CypherEnvironment();
    });

    test("Simple subquery", () => {
        const node = new CypherBuilder.Node({ labels: ["Movie"] });
        const subquery = new CypherBuilder.Match(node).return(node);

        const apocCall = new CypherBuilder.apoc.RunFirstColumn(subquery, [node]);

        expect(apocCall.getCypher(env)).toMatchInlineSnapshot(`
            "apoc.cypher.runFirstColumnMany(\\"MATCH (this0:\`Movie\`)
            RETURN this0\\", { this0: this0 })"
        `);
    });

    test("Complex subQuery with scoped env and params", () => {
        const node = new CypherBuilder.Node({ labels: ["Movie"] });
        const param1 = new CypherBuilder.Param("The Matrix");

        const topQuery = new CypherBuilder.Match(node).where(CypherBuilder.eq(node.property("title"), param1));

        const nestedPattern = new CypherBuilder.Pattern(node, {
            source: {
                labels: false,
            },
        });
        const releasedParam = new CypherBuilder.Param(1999);
        const subQuery = new CypherBuilder.Match(nestedPattern)
            .set([node.property("released"), releasedParam])
            .return(node);
        const apocCall = new CypherBuilder.apoc.RunFirstColumn(subQuery, [node, releasedParam]);

        topQuery.return(
            new CypherBuilder.Map({
                result: apocCall,
            })
        );

        const cypherResult = topQuery.build();

        expect(cypherResult.cypher).toMatchInlineSnapshot(`
            "MATCH (this0:\`Movie\`)
            WHERE this0.title = $param0
            RETURN { result: apoc.cypher.runFirstColumnMany(\\"MATCH (this0)
            SET
                this0.released = $param1
            RETURN this0\\", { this0: this0, param1: $param1 }) }"
        `);
        expect(cypherResult.params).toMatchInlineSnapshot(`
            Object {
              "param0": "The Matrix",
              "param1": 1999,
            }
        `);
    });
});
