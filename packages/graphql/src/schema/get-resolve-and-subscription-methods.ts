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

import type { SchemaComposer } from "graphql-compose";
import type { GraphQLToolsResolveMethods } from "graphql-compose/lib/SchemaComposer.js";

export function getResolveAndSubscriptionMethods(composer: SchemaComposer): GraphQLToolsResolveMethods<any> {
    const resolveMethods: GraphQLToolsResolveMethods<any> = composer.getResolveMethods();

    const subscriptionMethods = Object.entries(composer.Subscription.getFields()).reduce(
        (acc: GraphQLToolsResolveMethods<any>, [key, value]) => {
            if (!value.subscribe || !value.resolve) {
                return acc;
            }

            acc[key] = { subscribe: value.subscribe, resolve: value.resolve };
            return acc;
        },
        {}
    );
    return {
        ...resolveMethods,
        Subscription: subscriptionMethods,
    };
}
