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

import type { ResolveTree } from "graphql-parse-resolve-info";
import type { Neo4jGraphQLSchemaModel } from "../../../schema-model/Neo4jGraphQLSchemaModel.js";
import type { EntityAdapter } from "../../../schema-model/entity/EntityAdapter.js";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context.js";
import { QueryAST } from "../ast/QueryAST.js";
import { AuthFilterFactory } from "./AuthFilterFactory.js";
import { AuthorizationFactory } from "./AuthorizationFactory.js";
import { FieldFactory } from "./FieldFactory.js";
import { FilterFactory } from "./FilterFactory.js";
import { OperationsFactory } from "./OperationFactory.js";
import { SortAndPaginationFactory } from "./SortAndPaginationFactory.js";

export class QueryASTFactory {
    public schemaModel: Neo4jGraphQLSchemaModel;
    // specialized factories are currently public to facilitate the migration to the new QueryASTFactory
    public operationsFactory: OperationsFactory;
    public filterFactory: FilterFactory;
    public fieldFactory: FieldFactory;
    public sortAndPaginationFactory: SortAndPaginationFactory;
    public authorizationFactory: AuthorizationFactory;
    public experimental: boolean;

    constructor(schemaModel: Neo4jGraphQLSchemaModel, experimental: boolean) {
        this.schemaModel = schemaModel;
        this.experimental = experimental;
        this.filterFactory = new FilterFactory(this);
        this.fieldFactory = new FieldFactory(this);
        this.sortAndPaginationFactory = new SortAndPaginationFactory();
        const authFilterFactory = new AuthFilterFactory(this);
        this.authorizationFactory = new AuthorizationFactory(authFilterFactory);
        this.operationsFactory = new OperationsFactory(this);
    }

    public createQueryAST(
        resolveTree: ResolveTree,
        entityAdapter: EntityAdapter,
        context: Neo4jGraphQLTranslationContext
    ): QueryAST {
        const operation = this.operationsFactory.createTopLevelOperation(entityAdapter, resolveTree, context, "this");
        return new QueryAST(operation);
    }
}
