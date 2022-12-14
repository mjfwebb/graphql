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

import type { CypherEnvironment } from "../Environment";
import type { CypherCompilable } from "../types";
import type { Reference } from "./Reference";
import type { Variable } from "./Variable";

/** Reference to a variable property
 * @group References
 * @example new Node({labels: ["Movie"]}).property("title")
 */
export class PropertyRef implements CypherCompilable {
    private _variable: Variable;
    private _property: string;

    constructor(variable: Reference, property: string) {
        this._variable = variable;
        this._property = property;
    }

    public get variable(): Variable {
        return this._variable;
    }

    /** Access individual property via the PropertyRef class, using the dot notation */
    public property(path: string): PropertyRef {
        return new PropertyRef(this.variable, `${this._property}.${path}`);
    }

    /**
     * @hidden
     */
    public getCypher(env: CypherEnvironment): string {
        const variableStr = this.variable.getCypher(env);
        return `${variableStr}.${this._property}`;
    }
}