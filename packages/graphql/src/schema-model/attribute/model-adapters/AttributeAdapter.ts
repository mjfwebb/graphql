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

import { MathAdapter } from "./MathAdapter";
import { AggregationAdapter } from "./AggregationAdapter";
import { ListAdapter } from "./ListAdapter";
import type { Attribute, InputValue } from "../Attribute";
import type { Annotations } from "../../annotation/Annotation";
import {
    EnumType,
    GraphQLBuiltInScalarType,
    InterfaceType,
    ListType,
    Neo4jGraphQLNumberType,
    Neo4jGraphQLSpatialType,
    Neo4jGraphQLTemporalType,
    ObjectType,
    ScalarType,
    ScalarTypeCategory,
    UnionType,
    UserScalarType,
} from "../AttributeType";
import type { AttributeType, Neo4jGraphQLScalarType } from "../AttributeType";

export class AttributeAdapter {
    private _listModel: ListAdapter | undefined;
    private _mathModel: MathAdapter | undefined;
    private _aggregationModel: AggregationAdapter | undefined;
    public name: string;
    public annotations: Partial<Annotations>;
    public type: AttributeType;
    public databaseName: string;
    public description: string;
    public attributeArguments: InputValue[];

    constructor(attribute: Attribute) {
        this.name = attribute.name;
        this.type = attribute.type;
        this.annotations = attribute.annotations;
        this.databaseName = attribute.databaseName;
        this.description = attribute.description;
        this.attributeArguments = attribute.attributeArguments;
    }

    /**
     * Previously defined as:
     * [
            ...this.temporalFields,
            ...this.enumFields,
            ...this.objectFields,
            ...this.scalarFields, 
            ...this.primitiveFields, 
            ...this.interfaceFields,
            ...this.objectFields,
            ...this.unionFields,
            ...this.pointFields,
        ];
     */
    isMutable(): boolean {
        return (
            (this.isTemporal() ||
                this.isEnum() ||
                this.isObject() ||
                this.isScalar() ||
                this.isGraphQLBuiltInScalar() ||
                this.isInterface() ||
                this.isUnion() ||
                this.isPoint()) &&
            !this.isCypher()
        );
    }

    isUnique(): boolean {
        return this.annotations.unique ? true : false;
    }

    /**
     *  Previously defined as:
     * [...this.primitiveFields,
       ...this.scalarFields,
       ...this.enumFields,
       ...this.temporalFields,
       ...this.pointFields,]
     */
    isConstrainable(): boolean {
        return this.isGraphQLBuiltInScalar() || this.isScalar() || this.isEnum() || this.isTemporal() || this.isPoint();
    }

    /**
     * @throws {Error} if the attribute is not a list
     */
    get listModel(): ListAdapter {
        if (!this._listModel) {
            this._listModel = new ListAdapter(this);
        }
        return this._listModel;
    }

    /**
     * @throws {Error} if the attribute is not a scalar
     */
    get mathModel(): MathAdapter {
        if (!this._mathModel) {
            this._mathModel = new MathAdapter(this);
        }
        return this._mathModel;
    }

    get aggregationModel(): AggregationAdapter {
        if (!this._aggregationModel) {
            this._aggregationModel = new AggregationAdapter(this);
        }
        return this._aggregationModel;
    }

    isBoolean(): boolean {
        return this.type instanceof ScalarType && this.type.name === GraphQLBuiltInScalarType.Boolean;
    }

    isID(): boolean {
        return this.type instanceof ScalarType && this.type.name === GraphQLBuiltInScalarType.ID;
    }

    isInt(): boolean {
        return this.type instanceof ScalarType && this.type.name === GraphQLBuiltInScalarType.Int;
    }

    isFloat(): boolean {
        return this.type instanceof ScalarType && this.type.name === GraphQLBuiltInScalarType.Float;
    }

    isString(): boolean {
        return this.type instanceof ScalarType && this.type.name === GraphQLBuiltInScalarType.String;
    }

    isCartesianPoint(): boolean {
        return this.type instanceof ScalarType && this.type.name === Neo4jGraphQLSpatialType.CartesianPoint;
    }

    isPoint(): boolean {
        return this.type instanceof ScalarType && this.type.name === Neo4jGraphQLSpatialType.Point;
    }

    isBigInt(): boolean {
        return this.type instanceof ScalarType && this.type.name === Neo4jGraphQLNumberType.BigInt;
    }

    isDate(): boolean {
        return this.type instanceof ScalarType && this.type.name === Neo4jGraphQLTemporalType.Date;
    }

    isDateTime(): boolean {
        return this.type instanceof ScalarType && this.type.name === Neo4jGraphQLTemporalType.DateTime;
    }

    isLocalDateTime(): boolean {
        return this.type instanceof ScalarType && this.type.name === Neo4jGraphQLTemporalType.LocalDateTime;
    }

    isTime(): boolean {
        return this.type instanceof ScalarType && this.type.name === Neo4jGraphQLTemporalType.Time;
    }

    isLocalTime(): boolean {
        return this.type instanceof ScalarType && this.type.name === Neo4jGraphQLTemporalType.LocalTime;
    }

