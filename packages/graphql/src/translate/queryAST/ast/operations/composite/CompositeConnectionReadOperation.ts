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
import type { OperationTranspileResult } from "../operations.js";
import { Operation } from "../operations.js";

import { filterTruthy } from "../../../../../utils/utils.js";
import { hasTarget } from "../../../utils/context-has-target.js";
import { QueryASTContext } from "../../QueryASTContext.js";
import type { QueryASTNode } from "../../QueryASTNode.js";
import type { Pagination } from "../../pagination/Pagination.js";
import type { Sort, SortField } from "../../sort/Sort.js";
import type { CompositeConnectionPartial } from "./CompositeConnectionPartial.js";

export class CompositeConnectionReadOperation extends Operation {
    private children: CompositeConnectionPartial[];
    protected sortFields: Array<{ node: Sort[]; edge: Sort[] }> = [];
    private pagination: Pagination | undefined;

    constructor(children: CompositeConnectionPartial[]) {
        super();

        this.children = children;
    }

    public transpile(context: QueryASTContext): OperationTranspileResult {
        const edgeVar = new Cypher.NamedVariable("edge");
        const edgesVar = new Cypher.NamedVariable("edges");
        const totalCount = new Cypher.NamedVariable("totalCount");

        const nestedSubqueries = this.children.flatMap((c) => {
            const subQueryContext = new QueryASTContext({ ...context, returnVariable: edgeVar });
            const result = c.transpile(subQueryContext);
            if (!hasTarget(context)) throw new Error("No parent node found!");
            const parentNode = context.target;
            return result.clauses.map((sq) => Cypher.concat(new Cypher.With(parentNode), sq));
        });

        const union = new Cypher.Union(...nestedSubqueries);

        const nestedSubquery = new Cypher.Call(union);

        let extraWithOrder: Cypher.With | undefined;

        if (this.pagination || this.sortFields.length > 0) {
            const paginationField = this.pagination && this.pagination.getPagination();

            const nestedContext = new QueryASTContext({
                // NOOP context
                target: new Cypher.Node(),
                env: context.env,
                neo4jGraphQLContext: context.neo4jGraphQLContext,
            });

            const sortFields = this.getSortFields(nestedContext, edgeVar.property("node"), edgeVar);
            extraWithOrder = new Cypher.Unwind([edgesVar, edgeVar]).with(edgeVar, totalCount).orderBy(...sortFields);

            if (paginationField && paginationField.skip) {
                extraWithOrder.skip(paginationField.skip);
            }
            // Missing skip
            if (paginationField && paginationField.limit) {
                extraWithOrder.limit(paginationField.limit);
            }

            extraWithOrder.with([Cypher.collect(edgeVar), edgesVar], totalCount);
        }

        nestedSubquery.with([Cypher.collect(edgeVar), edgesVar]).with(edgesVar, [Cypher.size(edgesVar), totalCount]);

        const returnClause = new Cypher.Return([
            new Cypher.Map({
                edges: edgesVar,
                totalCount: totalCount,
            }),
            context.returnVariable,
        ]);

        return {
            clauses: [Cypher.concat(nestedSubquery, extraWithOrder, returnClause)],
            projectionExpr: context.returnVariable,
        };
    }

    public addSort(sortElement: { node: Sort[]; edge: Sort[] }): void {
        this.sortFields.push(sortElement);
    }

    public addPagination(pagination: Pagination): void {
        this.pagination = pagination;
    }

    public getChildren(): QueryASTNode[] {
        const sortFields = this.sortFields.flatMap((s) => {
            return [...s.edge, ...s.node];
        });

        return filterTruthy([...this.children, ...sortFields, this.pagination]);
    }

    protected getSortFields(
        context: QueryASTContext,
        nodeVar: Cypher.Variable | Cypher.Property,
        edgeVar: Cypher.Variable | Cypher.Property
    ): SortField[] {
        return this.sortFields.flatMap(({ node, edge }) => {
            const nodeFields = node.flatMap((s) => s.getSortFields(context, nodeVar, false));
            const edgeFields = edge.flatMap((s) => s.getSortFields(context, edgeVar, false));

            return [...nodeFields, ...edgeFields];
        });
    }
}
