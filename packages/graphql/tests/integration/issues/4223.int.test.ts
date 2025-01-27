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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/4223", () => {
    const testHelper = new TestHelper({ cdc: true });
    let cdcEnabled: boolean;

    let User: UniqueType;
    let Tenant: UniqueType;
    let Settings: UniqueType;
    let OpeningDay: UniqueType;
    let OpeningHoursInterval: UniqueType;
    let MyWorkspace: UniqueType;

    let tenantVariables: Record<string, any>;
    let myUserId: string;

    let typeDefs: string;
    let ADD_TENANT: string;

    beforeAll(async () => {
        cdcEnabled = await testHelper.assertCDCEnabled();
        if (!cdcEnabled) {
            await testHelper.close();
        }
    });

    beforeEach(() => {
        User = testHelper.createUniqueType("User");
        Tenant = testHelper.createUniqueType("Tenant");
        Settings = testHelper.createUniqueType("Settings");
        OpeningDay = testHelper.createUniqueType("OpeningDay");
        OpeningHoursInterval = testHelper.createUniqueType("OpeningHoursInterval");
        MyWorkspace = testHelper.createUniqueType("MyWorkspace");

        typeDefs = /* GraphQL */ `
            type JWT @jwt {
                id: String
                roles: [String]
            }
            type ${User.name} @authorization(validate: [{ where: { node: { userId_EQ: "$jwt.id" } }, operations: [READ] }]) @node {
                userId: String! @unique
                adminAccess: [${Tenant.name}!]! @relationship(type: "ADMIN_IN", direction: OUT)
            }
    
            type ${Tenant.name} @authorization(validate: [{ where: { node: { admins_SOME: { userId_EQ: "$jwt.id" } } } }]) @node {
                id: ID! @id
                settings: ${Settings.name}! @relationship(type: "VEHICLECARD_OWNER", direction: IN)
                admins: [${User.name}!]! @relationship(type: "ADMIN_IN", direction: IN)
            }
    
            type ${Settings.name} @authorization(validate: [{ where: { node: { tenant: { admins_SOME: { userId_EQ: "$jwt.id" } } } } }]) @node {
                id: ID! @id
                openingDays: [${OpeningDay.name}!]!  @relationship(type: "VALID_GARAGES", direction: OUT)
                myWorkspace: ${MyWorkspace.name}! @relationship(type: "HAS_WORKSPACE_SETTINGS", direction: OUT)
                tenant: ${Tenant.name}! @relationship(type: "VEHICLECARD_OWNER", direction: OUT)
            }
    
            type ${OpeningDay.name}
                @node
                @authorization(
                    validate: [{ where: { node: { settings: { tenant: { admins_SOME: { userId_EQ: "$jwt.id" } } } } } }]
                ) {
                id: ID! @id
                settings: ${Settings.name} @relationship(type: "VALID_GARAGES", direction: IN)
                open: [${OpeningHoursInterval.name}!]! @relationship(type: "HAS_OPEN_INTERVALS", direction: OUT)
            }
    
            type ${OpeningHoursInterval.name}
                @node
                @authorization(
                    validate: [
                        { where: { node: { openingDay: { settings: { tenant: { admins_SOME: { userId_EQ: "$jwt.id" } } } } } } }
                    ]
                ) {
                name: String
                openingDay: ${OpeningDay.name}! @relationship(type: "HAS_OPEN_INTERVALS", direction: IN)
            }
            
            type ${MyWorkspace.name}
                @node
                @authorization(
                    validate: [
                        {
                            where: {
                                node: {
                                    settings: { tenant: { admins_SOME: { userId_EQ: "$jwt.id" } } }
                                }
                            }
                        }
                    ]
                ) {
                settings: ${Settings.name}!
                    @relationship(type: "HAS_WORKSPACE_SETTINGS", direction: IN)
                workspace: String
                updatedBy: String
                    @populatedBy(
                        callback: "getUserIDFromContext"
                        operations: [CREATE, UPDATE]
                    )
            }
        `;

        ADD_TENANT = `
            mutation addTenant($input: [${Tenant.name}CreateInput!]!) {
                ${Tenant.operations.create}(input: $input) {
                    ${Tenant.plural} {
                        id
                        admins {
                            userId
                        }
                        settings {
                            openingDays {
                                open {
                                    name
                                }
                            }
                            myWorkspace {
                                workspace
                            }
                        }
                    }
                }
            }
        `;

        myUserId = Math.random().toString(36).slice(2, 7);
        tenantVariables = {
            input: {
                admins: {
                    create: [
                        {
                            node: { userId: myUserId },
                        },
                    ],
                },
                settings: {
                    create: {
                        node: {
                            openingDays: {
                                create: {
                                    node: {
                                        open: {
                                            create: {
                                                node: {
                                                    name: "lambo",
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            myWorkspace: {
                                create: {
                                    node: {
                                        workspace: "myWorkspace",
                                    },
                                },
                            },
                        },
                    },
                },
            },
        };
    });

    afterEach(async () => {
        if (cdcEnabled) {
            await testHelper.close();
        }
    });

    test("create tenant with nested openingDays and openHoursInterval - subscriptions disabled", async () => {
        if (!cdcEnabled) {
            console.log("CDC NOT AVAILABLE - SKIPPING");
            return;
        }
        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                populatedBy: {
                    callbacks: {
                        getUserIDFromContext: () => "hi",
                    },
                },
            },
        });

        const addTenantResponse = await testHelper.executeGraphQL(ADD_TENANT, {
            variableValues: tenantVariables,
            contextValue: { jwt: { id: myUserId } },
        });

        expect(addTenantResponse.errors).toBeUndefined();
    });

    test("create tenant with nested openingDays and openHoursInterval - subscriptions enabled", async () => {
        if (!cdcEnabled) {
            console.log("CDC NOT AVAILABLE - SKIPPING");
            return;
        }
        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: await testHelper.getSubscriptionEngine(),
                populatedBy: {
                    callbacks: {
                        getUserIDFromContext: () => "hi",
                    },
                },
            },
        });

        const addTenantResponse = await testHelper.executeGraphQL(ADD_TENANT, {
            variableValues: tenantVariables,
            contextValue: { jwt: { id: myUserId } },
        });

        expect(addTenantResponse.errors).toBeUndefined();
    });
});
