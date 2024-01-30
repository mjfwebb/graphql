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
import type { DirectiveNode } from "graphql";
import { subscriptionDirective } from "../../../graphql/directives/index.js";
import type { SubscriptionEvent } from "../../../graphql/directives/subscription.js";
import { SubscriptionAnnotation } from "../../annotation/SubscriptionAnnotation.js";
import { parseArguments } from "../parse-arguments.js";

export function parseSubscriptionAnnotation(directive: DirectiveNode): SubscriptionAnnotation {
    const { events } = parseArguments<{ events: SubscriptionEvent[] }>(subscriptionDirective, directive);

    return new SubscriptionAnnotation({
        events: new Set<SubscriptionEvent>(events),
    });
}
