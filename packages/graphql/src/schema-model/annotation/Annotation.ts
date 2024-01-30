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
import { parseAuthenticationAnnotation } from "../parser/annotations-parser/authentication-annotation.js";
import { parseAuthorizationAnnotation } from "../parser/annotations-parser/authorization-annotation.js";
import { parseCoalesceAnnotation } from "../parser/annotations-parser/coalesce-annotation.js";
import { parseCustomResolverAnnotation } from "../parser/annotations-parser/custom-resolver-annotation.js";
import { parseCypherAnnotation } from "../parser/annotations-parser/cypher-annotation.js";
import { parseDefaultAnnotation } from "../parser/annotations-parser/default-annotation.js";
import { parseFilterableAnnotation } from "../parser/annotations-parser/filterable-annotation.js";
import { parseFullTextAnnotation } from "../parser/annotations-parser/full-text-annotation.js";
import { parseJWTClaimAnnotation } from "../parser/annotations-parser/jwt-claim-annotation.js";
import { parseKeyAnnotation } from "../parser/annotations-parser/key-annotation.js";
import { parseLimitAnnotation } from "../parser/annotations-parser/limit-annotation.js";
import { parseMutationAnnotation } from "../parser/annotations-parser/mutation-annotation.js";
import { parsePluralAnnotation } from "../parser/annotations-parser/plural-annotation.js";
import { parsePopulatedByAnnotation } from "../parser/annotations-parser/populated-by-annotation.js";
import { parseQueryAnnotation } from "../parser/annotations-parser/query-annotation.js";
import { parseSelectableAnnotation } from "../parser/annotations-parser/selectable-annotation.js";
import { parseSettableAnnotation } from "../parser/annotations-parser/settable-annotation.js";
import { parseSubscriptionAnnotation } from "../parser/annotations-parser/subscription-annotation.js";
import { parseSubscriptionsAuthorizationAnnotation } from "../parser/annotations-parser/subscriptions-authorization-annotation.js";
import { parseTimestampAnnotation } from "../parser/annotations-parser/timestamp-annotation.js";
import { parseUniqueAnnotation } from "../parser/annotations-parser/unique-annotation.js";
import type { AuthenticationAnnotation } from "./AuthenticationAnnotation.js";
import type { AuthorizationAnnotation } from "./AuthorizationAnnotation.js";
import type { CoalesceAnnotation } from "./CoalesceAnnotation.js";
import type { CustomResolverAnnotation } from "./CustomResolverAnnotation.js";
import type { CypherAnnotation } from "./CypherAnnotation.js";
import type { DefaultAnnotation } from "./DefaultAnnotation.js";
import type { FilterableAnnotation } from "./FilterableAnnotation.js";
import type { FullTextAnnotation } from "./FullTextAnnotation.js";
import { IDAnnotation } from "./IDAnnotation.js";
import type { JWTClaimAnnotation } from "./JWTClaimAnnotation.js";
import { JWTPayloadAnnotation } from "./JWTPayloadAnnotation.js";
import type { KeyAnnotation } from "./KeyAnnotation.js";
import type { LimitAnnotation } from "./LimitAnnotation.js";
import type { MutationAnnotation } from "./MutationAnnotation.js";
import type { PluralAnnotation } from "./PluralAnnotation.js";
import type { PopulatedByAnnotation } from "./PopulatedByAnnotation.js";
import { PrivateAnnotation } from "./PrivateAnnotation.js";
import type { QueryAnnotation } from "./QueryAnnotation.js";
import { RelayIDAnnotation } from "./RelayIDAnnotation.js";
import type { SelectableAnnotation } from "./SelectableAnnotation.js";
import type { SettableAnnotation } from "./SettableAnnotation.js";
import type { SubscriptionAnnotation } from "./SubscriptionAnnotation.js";
import type { SubscriptionsAuthorizationAnnotation } from "./SubscriptionsAuthorizationAnnotation.js";
import type { TimestampAnnotation } from "./TimestampAnnotation.js";
import type { UniqueAnnotation } from "./UniqueAnnotation.js";

export interface Annotation {
    readonly name: string;
}

// Ensures that annotation name property matches its Annotations object key
type CheckAnnotationName<T> = {
    [P in keyof T]: T[P] & { name: P };
};

export type Annotations = CheckAnnotationName<{
    private: PrivateAnnotation;
    plural: PluralAnnotation;
    customResolver: CustomResolverAnnotation;
    jwt: JWTPayloadAnnotation;
    selectable: SelectableAnnotation;
    populatedBy: PopulatedByAnnotation;
    subscription: SubscriptionAnnotation;
    authorization: AuthorizationAnnotation;
    default: DefaultAnnotation;
    settable: SettableAnnotation;
    cypher: CypherAnnotation;
    fulltext: FullTextAnnotation;
    limit: LimitAnnotation;
    id: IDAnnotation;
    key: KeyAnnotation;
    authentication: AuthenticationAnnotation;
    timestamp: TimestampAnnotation;
    filterable: FilterableAnnotation;
    jwtClaim: JWTClaimAnnotation;
    query: QueryAnnotation;
    coalesce: CoalesceAnnotation;
    subscriptionsAuthorization: SubscriptionsAuthorizationAnnotation;
    mutation: MutationAnnotation;
    relayId: RelayIDAnnotation;
    unique: UniqueAnnotation;
}>;

export type AnnotationParser<T extends Annotation> = (
    firstDirective: DirectiveNode,
    directives: readonly DirectiveNode[]
) => T;

export const annotationsParsers: { [key in keyof Annotations]: AnnotationParser<Annotations[key]> } = {
    authentication: parseAuthenticationAnnotation,
    authorization: parseAuthorizationAnnotation,
    coalesce: parseCoalesceAnnotation,
    customResolver: parseCustomResolverAnnotation,
    cypher: parseCypherAnnotation,
    default: parseDefaultAnnotation,
    filterable: parseFilterableAnnotation,
    fulltext: parseFullTextAnnotation,
    id: () => new IDAnnotation(),
    jwtClaim: parseJWTClaimAnnotation,
    jwt: () => new JWTPayloadAnnotation(),
    key: parseKeyAnnotation,
    mutation: parseMutationAnnotation,
    plural: parsePluralAnnotation,
    populatedBy: parsePopulatedByAnnotation,
    private: () => new PrivateAnnotation(),
    query: parseQueryAnnotation,
    limit: parseLimitAnnotation,
    selectable: parseSelectableAnnotation,
    settable: parseSettableAnnotation,
    subscription: parseSubscriptionAnnotation,
    subscriptionsAuthorization: parseSubscriptionsAuthorizationAnnotation,
    timestamp: parseTimestampAnnotation,
    unique: parseUniqueAnnotation,
    relayId: () => new RelayIDAnnotation(),
};
