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
import type { AttributeAdapter } from "../../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { RelationshipWhereOperator } from "../../../where/types";
import type { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import type { CustomCypherSelection } from "../selection/CustomCypherSelection";
import { Filter } from "./Filter";

export class CypherRelationshipFilter extends Filter {
    private returnVariable: Cypher.Node;
    private attribute: AttributeAdapter;
    private selection: CustomCypherSelection;
    private operator: RelationshipWhereOperator;
    private targetNodeFilters: Filter[] = [];
    private isNot: boolean; // TODO: remove this when name_NOT is removed
    private checkIsNotNull: boolean;

    constructor({
        selection,
        attribute,
        operator,
        isNot,
        returnVariable,
        checkIsNotNull = false,
    }: {
        selection: CustomCypherSelection;
        attribute: AttributeAdapter;
        operator: RelationshipWhereOperator;
        isNot: boolean;
        returnVariable: Cypher.Node;
        checkIsNotNull?: boolean;
    }) {
        super();
        this.selection = selection;
        this.attribute = attribute;
        this.isNot = isNot;
        this.operator = operator;
        this.returnVariable = returnVariable;
        this.checkIsNotNull = checkIsNotNull;
    }

    public getChildren(): QueryASTNode[] {
        return [...this.targetNodeFilters, this.selection];
    }

    public addTargetNodeFilter(...filter: Filter[]): void {
        this.targetNodeFilters.push(...filter);
    }

    public print(): string {
        return `${super.print()} [${this.attribute.name}] <${this.isNot ? "NOT " : ""}${this.operator}>`;
    }

    public getSubqueries(context: QueryASTContext): Cypher.Clause[] {
        const { selection: cypherSubquery, nestedContext } = this.selection.apply(context);

        const subqueries: Cypher.Clause[] = [];

        let clause: Cypher.Clause;

        if (this.isNullableSingle() && this.operator === "SOME" && this.isNot === true) {
            clause = cypherSubquery.return([
                Cypher.head(Cypher.collect(nestedContext.returnVariable)),
                this.returnVariable,
            ]);
        } else {
            clause = cypherSubquery.return([nestedContext.returnVariable, this.returnVariable]);
        }

        subqueries.push(clause);

        return subqueries;
    }

    protected isNullableSingle(): boolean {
        return !this.attribute.typeHelper.isList() && this.attribute.typeHelper.isNullable();
    }

    public getPredicate(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        const context = queryASTContext.setTarget(this.returnVariable);

        const predicate = this.createRelationshipOperation(context);
        if (predicate) {
            return this.wrapInNotIfNeeded(predicate);
        }
    }

    protected createRelationshipOperation(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        const predicates = this.targetNodeFilters.map((c) => c.getPredicate(queryASTContext));
        const innerPredicate = Cypher.and(...predicates);

        switch (this.operator) {
            case "NONE":
            case "SOME": {
                if (this.isNullableSingle() && this.isNot) {
                    // If the relationship is nullable and the operator is NOT SOME, we need to check if the relationship is null
                    // Note that NOT SOME is equivalent to NONE
                    return Cypher.and(innerPredicate, Cypher.isNull(this.returnVariable));
                }

                return innerPredicate;
            }
        }
    }

    protected wrapInNotIfNeeded(predicate: Cypher.Predicate): Cypher.Predicate {
        // Cypher.not is not desired when the relationship is a nullable not-list
        // This is because we want to check IS NULL, rather than NOT IS NULL,
        // even though this.isNot is set to true
        if (this.isNot && !this.isNullableSingle()) {
            return Cypher.not(predicate);
        }

        return predicate;
    }
}
