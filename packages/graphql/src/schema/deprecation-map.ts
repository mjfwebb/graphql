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

import { CreateInfo } from "../graphql/objects/CreateInfo.js";
import { DeleteInfo } from "../graphql/objects/DeleteInfo.js";
import { UpdateInfo } from "../graphql/objects/UpdateInfo.js";

export const deprecationMap = new Map<
    string,
    {
        field: string;
        reason: string;
        deprecatedFromVersion: string;
        toBeRemovedInVersion: string;
    }[]
>([
    [
        CreateInfo.name,
        [
            {
                field: "bookmark",
                reason: "This field has been deprecated because bookmarks are now handled by the driver.",
                deprecatedFromVersion: "",
                toBeRemovedInVersion: "",
            },
        ],
    ],
    [
        UpdateInfo.name,
        [
            {
                field: "bookmark",
                reason: "This field has been deprecated because bookmarks are now handled by the driver.",
                deprecatedFromVersion: "",
                toBeRemovedInVersion: "",
            },
        ],
    ],
    [
        DeleteInfo.name,
        [
            {
                field: "bookmark",
                reason: "This field has been deprecated because bookmarks are now handled by the driver.",
                deprecatedFromVersion: "",
                toBeRemovedInVersion: "",
            },
        ],
    ],
]);
