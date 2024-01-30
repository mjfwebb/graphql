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

import type Cypher from "@neo4j/cypher-builder";
import { SCORE_FIELD } from "../../../graphql/directives/fulltext.js";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter.js";
import type { InterfaceEntityAdapter } from "../../../schema-model/entity/model-adapters/InterfaceEntityAdapter.js";
import type { UnionEntityAdapter } from "../../../schema-model/entity/model-adapters/UnionEntityAdapter.js";
import type { RelationshipAdapter } from "../../../schema-model/relationship/model-adapters/RelationshipAdapter.js";
import type { ConnectionSortArg, GraphQLOptionsArg, GraphQLSortArg } from "../../../types/index.js";
import { Pagination } from "../ast/pagination/Pagination.js";
import { CypherPropertySort } from "../ast/sort/CypherPropertySort.js";
import { FulltextScoreSort } from "../ast/sort/FulltextScoreSort.js";
import { PropertySort } from "../ast/sort/PropertySort.js";
import type { Sort } from "../ast/sort/Sort.js";
import { isConcreteEntity } from "../utils/is-concrete-entity.js";
import { isUnionEntity } from "../utils/is-union-entity.js";

export class SortAndPaginationFactory {
    public createSortFields(
        options: GraphQLOptionsArg,
        entity: ConcreteEntityAdapter | RelationshipAdapter | InterfaceEntityAdapter | UnionEntityAdapter,
        scoreVariable?: Cypher.Variable
    ): Sort[] {
        return (options.sort || [])?.flatMap((s) => {
            return this.createPropertySort(s, entity, scoreVariable);
        });
    }

    public createConnectionSortFields(
        options: ConnectionSortArg,
        entityOrRel: ConcreteEntityAdapter | RelationshipAdapter
    ): { edge: Sort[]; node: Sort[] } {
        if (isConcreteEntity(entityOrRel)) {
            const nodeSortFields = this.createPropertySort(options.node || {}, entityOrRel);
            return {
                edge: [],
                node: nodeSortFields,
            };
        }
        const nodeSortFields = this.createPropertySort(options.node || {}, entityOrRel.target);
        const edgeSortFields = this.createPropertySort(options.edge || {}, entityOrRel);
        return {
            edge: edgeSortFields,
            node: nodeSortFields,
        };
    }

    public createPagination(options: GraphQLOptionsArg): Pagination | undefined {
        if (options.limit || options.offset) {
            return new Pagination({
                skip: options.offset,
                limit: options.limit,
            });
        }
    }

    private createPropertySort(
        optionArg: GraphQLSortArg,
        entity: ConcreteEntityAdapter | InterfaceEntityAdapter | RelationshipAdapter | UnionEntityAdapter,
        scoreVariable?: Cypher.Variable
    ): Sort[] {
        if (isUnionEntity(entity)) {
            return [];
        }

        return Object.entries(optionArg).map(([fieldName, sortDir]) => {
            // TODO: fix conflict with a a "score" fieldname
            if (fieldName === SCORE_FIELD && scoreVariable) {
                return new FulltextScoreSort({
                    scoreVariable,
                    direction: sortDir,
                });
            }

            const attribute = entity.findAttribute(fieldName);
            if (!attribute) throw new Error(`no filter attribute ${fieldName}`);
            if (attribute.annotations.cypher) {
                return new CypherPropertySort({
                    direction: sortDir,
                    attribute,
                });
            }
            return new PropertySort({
                direction: sortDir,
                attribute,
            });
        });
    }
}