    isDuration(): boolean {
        return this.type instanceof ScalarType && this.type.name === Neo4jGraphQLTemporalType.Duration;
    }

    isList(): boolean {
        return this.type instanceof ListType;
    }

    isListOf(
        elementType: Exclude<AttributeType, ListType> | GraphQLBuiltInScalarType | Neo4jGraphQLScalarType | string
    ): boolean {
        if (!(this.type instanceof ListType)) {
            return false;
        }
        if (typeof elementType === "string") {
            return this.type.ofType.name === elementType;
        }

        return this.type.ofType.name === elementType.name;
    }

    isListElementRequired(): boolean {
        if (!(this.type instanceof ListType)) {
            return false;
        }
        return this.type.ofType.isRequired;
    }

    isObject(): boolean {
        return this.type instanceof ObjectType;
    }

    isEnum(): boolean {
        return this.type instanceof EnumType;
    }

    isRequired(): boolean {
        return this.type.isRequired;
    }

    isInterface(): boolean {
        return this.type instanceof InterfaceType;
    }

    isUnion(): boolean {
        return this.type instanceof UnionType;
    }

    isUserScalar(): boolean {
        return this.type instanceof UserScalarType;
    }

    /**
     *  START of category assertions
     */
    isGraphQLBuiltInScalar(): boolean {
        return this.type instanceof ScalarType && this.type.category === ScalarTypeCategory.GraphQLBuiltInScalarType;
    }

    isSpatial(): boolean {
        return this.type instanceof ScalarType && this.type.category === ScalarTypeCategory.Neo4jGraphQLSpatialType;
    }

    isTemporal(): boolean {
        return this.type instanceof ScalarType && this.type.category === ScalarTypeCategory.Neo4jGraphQLTemporalType;
    }

    isAbstract(): boolean {
        return this.isInterface() || this.isUnion();
    }

    isScalar(): boolean {
        return (
            this.isGraphQLBuiltInScalar() ||
            this.isUserScalar() ||
            this.isSpatial() ||
            this.isTemporal() ||
            this.isBigInt()
        );
    }

    isNumeric(): boolean {
        return this.isBigInt() || this.isFloat() || this.isInt();
    }

    /**
     *  END of category assertions
     */

    isCypher(): boolean {
        return this.annotations.cypher ? true : false;
    }

    isGlobalIDAttribute(): boolean {
        return !!this.annotations.id?.global;
    }

    /**
     *
     * Schema Generator Stuff
     *
     */
    getInputTypenames(): InputTypeNames {
        let typeName = this.type.getName();
        let pretty = this.type.getPretty();
        if (this.isSpatial()) {
            if (this.type.getName() === "Point") {
                typeName = "PointInput";
                pretty = pretty.replace("Point", "PointInput");
            } else {
                typeName = "CartesianPointInput";
                pretty = pretty.replace("CartesianPoint", "CartesianPointInput");
            }
        }
        return {
            where: { type: typeName, pretty },
            create: {
                type: this.type.getName(),
                pretty,
            },
            update: {
                type: this.type.getName(),
                pretty,
            },
        };
    }

    isReadable(): boolean {
        return this.annotations.selectable?.onRead !== false;
    }

    getPropagatedAnnotations(): Partial<Annotations> {
        return Object.fromEntries(
            Object.entries(this.annotations).filter(
                ([name]) =>
                    ![
                        "relationship",
                        "cypher",
                        "id",
                        "authorization",
                        "authentication",
                        "readonly",
                        "writeonly",
                        "customResolver",
                        "default",
                        "coalesce",
                        "timestamp",
                        "alias",
                        "unique",
                        "callback",
                        "populatedBy",
                        "jwtClaim",
                        "selectable",
                        "settable",
                        "subscriptionsAuthorization",
                        "filterable",
                    ].includes(name)
            )
        );
    }

    isPartOfUpdateInputType(): boolean {
        if (this.isScalar() || this.isEnum() || this.isSpatial()) {
            return true;
        }
        if (this.isGraphQLBuiltInScalar()) {
            const isAutogenerated = !!this.annotations.id;
            const isCallback = !!this.annotations.populatedBy;
            return !isAutogenerated && !isCallback; // && !readonly
        }
        if (this.isTemporal()) {
            return !this.annotations.timestamp;
        }
        return false;
    }

    isPartOfCreateInputType(): boolean {
        if (this.isScalar() || this.isEnum() || this.isSpatial() || this.isTemporal()) {
            return true;
        }
        if (this.isGraphQLBuiltInScalar()) {
            const isAutogenerated = !!this.annotations.id;
            const isCallback = !!this.annotations.populatedBy;
            return !isAutogenerated && !isCallback;
        }
        return false;
    }

    isPartOfWhereInputType(): boolean {
        return (
            this.isScalar() || this.isEnum() || this.isTemporal() || this.isSpatial() || this.isGraphQLBuiltInScalar()
        );
    }
}

type InputTypeNames = Record<"where" | "create" | "update", { type: string; pretty: string }>;
