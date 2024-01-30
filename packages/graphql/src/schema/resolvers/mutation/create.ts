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

import { Kind, type FieldNode, type GraphQLResolveInfo } from "graphql";
import type { Node } from "../../../classes/index.js";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter.js";
import { translateCreate } from "../../../translate/index.js";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context.js";
import getNeo4jResolveTree from "../../../utils/get-neo4j-resolve-tree.js";
import { execute } from "../../../utils/index.js";
import { publishEventsToSubscriptionMechanism } from "../../subscriptions/publish-events-to-subscription-mechanism.js";
import type { Neo4jGraphQLComposedContext } from "../composition/wrap-query-and-mutation.js";

export function createResolver({
    node,
    concreteEntityAdapter,
}: {
    node: Node;
    concreteEntityAdapter: ConcreteEntityAdapter;
}) {
    async function resolve(
        _root: any,
        args: any,
        context: Neo4jGraphQLComposedContext,
        info: GraphQLResolveInfo
    ): Promise<{
        info: {
            bookmark: string | null;
        };
    }> {
        const resolveTree = getNeo4jResolveTree(info, { args });

        (context as Neo4jGraphQLTranslationContext).resolveTree = resolveTree;

        const { cypher, params } = await translateCreate({ context: context as Neo4jGraphQLTranslationContext, node });

        const executeResult = await execute({
            cypher,
            params,
            defaultAccessMode: "WRITE",
            context,
            info,
        });

        publishEventsToSubscriptionMechanism(executeResult, context.features?.subscriptions, context.schemaModel);

        const nodeProjection = info.fieldNodes[0]?.selectionSet?.selections.find(
            (selection): selection is FieldNode =>
                selection.kind === Kind.FIELD && selection.name.value === concreteEntityAdapter.plural
        );

        const resolveResult = {
            info: {
                bookmark: executeResult.bookmark,
                ...executeResult.statistics,
            },
        };

        if (nodeProjection) {
            const nodeKey = nodeProjection?.alias ? nodeProjection.alias.value : nodeProjection?.name?.value;
            resolveResult[nodeKey] = executeResult.records[0]?.data || [];
        }

        return resolveResult;
    }

    return {
        type: `${concreteEntityAdapter.operations.mutationResponseTypeNames.create}!`,
        resolve,
        args: concreteEntityAdapter.operations.createMutationArgumentNames,
    };
}
