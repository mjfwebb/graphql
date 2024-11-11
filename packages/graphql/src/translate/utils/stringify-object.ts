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

import Cypher from "@neo4j/cypher-builder";

/** Serializes object into a string for Cypher objects */
export function stringifyObject(fields: Record<string, Cypher.Raw | string | undefined | null>): Cypher.Raw {
    return new Cypher.Raw(
        (env) =>
            `{ ${Object.entries(fields)
                .filter(([, value]) => Boolean(value))
                .map(([key, value]): string | undefined => {
                    if (value instanceof Cypher.Raw) {
                        return `${key}: ${env.compile(value)}`;
                    } else {
                        return `${key}: ${value}`;
                    }
                })
                .join(", ")} }`
    );
}
