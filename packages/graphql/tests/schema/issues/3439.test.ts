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

import { printSchemaWithDirectives } from "@graphql-tools/utils";
import { validateSchema } from "graphql";
import { gql } from "graphql-tag";
import { lexicographicSortSchema } from "graphql/utilities";
import { Neo4jGraphQL } from "../../../src";
import { TestCDCEngine } from "../../utils/builders/TestCDCEngine";

describe("https://github.com/neo4j/graphql/issues/3439", () => {
    test("Type definitions implementing multiple interfaces", async () => {
        const typeDefs = gql`
            interface INode {
                id: String!
            }

            interface IProduct implements INode {
                id: String!

                name: String!
                genre: Genre!
            }

            type Movie implements INode & IProduct @node {
                id: String!

                name: String!
                genre: Genre! @relationship(type: "HAS_GENRE", direction: OUT)
            }

            type Series implements INode & IProduct @node {
                id: String!

                name: String!
                genre: Genre! @relationship(type: "HAS_GENRE", direction: OUT)
            }

            type Genre @node {
                name: String! @unique
                product: [IProduct!]! @relationship(type: "HAS_GENRE", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { subscriptions: new TestCDCEngine() } });

        const schema = await neoSchema.getSchema();
        const errors = validateSchema(schema);
        expect(errors).toHaveLength(0);

        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
              subscription: Subscription
            }

            type CreateGenresMutationResponse {
              genres: [Genre!]!
              info: CreateInfo!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateMoviesMutationResponse {
              info: CreateInfo!
              movies: [Movie!]!
            }

            type CreateSeriesMutationResponse {
              info: CreateInfo!
              series: [Series!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            enum EventType {
              CREATE
              CREATE_RELATIONSHIP
              DELETE
              DELETE_RELATIONSHIP
              UPDATE
            }

            type Genre {
              name: String!
              product(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), limit: Int, offset: Int, options: IProductOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [IProductSort!], where: IProductWhere): [IProduct!]!
              productAggregate(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), where: IProductWhere): GenreIProductProductAggregationSelection
              productConnection(after: String, directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), first: Int, sort: [GenreProductConnectionSort!], where: GenreProductConnectionWhere): GenreProductConnection!
            }

            type GenreAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
            }

            input GenreConnectInput {
              product: [GenreProductConnectFieldInput!]
            }

            input GenreConnectOrCreateWhere {
              node: GenreUniqueWhere!
            }

            input GenreConnectWhere {
              node: GenreWhere!
            }

            input GenreCreateInput {
              name: String!
              product: GenreProductFieldInput
            }

            type GenreCreatedEvent {
              createdGenre: GenreEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input GenreDeleteInput {
              product: [GenreProductDeleteFieldInput!]
            }

            type GenreDeletedEvent {
              deletedGenre: GenreEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input GenreDisconnectInput {
              product: [GenreProductDisconnectFieldInput!]
            }

            type GenreEdge {
              cursor: String!
              node: Genre!
            }

            type GenreEventPayload {
              name: String!
            }

            type GenreIProductProductAggregationSelection {
              count: Int!
              node: GenreIProductProductNodeAggregateSelection
            }

            type GenreIProductProductNodeAggregateSelection {
              id: StringAggregateSelection!
              name: StringAggregateSelection!
            }

            input GenreOnCreateInput {
              name: String!
            }

            input GenreOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more GenreSort objects to sort Genres by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [GenreSort!]
            }

            input GenreProductAggregateInput {
              AND: [GenreProductAggregateInput!]
              NOT: GenreProductAggregateInput
              OR: [GenreProductAggregateInput!]
              count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: GenreProductNodeAggregationWhereInput
            }

            input GenreProductConnectFieldInput {
              where: IProductConnectWhere
            }

            type GenreProductConnection {
              edges: [GenreProductRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input GenreProductConnectionSort {
              node: IProductSort
            }

            input GenreProductConnectionWhere {
              AND: [GenreProductConnectionWhere!]
              NOT: GenreProductConnectionWhere
              OR: [GenreProductConnectionWhere!]
              node: IProductWhere
            }

            input GenreProductCreateFieldInput {
              node: IProductCreateInput!
            }

            input GenreProductDeleteFieldInput {
              where: GenreProductConnectionWhere
            }

            input GenreProductDisconnectFieldInput {
              where: GenreProductConnectionWhere
            }

            input GenreProductFieldInput {
              connect: [GenreProductConnectFieldInput!]
              create: [GenreProductCreateFieldInput!]
            }

            input GenreProductNodeAggregationWhereInput {
              AND: [GenreProductNodeAggregationWhereInput!]
              NOT: GenreProductNodeAggregationWhereInput
              OR: [GenreProductNodeAggregationWhereInput!]
              id_AVERAGE_LENGTH_EQUAL: Float
              id_AVERAGE_LENGTH_GT: Float
              id_AVERAGE_LENGTH_GTE: Float
              id_AVERAGE_LENGTH_LT: Float
              id_AVERAGE_LENGTH_LTE: Float
              id_LONGEST_LENGTH_EQUAL: Int
              id_LONGEST_LENGTH_GT: Int
              id_LONGEST_LENGTH_GTE: Int
              id_LONGEST_LENGTH_LT: Int
              id_LONGEST_LENGTH_LTE: Int
              id_SHORTEST_LENGTH_EQUAL: Int
              id_SHORTEST_LENGTH_GT: Int
              id_SHORTEST_LENGTH_GTE: Int
              id_SHORTEST_LENGTH_LT: Int
              id_SHORTEST_LENGTH_LTE: Int
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
            }

            type GenreProductRelationship {
              cursor: String!
              node: IProduct!
            }

            input GenreProductUpdateConnectionInput {
              node: IProductUpdateInput
            }

            input GenreProductUpdateFieldInput {
              connect: [GenreProductConnectFieldInput!]
              create: [GenreProductCreateFieldInput!]
              delete: [GenreProductDeleteFieldInput!]
              disconnect: [GenreProductDisconnectFieldInput!]
              update: GenreProductUpdateConnectionInput
              where: GenreProductConnectionWhere
            }

            \\"\\"\\"
            Fields to sort Genres by. The order in which sorts are applied is not guaranteed when specifying many fields in one GenreSort object.
            \\"\\"\\"
            input GenreSort {
              name: SortDirection
            }

            input GenreSubscriptionWhere {
              AND: [GenreSubscriptionWhere!]
              NOT: GenreSubscriptionWhere
              OR: [GenreSubscriptionWhere!]
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
            }

            input GenreUniqueWhere {
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_EQ: String
            }

            input GenreUpdateInput {
              name: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              name_SET: String
              product: [GenreProductUpdateFieldInput!]
            }

            type GenreUpdatedEvent {
              event: EventType!
              previousState: GenreEventPayload!
              timestamp: Float!
              updatedGenre: GenreEventPayload!
            }

            input GenreWhere {
              AND: [GenreWhere!]
              NOT: GenreWhere
              OR: [GenreWhere!]
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
              productAggregate: GenreProductAggregateInput
              \\"\\"\\"
              Return Genres where all of the related GenreProductConnections match this filter
              \\"\\"\\"
              productConnection_ALL: GenreProductConnectionWhere
              \\"\\"\\"
              Return Genres where none of the related GenreProductConnections match this filter
              \\"\\"\\"
              productConnection_NONE: GenreProductConnectionWhere
              \\"\\"\\"
              Return Genres where one of the related GenreProductConnections match this filter
              \\"\\"\\"
              productConnection_SINGLE: GenreProductConnectionWhere
              \\"\\"\\"
              Return Genres where some of the related GenreProductConnections match this filter
              \\"\\"\\"
              productConnection_SOME: GenreProductConnectionWhere
              \\"\\"\\"Return Genres where all of the related IProducts match this filter\\"\\"\\"
              product_ALL: IProductWhere
              \\"\\"\\"Return Genres where none of the related IProducts match this filter\\"\\"\\"
              product_NONE: IProductWhere
              \\"\\"\\"Return Genres where one of the related IProducts match this filter\\"\\"\\"
              product_SINGLE: IProductWhere
              \\"\\"\\"Return Genres where some of the related IProducts match this filter\\"\\"\\"
              product_SOME: IProductWhere
            }

            type GenresConnection {
              edges: [GenreEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            interface INode {
              id: String!
            }

            type INodeAggregateSelection {
              count: Int!
              id: StringAggregateSelection!
            }

            type INodeEdge {
              cursor: String!
              node: INode!
            }

            enum INodeImplementation {
              Movie
              Series
            }

            input INodeOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more INodeSort objects to sort INodes by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [INodeSort!]
            }

            \\"\\"\\"
            Fields to sort INodes by. The order in which sorts are applied is not guaranteed when specifying many fields in one INodeSort object.
            \\"\\"\\"
            input INodeSort {
              id: SortDirection
            }

            input INodeWhere {
              AND: [INodeWhere!]
              NOT: INodeWhere
              OR: [INodeWhere!]
              id: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_EQ: String
              id_IN: [String!]
              id_STARTS_WITH: String
              typename_IN: [INodeImplementation!]
            }

            type INodesConnection {
              edges: [INodeEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            interface IProduct {
              genre: Genre!
              id: String!
              name: String!
            }

            type IProductAggregateSelection {
              count: Int!
              id: StringAggregateSelection!
              name: StringAggregateSelection!
            }

            input IProductConnectWhere {
              node: IProductWhere!
            }

            input IProductCreateInput {
              Movie: MovieCreateInput
              Series: SeriesCreateInput
            }

            type IProductEdge {
              cursor: String!
              node: IProduct!
            }

            enum IProductImplementation {
              Movie
              Series
            }

            input IProductOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more IProductSort objects to sort IProducts by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [IProductSort!]
            }

            \\"\\"\\"
            Fields to sort IProducts by. The order in which sorts are applied is not guaranteed when specifying many fields in one IProductSort object.
            \\"\\"\\"
            input IProductSort {
              id: SortDirection
              name: SortDirection
            }

            input IProductUpdateInput {
              id: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              id_SET: String
              name: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              name_SET: String
            }

            input IProductWhere {
              AND: [IProductWhere!]
              NOT: IProductWhere
              OR: [IProductWhere!]
              id: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_EQ: String
              id_IN: [String!]
              id_STARTS_WITH: String
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
              typename_IN: [IProductImplementation!]
            }

            type IProductsConnection {
              edges: [IProductEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Movie implements INode & IProduct {
              genre(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), limit: Int, offset: Int, options: GenreOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [GenreSort!], where: GenreWhere): Genre!
              genreAggregate(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), where: GenreWhere): MovieGenreGenreAggregationSelection
              genreConnection(after: String, directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), first: Int, sort: [MovieGenreConnectionSort!], where: MovieGenreConnectionWhere): MovieGenreConnection!
              id: String!
              name: String!
            }

            type MovieAggregateSelection {
              count: Int!
              id: StringAggregateSelection!
              name: StringAggregateSelection!
            }

            input MovieCreateInput {
              genre: MovieGenreFieldInput
              id: String!
              name: String!
            }

            type MovieCreatedEvent {
              createdMovie: MovieEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input MovieDeleteInput {
              genre: MovieGenreDeleteFieldInput
            }

            type MovieDeletedEvent {
              deletedMovie: MovieEventPayload!
              event: EventType!
              timestamp: Float!
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            type MovieEventPayload {
              id: String!
              name: String!
            }

            input MovieGenreAggregateInput {
              AND: [MovieGenreAggregateInput!]
              NOT: MovieGenreAggregateInput
              OR: [MovieGenreAggregateInput!]
              count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: MovieGenreNodeAggregationWhereInput
            }

            input MovieGenreConnectFieldInput {
              connect: GenreConnectInput
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true @deprecated(reason: \\"The overwrite argument is deprecated and will be removed\\")
              where: GenreConnectWhere
            }

            input MovieGenreConnectOrCreateFieldInput {
              onCreate: MovieGenreConnectOrCreateFieldInputOnCreate!
              where: GenreConnectOrCreateWhere!
            }

            input MovieGenreConnectOrCreateFieldInputOnCreate {
              node: GenreOnCreateInput!
            }

            type MovieGenreConnection {
              edges: [MovieGenreRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieGenreConnectionSort {
              node: GenreSort
            }

            input MovieGenreConnectionWhere {
              AND: [MovieGenreConnectionWhere!]
              NOT: MovieGenreConnectionWhere
              OR: [MovieGenreConnectionWhere!]
              node: GenreWhere
            }

            input MovieGenreCreateFieldInput {
              node: GenreCreateInput!
            }

            input MovieGenreDeleteFieldInput {
              delete: GenreDeleteInput
              where: MovieGenreConnectionWhere
            }

            input MovieGenreDisconnectFieldInput {
              disconnect: GenreDisconnectInput
              where: MovieGenreConnectionWhere
            }

            input MovieGenreFieldInput {
              connect: MovieGenreConnectFieldInput
              connectOrCreate: MovieGenreConnectOrCreateFieldInput @deprecated(reason: \\"The connectOrCreate operation is deprecated and will be removed\\")
              create: MovieGenreCreateFieldInput
            }

            type MovieGenreGenreAggregationSelection {
              count: Int!
              node: MovieGenreGenreNodeAggregateSelection
            }

            type MovieGenreGenreNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input MovieGenreNodeAggregationWhereInput {
              AND: [MovieGenreNodeAggregationWhereInput!]
              NOT: MovieGenreNodeAggregationWhereInput
              OR: [MovieGenreNodeAggregationWhereInput!]
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
            }

            type MovieGenreRelationship {
              cursor: String!
              node: Genre!
            }

            input MovieGenreUpdateConnectionInput {
              node: GenreUpdateInput
            }

            input MovieGenreUpdateFieldInput {
              connect: MovieGenreConnectFieldInput
              connectOrCreate: MovieGenreConnectOrCreateFieldInput
              create: MovieGenreCreateFieldInput
              delete: MovieGenreDeleteFieldInput
              disconnect: MovieGenreDisconnectFieldInput
              update: MovieGenreUpdateConnectionInput
              where: MovieGenreConnectionWhere
            }

            input MovieOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [MovieSort!]
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              id: SortDirection
              name: SortDirection
            }

            input MovieSubscriptionWhere {
              AND: [MovieSubscriptionWhere!]
              NOT: MovieSubscriptionWhere
              OR: [MovieSubscriptionWhere!]
              id: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_EQ: String
              id_IN: [String!]
              id_STARTS_WITH: String
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
            }

            input MovieUpdateInput {
              genre: MovieGenreUpdateFieldInput
              id: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              id_SET: String
              name: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              name_SET: String
            }

            type MovieUpdatedEvent {
              event: EventType!
              previousState: MovieEventPayload!
              timestamp: Float!
              updatedMovie: MovieEventPayload!
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              genre: GenreWhere
              genreAggregate: MovieGenreAggregateInput
              genreConnection: MovieGenreConnectionWhere
              id: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_EQ: String
              id_IN: [String!]
              id_STARTS_WITH: String
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
            }

            type MoviesConnection {
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createGenres(input: [GenreCreateInput!]!): CreateGenresMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
              deleteGenres(delete: GenreDeleteInput, where: GenreWhere): DeleteInfo!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              deleteSeries(delete: SeriesDeleteInput, where: SeriesWhere): DeleteInfo!
              updateGenres(update: GenreUpdateInput, where: GenreWhere): UpdateGenresMutationResponse!
              updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
              updateSeries(update: SeriesUpdateInput, where: SeriesWhere): UpdateSeriesMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              genres(limit: Int, offset: Int, options: GenreOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [GenreSort!], where: GenreWhere): [Genre!]!
              genresAggregate(where: GenreWhere): GenreAggregateSelection!
              genresConnection(after: String, first: Int, sort: [GenreSort!], where: GenreWhere): GenresConnection!
              iNodes(limit: Int, offset: Int, options: INodeOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [INodeSort!], where: INodeWhere): [INode!]!
              iNodesAggregate(where: INodeWhere): INodeAggregateSelection!
              iNodesConnection(after: String, first: Int, sort: [INodeSort!], where: INodeWhere): INodesConnection!
              iProducts(limit: Int, offset: Int, options: IProductOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [IProductSort!], where: IProductWhere): [IProduct!]!
              iProductsAggregate(where: IProductWhere): IProductAggregateSelection!
              iProductsConnection(after: String, first: Int, sort: [IProductSort!], where: IProductWhere): IProductsConnection!
              movies(limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
              series(limit: Int, offset: Int, options: SeriesOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [SeriesSort!], where: SeriesWhere): [Series!]!
              seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
              seriesConnection(after: String, first: Int, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
            }

            type Series implements INode & IProduct {
              genre(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), limit: Int, offset: Int, options: GenreOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [GenreSort!], where: GenreWhere): Genre!
              genreAggregate(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), where: GenreWhere): SeriesGenreGenreAggregationSelection
              genreConnection(after: String, directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), first: Int, sort: [SeriesGenreConnectionSort!], where: SeriesGenreConnectionWhere): SeriesGenreConnection!
              id: String!
              name: String!
            }

            type SeriesAggregateSelection {
              count: Int!
              id: StringAggregateSelection!
              name: StringAggregateSelection!
            }

            type SeriesConnection {
              edges: [SeriesEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesCreateInput {
              genre: SeriesGenreFieldInput
              id: String!
              name: String!
            }

            type SeriesCreatedEvent {
              createdSeries: SeriesEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input SeriesDeleteInput {
              genre: SeriesGenreDeleteFieldInput
            }

            type SeriesDeletedEvent {
              deletedSeries: SeriesEventPayload!
              event: EventType!
              timestamp: Float!
            }

            type SeriesEdge {
              cursor: String!
              node: Series!
            }

            type SeriesEventPayload {
              id: String!
              name: String!
            }

            input SeriesGenreAggregateInput {
              AND: [SeriesGenreAggregateInput!]
              NOT: SeriesGenreAggregateInput
              OR: [SeriesGenreAggregateInput!]
              count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: SeriesGenreNodeAggregationWhereInput
            }

            input SeriesGenreConnectFieldInput {
              connect: GenreConnectInput
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true @deprecated(reason: \\"The overwrite argument is deprecated and will be removed\\")
              where: GenreConnectWhere
            }

            input SeriesGenreConnectOrCreateFieldInput {
              onCreate: SeriesGenreConnectOrCreateFieldInputOnCreate!
              where: GenreConnectOrCreateWhere!
            }

            input SeriesGenreConnectOrCreateFieldInputOnCreate {
              node: GenreOnCreateInput!
            }

            type SeriesGenreConnection {
              edges: [SeriesGenreRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesGenreConnectionSort {
              node: GenreSort
            }

            input SeriesGenreConnectionWhere {
              AND: [SeriesGenreConnectionWhere!]
              NOT: SeriesGenreConnectionWhere
              OR: [SeriesGenreConnectionWhere!]
              node: GenreWhere
            }

            input SeriesGenreCreateFieldInput {
              node: GenreCreateInput!
            }

            input SeriesGenreDeleteFieldInput {
              delete: GenreDeleteInput
              where: SeriesGenreConnectionWhere
            }

            input SeriesGenreDisconnectFieldInput {
              disconnect: GenreDisconnectInput
              where: SeriesGenreConnectionWhere
            }

            input SeriesGenreFieldInput {
              connect: SeriesGenreConnectFieldInput
              connectOrCreate: SeriesGenreConnectOrCreateFieldInput @deprecated(reason: \\"The connectOrCreate operation is deprecated and will be removed\\")
              create: SeriesGenreCreateFieldInput
            }

            type SeriesGenreGenreAggregationSelection {
              count: Int!
              node: SeriesGenreGenreNodeAggregateSelection
            }

            type SeriesGenreGenreNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input SeriesGenreNodeAggregationWhereInput {
              AND: [SeriesGenreNodeAggregationWhereInput!]
              NOT: SeriesGenreNodeAggregationWhereInput
              OR: [SeriesGenreNodeAggregationWhereInput!]
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
            }

            type SeriesGenreRelationship {
              cursor: String!
              node: Genre!
            }

            input SeriesGenreUpdateConnectionInput {
              node: GenreUpdateInput
            }

            input SeriesGenreUpdateFieldInput {
              connect: SeriesGenreConnectFieldInput
              connectOrCreate: SeriesGenreConnectOrCreateFieldInput
              create: SeriesGenreCreateFieldInput
              delete: SeriesGenreDeleteFieldInput
              disconnect: SeriesGenreDisconnectFieldInput
              update: SeriesGenreUpdateConnectionInput
              where: SeriesGenreConnectionWhere
            }

            input SeriesOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more SeriesSort objects to sort Series by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [SeriesSort!]
            }

            \\"\\"\\"
            Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
            \\"\\"\\"
            input SeriesSort {
              id: SortDirection
              name: SortDirection
            }

            input SeriesSubscriptionWhere {
              AND: [SeriesSubscriptionWhere!]
              NOT: SeriesSubscriptionWhere
              OR: [SeriesSubscriptionWhere!]
              id: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_EQ: String
              id_IN: [String!]
              id_STARTS_WITH: String
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
            }

            input SeriesUpdateInput {
              genre: SeriesGenreUpdateFieldInput
              id: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              id_SET: String
              name: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              name_SET: String
            }

            type SeriesUpdatedEvent {
              event: EventType!
              previousState: SeriesEventPayload!
              timestamp: Float!
              updatedSeries: SeriesEventPayload!
            }

            input SeriesWhere {
              AND: [SeriesWhere!]
              NOT: SeriesWhere
              OR: [SeriesWhere!]
              genre: GenreWhere
              genreAggregate: SeriesGenreAggregateInput
              genreConnection: SeriesGenreConnectionWhere
              id: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_EQ: String
              id_IN: [String!]
              id_STARTS_WITH: String
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
            }

            \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            type StringAggregateSelection {
              longest: String
              shortest: String
            }

            type Subscription {
              genreCreated(where: GenreSubscriptionWhere): GenreCreatedEvent!
              genreDeleted(where: GenreSubscriptionWhere): GenreDeletedEvent!
              genreUpdated(where: GenreSubscriptionWhere): GenreUpdatedEvent!
              movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
              movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
              movieUpdated(where: MovieSubscriptionWhere): MovieUpdatedEvent!
              seriesCreated(where: SeriesSubscriptionWhere): SeriesCreatedEvent!
              seriesDeleted(where: SeriesSubscriptionWhere): SeriesDeletedEvent!
              seriesUpdated(where: SeriesSubscriptionWhere): SeriesUpdatedEvent!
            }

            type UpdateGenresMutationResponse {
              genres: [Genre!]!
              info: UpdateInfo!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created and deleted during an update mutation
            \\"\\"\\"
            type UpdateInfo {
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            type UpdateMoviesMutationResponse {
              info: UpdateInfo!
              movies: [Movie!]!
            }

            type UpdateSeriesMutationResponse {
              info: UpdateInfo!
              series: [Series!]!
            }"
        `);
    });

    test("Simple type definitions implementing just one interface", async () => {
        const typeDefs = gql`
            interface IProduct {
                id: String!

                name: String!
                genre: Genre!
            }

            type Movie implements IProduct @node {
                id: String!

                name: String!
                genre: Genre! @relationship(type: "HAS_GENRE", direction: OUT)
            }

            type Series implements IProduct @node {
                id: String!

                name: String!
                genre: Genre! @relationship(type: "HAS_GENRE", direction: OUT)
            }

            type Genre @node {
                name: String! @unique
                product: [IProduct!]! @relationship(type: "HAS_GENRE", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { subscriptions: new TestCDCEngine() } });

        const schema = await neoSchema.getSchema();
        const errors = validateSchema(schema);
        expect(errors).toHaveLength(0);

        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
              subscription: Subscription
            }

            type CreateGenresMutationResponse {
              genres: [Genre!]!
              info: CreateInfo!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateMoviesMutationResponse {
              info: CreateInfo!
              movies: [Movie!]!
            }

            type CreateSeriesMutationResponse {
              info: CreateInfo!
              series: [Series!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            enum EventType {
              CREATE
              CREATE_RELATIONSHIP
              DELETE
              DELETE_RELATIONSHIP
              UPDATE
            }

            type Genre {
              name: String!
              product(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), limit: Int, offset: Int, options: IProductOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [IProductSort!], where: IProductWhere): [IProduct!]!
              productAggregate(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), where: IProductWhere): GenreIProductProductAggregationSelection
              productConnection(after: String, directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), first: Int, sort: [GenreProductConnectionSort!], where: GenreProductConnectionWhere): GenreProductConnection!
            }

            type GenreAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
            }

            input GenreConnectInput {
              product: [GenreProductConnectFieldInput!]
            }

            input GenreConnectOrCreateWhere {
              node: GenreUniqueWhere!
            }

            input GenreConnectWhere {
              node: GenreWhere!
            }

            input GenreCreateInput {
              name: String!
              product: GenreProductFieldInput
            }

            type GenreCreatedEvent {
              createdGenre: GenreEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input GenreDeleteInput {
              product: [GenreProductDeleteFieldInput!]
            }

            type GenreDeletedEvent {
              deletedGenre: GenreEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input GenreDisconnectInput {
              product: [GenreProductDisconnectFieldInput!]
            }

            type GenreEdge {
              cursor: String!
              node: Genre!
            }

            type GenreEventPayload {
              name: String!
            }

            type GenreIProductProductAggregationSelection {
              count: Int!
              node: GenreIProductProductNodeAggregateSelection
            }

            type GenreIProductProductNodeAggregateSelection {
              id: StringAggregateSelection!
              name: StringAggregateSelection!
            }

            input GenreOnCreateInput {
              name: String!
            }

            input GenreOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more GenreSort objects to sort Genres by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [GenreSort!]
            }

            input GenreProductAggregateInput {
              AND: [GenreProductAggregateInput!]
              NOT: GenreProductAggregateInput
              OR: [GenreProductAggregateInput!]
              count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: GenreProductNodeAggregationWhereInput
            }

            input GenreProductConnectFieldInput {
              where: IProductConnectWhere
            }

            type GenreProductConnection {
              edges: [GenreProductRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input GenreProductConnectionSort {
              node: IProductSort
            }

            input GenreProductConnectionWhere {
              AND: [GenreProductConnectionWhere!]
              NOT: GenreProductConnectionWhere
              OR: [GenreProductConnectionWhere!]
              node: IProductWhere
            }

            input GenreProductCreateFieldInput {
              node: IProductCreateInput!
            }

            input GenreProductDeleteFieldInput {
              where: GenreProductConnectionWhere
            }

            input GenreProductDisconnectFieldInput {
              where: GenreProductConnectionWhere
            }

            input GenreProductFieldInput {
              connect: [GenreProductConnectFieldInput!]
              create: [GenreProductCreateFieldInput!]
            }

            input GenreProductNodeAggregationWhereInput {
              AND: [GenreProductNodeAggregationWhereInput!]
              NOT: GenreProductNodeAggregationWhereInput
              OR: [GenreProductNodeAggregationWhereInput!]
              id_AVERAGE_LENGTH_EQUAL: Float
              id_AVERAGE_LENGTH_GT: Float
              id_AVERAGE_LENGTH_GTE: Float
              id_AVERAGE_LENGTH_LT: Float
              id_AVERAGE_LENGTH_LTE: Float
              id_LONGEST_LENGTH_EQUAL: Int
              id_LONGEST_LENGTH_GT: Int
              id_LONGEST_LENGTH_GTE: Int
              id_LONGEST_LENGTH_LT: Int
              id_LONGEST_LENGTH_LTE: Int
              id_SHORTEST_LENGTH_EQUAL: Int
              id_SHORTEST_LENGTH_GT: Int
              id_SHORTEST_LENGTH_GTE: Int
              id_SHORTEST_LENGTH_LT: Int
              id_SHORTEST_LENGTH_LTE: Int
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
            }

            type GenreProductRelationship {
              cursor: String!
              node: IProduct!
            }

            input GenreProductUpdateConnectionInput {
              node: IProductUpdateInput
            }

            input GenreProductUpdateFieldInput {
              connect: [GenreProductConnectFieldInput!]
              create: [GenreProductCreateFieldInput!]
              delete: [GenreProductDeleteFieldInput!]
              disconnect: [GenreProductDisconnectFieldInput!]
              update: GenreProductUpdateConnectionInput
              where: GenreProductConnectionWhere
            }

            \\"\\"\\"
            Fields to sort Genres by. The order in which sorts are applied is not guaranteed when specifying many fields in one GenreSort object.
            \\"\\"\\"
            input GenreSort {
              name: SortDirection
            }

            input GenreSubscriptionWhere {
              AND: [GenreSubscriptionWhere!]
              NOT: GenreSubscriptionWhere
              OR: [GenreSubscriptionWhere!]
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
            }

            input GenreUniqueWhere {
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_EQ: String
            }

            input GenreUpdateInput {
              name: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              name_SET: String
              product: [GenreProductUpdateFieldInput!]
            }

            type GenreUpdatedEvent {
              event: EventType!
              previousState: GenreEventPayload!
              timestamp: Float!
              updatedGenre: GenreEventPayload!
            }

            input GenreWhere {
              AND: [GenreWhere!]
              NOT: GenreWhere
              OR: [GenreWhere!]
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
              productAggregate: GenreProductAggregateInput
              \\"\\"\\"
              Return Genres where all of the related GenreProductConnections match this filter
              \\"\\"\\"
              productConnection_ALL: GenreProductConnectionWhere
              \\"\\"\\"
              Return Genres where none of the related GenreProductConnections match this filter
              \\"\\"\\"
              productConnection_NONE: GenreProductConnectionWhere
              \\"\\"\\"
              Return Genres where one of the related GenreProductConnections match this filter
              \\"\\"\\"
              productConnection_SINGLE: GenreProductConnectionWhere
              \\"\\"\\"
              Return Genres where some of the related GenreProductConnections match this filter
              \\"\\"\\"
              productConnection_SOME: GenreProductConnectionWhere
              \\"\\"\\"Return Genres where all of the related IProducts match this filter\\"\\"\\"
              product_ALL: IProductWhere
              \\"\\"\\"Return Genres where none of the related IProducts match this filter\\"\\"\\"
              product_NONE: IProductWhere
              \\"\\"\\"Return Genres where one of the related IProducts match this filter\\"\\"\\"
              product_SINGLE: IProductWhere
              \\"\\"\\"Return Genres where some of the related IProducts match this filter\\"\\"\\"
              product_SOME: IProductWhere
            }

            type GenresConnection {
              edges: [GenreEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            interface IProduct {
              genre: Genre!
              id: String!
              name: String!
            }

            type IProductAggregateSelection {
              count: Int!
              id: StringAggregateSelection!
              name: StringAggregateSelection!
            }

            input IProductConnectWhere {
              node: IProductWhere!
            }

            input IProductCreateInput {
              Movie: MovieCreateInput
              Series: SeriesCreateInput
            }

            type IProductEdge {
              cursor: String!
              node: IProduct!
            }

            enum IProductImplementation {
              Movie
              Series
            }

            input IProductOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more IProductSort objects to sort IProducts by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [IProductSort!]
            }

            \\"\\"\\"
            Fields to sort IProducts by. The order in which sorts are applied is not guaranteed when specifying many fields in one IProductSort object.
            \\"\\"\\"
            input IProductSort {
              id: SortDirection
              name: SortDirection
            }

            input IProductUpdateInput {
              id: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              id_SET: String
              name: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              name_SET: String
            }

            input IProductWhere {
              AND: [IProductWhere!]
              NOT: IProductWhere
              OR: [IProductWhere!]
              id: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_EQ: String
              id_IN: [String!]
              id_STARTS_WITH: String
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
              typename_IN: [IProductImplementation!]
            }

            type IProductsConnection {
              edges: [IProductEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Movie implements IProduct {
              genre(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), limit: Int, offset: Int, options: GenreOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [GenreSort!], where: GenreWhere): Genre!
              genreAggregate(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), where: GenreWhere): MovieGenreGenreAggregationSelection
              genreConnection(after: String, directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), first: Int, sort: [MovieGenreConnectionSort!], where: MovieGenreConnectionWhere): MovieGenreConnection!
              id: String!
              name: String!
            }

            type MovieAggregateSelection {
              count: Int!
              id: StringAggregateSelection!
              name: StringAggregateSelection!
            }

            input MovieCreateInput {
              genre: MovieGenreFieldInput
              id: String!
              name: String!
            }

            type MovieCreatedEvent {
              createdMovie: MovieEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input MovieDeleteInput {
              genre: MovieGenreDeleteFieldInput
            }

            type MovieDeletedEvent {
              deletedMovie: MovieEventPayload!
              event: EventType!
              timestamp: Float!
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            type MovieEventPayload {
              id: String!
              name: String!
            }

            input MovieGenreAggregateInput {
              AND: [MovieGenreAggregateInput!]
              NOT: MovieGenreAggregateInput
              OR: [MovieGenreAggregateInput!]
              count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: MovieGenreNodeAggregationWhereInput
            }

            input MovieGenreConnectFieldInput {
              connect: GenreConnectInput
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true @deprecated(reason: \\"The overwrite argument is deprecated and will be removed\\")
              where: GenreConnectWhere
            }

            input MovieGenreConnectOrCreateFieldInput {
              onCreate: MovieGenreConnectOrCreateFieldInputOnCreate!
              where: GenreConnectOrCreateWhere!
            }

            input MovieGenreConnectOrCreateFieldInputOnCreate {
              node: GenreOnCreateInput!
            }

            type MovieGenreConnection {
              edges: [MovieGenreRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieGenreConnectionSort {
              node: GenreSort
            }

            input MovieGenreConnectionWhere {
              AND: [MovieGenreConnectionWhere!]
              NOT: MovieGenreConnectionWhere
              OR: [MovieGenreConnectionWhere!]
              node: GenreWhere
            }

            input MovieGenreCreateFieldInput {
              node: GenreCreateInput!
            }

            input MovieGenreDeleteFieldInput {
              delete: GenreDeleteInput
              where: MovieGenreConnectionWhere
            }

            input MovieGenreDisconnectFieldInput {
              disconnect: GenreDisconnectInput
              where: MovieGenreConnectionWhere
            }

            input MovieGenreFieldInput {
              connect: MovieGenreConnectFieldInput
              connectOrCreate: MovieGenreConnectOrCreateFieldInput @deprecated(reason: \\"The connectOrCreate operation is deprecated and will be removed\\")
              create: MovieGenreCreateFieldInput
            }

            type MovieGenreGenreAggregationSelection {
              count: Int!
              node: MovieGenreGenreNodeAggregateSelection
            }

            type MovieGenreGenreNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input MovieGenreNodeAggregationWhereInput {
              AND: [MovieGenreNodeAggregationWhereInput!]
              NOT: MovieGenreNodeAggregationWhereInput
              OR: [MovieGenreNodeAggregationWhereInput!]
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
            }

            type MovieGenreRelationship {
              cursor: String!
              node: Genre!
            }

            input MovieGenreUpdateConnectionInput {
              node: GenreUpdateInput
            }

            input MovieGenreUpdateFieldInput {
              connect: MovieGenreConnectFieldInput
              connectOrCreate: MovieGenreConnectOrCreateFieldInput
              create: MovieGenreCreateFieldInput
              delete: MovieGenreDeleteFieldInput
              disconnect: MovieGenreDisconnectFieldInput
              update: MovieGenreUpdateConnectionInput
              where: MovieGenreConnectionWhere
            }

            input MovieOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [MovieSort!]
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              id: SortDirection
              name: SortDirection
            }

            input MovieSubscriptionWhere {
              AND: [MovieSubscriptionWhere!]
              NOT: MovieSubscriptionWhere
              OR: [MovieSubscriptionWhere!]
              id: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_EQ: String
              id_IN: [String!]
              id_STARTS_WITH: String
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
            }

            input MovieUpdateInput {
              genre: MovieGenreUpdateFieldInput
              id: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              id_SET: String
              name: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              name_SET: String
            }

            type MovieUpdatedEvent {
              event: EventType!
              previousState: MovieEventPayload!
              timestamp: Float!
              updatedMovie: MovieEventPayload!
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              genre: GenreWhere
              genreAggregate: MovieGenreAggregateInput
              genreConnection: MovieGenreConnectionWhere
              id: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_EQ: String
              id_IN: [String!]
              id_STARTS_WITH: String
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
            }

            type MoviesConnection {
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createGenres(input: [GenreCreateInput!]!): CreateGenresMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
              deleteGenres(delete: GenreDeleteInput, where: GenreWhere): DeleteInfo!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              deleteSeries(delete: SeriesDeleteInput, where: SeriesWhere): DeleteInfo!
              updateGenres(update: GenreUpdateInput, where: GenreWhere): UpdateGenresMutationResponse!
              updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
              updateSeries(update: SeriesUpdateInput, where: SeriesWhere): UpdateSeriesMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              genres(limit: Int, offset: Int, options: GenreOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [GenreSort!], where: GenreWhere): [Genre!]!
              genresAggregate(where: GenreWhere): GenreAggregateSelection!
              genresConnection(after: String, first: Int, sort: [GenreSort!], where: GenreWhere): GenresConnection!
              iProducts(limit: Int, offset: Int, options: IProductOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [IProductSort!], where: IProductWhere): [IProduct!]!
              iProductsAggregate(where: IProductWhere): IProductAggregateSelection!
              iProductsConnection(after: String, first: Int, sort: [IProductSort!], where: IProductWhere): IProductsConnection!
              movies(limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
              series(limit: Int, offset: Int, options: SeriesOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [SeriesSort!], where: SeriesWhere): [Series!]!
              seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
              seriesConnection(after: String, first: Int, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
            }

            type Series implements IProduct {
              genre(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), limit: Int, offset: Int, options: GenreOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [GenreSort!], where: GenreWhere): Genre!
              genreAggregate(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), where: GenreWhere): SeriesGenreGenreAggregationSelection
              genreConnection(after: String, directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), first: Int, sort: [SeriesGenreConnectionSort!], where: SeriesGenreConnectionWhere): SeriesGenreConnection!
              id: String!
              name: String!
            }

            type SeriesAggregateSelection {
              count: Int!
              id: StringAggregateSelection!
              name: StringAggregateSelection!
            }

            type SeriesConnection {
              edges: [SeriesEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesCreateInput {
              genre: SeriesGenreFieldInput
              id: String!
              name: String!
            }

            type SeriesCreatedEvent {
              createdSeries: SeriesEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input SeriesDeleteInput {
              genre: SeriesGenreDeleteFieldInput
            }

            type SeriesDeletedEvent {
              deletedSeries: SeriesEventPayload!
              event: EventType!
              timestamp: Float!
            }

            type SeriesEdge {
              cursor: String!
              node: Series!
            }

            type SeriesEventPayload {
              id: String!
              name: String!
            }

            input SeriesGenreAggregateInput {
              AND: [SeriesGenreAggregateInput!]
              NOT: SeriesGenreAggregateInput
              OR: [SeriesGenreAggregateInput!]
              count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: SeriesGenreNodeAggregationWhereInput
            }

            input SeriesGenreConnectFieldInput {
              connect: GenreConnectInput
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true @deprecated(reason: \\"The overwrite argument is deprecated and will be removed\\")
              where: GenreConnectWhere
            }

            input SeriesGenreConnectOrCreateFieldInput {
              onCreate: SeriesGenreConnectOrCreateFieldInputOnCreate!
              where: GenreConnectOrCreateWhere!
            }

            input SeriesGenreConnectOrCreateFieldInputOnCreate {
              node: GenreOnCreateInput!
            }

            type SeriesGenreConnection {
              edges: [SeriesGenreRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesGenreConnectionSort {
              node: GenreSort
            }

            input SeriesGenreConnectionWhere {
              AND: [SeriesGenreConnectionWhere!]
              NOT: SeriesGenreConnectionWhere
              OR: [SeriesGenreConnectionWhere!]
              node: GenreWhere
            }

            input SeriesGenreCreateFieldInput {
              node: GenreCreateInput!
            }

            input SeriesGenreDeleteFieldInput {
              delete: GenreDeleteInput
              where: SeriesGenreConnectionWhere
            }

            input SeriesGenreDisconnectFieldInput {
              disconnect: GenreDisconnectInput
              where: SeriesGenreConnectionWhere
            }

            input SeriesGenreFieldInput {
              connect: SeriesGenreConnectFieldInput
              connectOrCreate: SeriesGenreConnectOrCreateFieldInput @deprecated(reason: \\"The connectOrCreate operation is deprecated and will be removed\\")
              create: SeriesGenreCreateFieldInput
            }

            type SeriesGenreGenreAggregationSelection {
              count: Int!
              node: SeriesGenreGenreNodeAggregateSelection
            }

            type SeriesGenreGenreNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input SeriesGenreNodeAggregationWhereInput {
              AND: [SeriesGenreNodeAggregationWhereInput!]
              NOT: SeriesGenreNodeAggregationWhereInput
              OR: [SeriesGenreNodeAggregationWhereInput!]
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
            }

            type SeriesGenreRelationship {
              cursor: String!
              node: Genre!
            }

            input SeriesGenreUpdateConnectionInput {
              node: GenreUpdateInput
            }

            input SeriesGenreUpdateFieldInput {
              connect: SeriesGenreConnectFieldInput
              connectOrCreate: SeriesGenreConnectOrCreateFieldInput
              create: SeriesGenreCreateFieldInput
              delete: SeriesGenreDeleteFieldInput
              disconnect: SeriesGenreDisconnectFieldInput
              update: SeriesGenreUpdateConnectionInput
              where: SeriesGenreConnectionWhere
            }

            input SeriesOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more SeriesSort objects to sort Series by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [SeriesSort!]
            }

            \\"\\"\\"
            Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
            \\"\\"\\"
            input SeriesSort {
              id: SortDirection
              name: SortDirection
            }

            input SeriesSubscriptionWhere {
              AND: [SeriesSubscriptionWhere!]
              NOT: SeriesSubscriptionWhere
              OR: [SeriesSubscriptionWhere!]
              id: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_EQ: String
              id_IN: [String!]
              id_STARTS_WITH: String
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
            }

            input SeriesUpdateInput {
              genre: SeriesGenreUpdateFieldInput
              id: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              id_SET: String
              name: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              name_SET: String
            }

            type SeriesUpdatedEvent {
              event: EventType!
              previousState: SeriesEventPayload!
              timestamp: Float!
              updatedSeries: SeriesEventPayload!
            }

            input SeriesWhere {
              AND: [SeriesWhere!]
              NOT: SeriesWhere
              OR: [SeriesWhere!]
              genre: GenreWhere
              genreAggregate: SeriesGenreAggregateInput
              genreConnection: SeriesGenreConnectionWhere
              id: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_EQ: String
              id_IN: [String!]
              id_STARTS_WITH: String
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
            }

            \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            type StringAggregateSelection {
              longest: String
              shortest: String
            }

            type Subscription {
              genreCreated(where: GenreSubscriptionWhere): GenreCreatedEvent!
              genreDeleted(where: GenreSubscriptionWhere): GenreDeletedEvent!
              genreUpdated(where: GenreSubscriptionWhere): GenreUpdatedEvent!
              movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
              movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
              movieUpdated(where: MovieSubscriptionWhere): MovieUpdatedEvent!
              seriesCreated(where: SeriesSubscriptionWhere): SeriesCreatedEvent!
              seriesDeleted(where: SeriesSubscriptionWhere): SeriesDeletedEvent!
              seriesUpdated(where: SeriesSubscriptionWhere): SeriesUpdatedEvent!
            }

            type UpdateGenresMutationResponse {
              genres: [Genre!]!
              info: UpdateInfo!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created and deleted during an update mutation
            \\"\\"\\"
            type UpdateInfo {
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            type UpdateMoviesMutationResponse {
              info: UpdateInfo!
              movies: [Movie!]!
            }

            type UpdateSeriesMutationResponse {
              info: UpdateInfo!
              series: [Series!]!
            }"
        `);
    });

    test("Simple type definitions implementing just one interface with different relationship properties", async () => {
        const typeDefs = gql`
            interface IProduct {
                id: String!

                name: String!
                genre: Genre! @declareRelationship
            }

            type Movie implements IProduct @node {
                id: String!

                name: String!
                genre: Genre! @relationship(type: "HAS_GENRE", direction: OUT, properties: "MovieProps")
            }

            type Series implements IProduct @node {
                id: String!

                name: String!
                genre: Genre! @relationship(type: "HAS_GENRE", direction: OUT, properties: "SeriesProps")
            }

            type MovieProps @relationshipProperties {
                year: Int!
            }

            type SeriesProps @relationshipProperties {
                episodes: Int
            }

            type Genre @node {
                name: String! @unique
                product: [IProduct!]! @relationship(type: "HAS_GENRE", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { subscriptions: new TestCDCEngine() } });

        const schema = await neoSchema.getSchema();
        const errors = validateSchema(schema);
        expect(errors).toHaveLength(0);

        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
              subscription: Subscription
            }

            type CreateGenresMutationResponse {
              genres: [Genre!]!
              info: CreateInfo!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateMoviesMutationResponse {
              info: CreateInfo!
              movies: [Movie!]!
            }

            type CreateSeriesMutationResponse {
              info: CreateInfo!
              series: [Series!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            enum EventType {
              CREATE
              CREATE_RELATIONSHIP
              DELETE
              DELETE_RELATIONSHIP
              UPDATE
            }

            type Genre {
              name: String!
              product(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), limit: Int, offset: Int, options: IProductOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [IProductSort!], where: IProductWhere): [IProduct!]!
              productAggregate(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), where: IProductWhere): GenreIProductProductAggregationSelection
              productConnection(after: String, directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), first: Int, sort: [GenreProductConnectionSort!], where: GenreProductConnectionWhere): GenreProductConnection!
            }

            type GenreAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
            }

            input GenreConnectInput {
              product: [GenreProductConnectFieldInput!]
            }

            input GenreConnectOrCreateWhere {
              node: GenreUniqueWhere!
            }

            input GenreConnectWhere {
              node: GenreWhere!
            }

            input GenreCreateInput {
              name: String!
              product: GenreProductFieldInput
            }

            type GenreCreatedEvent {
              createdGenre: GenreEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input GenreDeleteInput {
              product: [GenreProductDeleteFieldInput!]
            }

            type GenreDeletedEvent {
              deletedGenre: GenreEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input GenreDisconnectInput {
              product: [GenreProductDisconnectFieldInput!]
            }

            type GenreEdge {
              cursor: String!
              node: Genre!
            }

            type GenreEventPayload {
              name: String!
            }

            type GenreIProductProductAggregationSelection {
              count: Int!
              node: GenreIProductProductNodeAggregateSelection
            }

            type GenreIProductProductNodeAggregateSelection {
              id: StringAggregateSelection!
              name: StringAggregateSelection!
            }

            input GenreOnCreateInput {
              name: String!
            }

            input GenreOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more GenreSort objects to sort Genres by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [GenreSort!]
            }

            input GenreProductAggregateInput {
              AND: [GenreProductAggregateInput!]
              NOT: GenreProductAggregateInput
              OR: [GenreProductAggregateInput!]
              count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: GenreProductNodeAggregationWhereInput
            }

            input GenreProductConnectFieldInput {
              connect: IProductConnectInput
              where: IProductConnectWhere
            }

            type GenreProductConnection {
              edges: [GenreProductRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input GenreProductConnectionSort {
              node: IProductSort
            }

            input GenreProductConnectionWhere {
              AND: [GenreProductConnectionWhere!]
              NOT: GenreProductConnectionWhere
              OR: [GenreProductConnectionWhere!]
              node: IProductWhere
            }

            input GenreProductCreateFieldInput {
              node: IProductCreateInput!
            }

            input GenreProductDeleteFieldInput {
              delete: IProductDeleteInput
              where: GenreProductConnectionWhere
            }

            input GenreProductDisconnectFieldInput {
              disconnect: IProductDisconnectInput
              where: GenreProductConnectionWhere
            }

            input GenreProductFieldInput {
              connect: [GenreProductConnectFieldInput!]
              create: [GenreProductCreateFieldInput!]
            }

            input GenreProductNodeAggregationWhereInput {
              AND: [GenreProductNodeAggregationWhereInput!]
              NOT: GenreProductNodeAggregationWhereInput
              OR: [GenreProductNodeAggregationWhereInput!]
              id_AVERAGE_LENGTH_EQUAL: Float
              id_AVERAGE_LENGTH_GT: Float
              id_AVERAGE_LENGTH_GTE: Float
              id_AVERAGE_LENGTH_LT: Float
              id_AVERAGE_LENGTH_LTE: Float
              id_LONGEST_LENGTH_EQUAL: Int
              id_LONGEST_LENGTH_GT: Int
              id_LONGEST_LENGTH_GTE: Int
              id_LONGEST_LENGTH_LT: Int
              id_LONGEST_LENGTH_LTE: Int
              id_SHORTEST_LENGTH_EQUAL: Int
              id_SHORTEST_LENGTH_GT: Int
              id_SHORTEST_LENGTH_GTE: Int
              id_SHORTEST_LENGTH_LT: Int
              id_SHORTEST_LENGTH_LTE: Int
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
            }

            type GenreProductRelationship {
              cursor: String!
              node: IProduct!
            }

            input GenreProductUpdateConnectionInput {
              node: IProductUpdateInput
            }

            input GenreProductUpdateFieldInput {
              connect: [GenreProductConnectFieldInput!]
              create: [GenreProductCreateFieldInput!]
              delete: [GenreProductDeleteFieldInput!]
              disconnect: [GenreProductDisconnectFieldInput!]
              update: GenreProductUpdateConnectionInput
              where: GenreProductConnectionWhere
            }

            \\"\\"\\"
            Fields to sort Genres by. The order in which sorts are applied is not guaranteed when specifying many fields in one GenreSort object.
            \\"\\"\\"
            input GenreSort {
              name: SortDirection
            }

            input GenreSubscriptionWhere {
              AND: [GenreSubscriptionWhere!]
              NOT: GenreSubscriptionWhere
              OR: [GenreSubscriptionWhere!]
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
            }

            input GenreUniqueWhere {
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_EQ: String
            }

            input GenreUpdateInput {
              name: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              name_SET: String
              product: [GenreProductUpdateFieldInput!]
            }

            type GenreUpdatedEvent {
              event: EventType!
              previousState: GenreEventPayload!
              timestamp: Float!
              updatedGenre: GenreEventPayload!
            }

            input GenreWhere {
              AND: [GenreWhere!]
              NOT: GenreWhere
              OR: [GenreWhere!]
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
              productAggregate: GenreProductAggregateInput
              \\"\\"\\"
              Return Genres where all of the related GenreProductConnections match this filter
              \\"\\"\\"
              productConnection_ALL: GenreProductConnectionWhere
              \\"\\"\\"
              Return Genres where none of the related GenreProductConnections match this filter
              \\"\\"\\"
              productConnection_NONE: GenreProductConnectionWhere
              \\"\\"\\"
              Return Genres where one of the related GenreProductConnections match this filter
              \\"\\"\\"
              productConnection_SINGLE: GenreProductConnectionWhere
              \\"\\"\\"
              Return Genres where some of the related GenreProductConnections match this filter
              \\"\\"\\"
              productConnection_SOME: GenreProductConnectionWhere
              \\"\\"\\"Return Genres where all of the related IProducts match this filter\\"\\"\\"
              product_ALL: IProductWhere
              \\"\\"\\"Return Genres where none of the related IProducts match this filter\\"\\"\\"
              product_NONE: IProductWhere
              \\"\\"\\"Return Genres where one of the related IProducts match this filter\\"\\"\\"
              product_SINGLE: IProductWhere
              \\"\\"\\"Return Genres where some of the related IProducts match this filter\\"\\"\\"
              product_SOME: IProductWhere
            }

            type GenresConnection {
              edges: [GenreEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            interface IProduct {
              genre(limit: Int, offset: Int, options: GenreOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [GenreSort!], where: GenreWhere): Genre!
              genreConnection(after: String, first: Int, sort: [IProductGenreConnectionSort!], where: IProductGenreConnectionWhere): IProductGenreConnection!
              id: String!
              name: String!
            }

            type IProductAggregateSelection {
              count: Int!
              id: StringAggregateSelection!
              name: StringAggregateSelection!
            }

            input IProductConnectInput {
              genre: IProductGenreConnectFieldInput
            }

            input IProductConnectWhere {
              node: IProductWhere!
            }

            input IProductCreateInput {
              Movie: MovieCreateInput
              Series: SeriesCreateInput
            }

            input IProductDeleteInput {
              genre: IProductGenreDeleteFieldInput
            }

            input IProductDisconnectInput {
              genre: IProductGenreDisconnectFieldInput
            }

            type IProductEdge {
              cursor: String!
              node: IProduct!
            }

            input IProductGenreAggregateInput {
              AND: [IProductGenreAggregateInput!]
              NOT: IProductGenreAggregateInput
              OR: [IProductGenreAggregateInput!]
              count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: IProductGenreEdgeAggregationWhereInput
              node: IProductGenreNodeAggregationWhereInput
            }

            input IProductGenreConnectFieldInput {
              connect: GenreConnectInput
              edge: IProductGenreEdgeCreateInput!
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true @deprecated(reason: \\"The overwrite argument is deprecated and will be removed\\")
              where: GenreConnectWhere
            }

            input IProductGenreConnectOrCreateFieldInput {
              onCreate: IProductGenreConnectOrCreateFieldInputOnCreate!
              where: GenreConnectOrCreateWhere!
            }

            input IProductGenreConnectOrCreateFieldInputOnCreate {
              edge: IProductGenreEdgeCreateInput!
              node: GenreOnCreateInput!
            }

            type IProductGenreConnection {
              edges: [IProductGenreRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input IProductGenreConnectionSort {
              edge: IProductGenreEdgeSort
              node: GenreSort
            }

            input IProductGenreConnectionWhere {
              AND: [IProductGenreConnectionWhere!]
              NOT: IProductGenreConnectionWhere
              OR: [IProductGenreConnectionWhere!]
              edge: IProductGenreEdgeWhere
              node: GenreWhere
            }

            input IProductGenreCreateFieldInput {
              edge: IProductGenreEdgeCreateInput!
              node: GenreCreateInput!
            }

            input IProductGenreDeleteFieldInput {
              delete: GenreDeleteInput
              where: IProductGenreConnectionWhere
            }

            input IProductGenreDisconnectFieldInput {
              disconnect: GenreDisconnectInput
              where: IProductGenreConnectionWhere
            }

            input IProductGenreEdgeAggregationWhereInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              MovieProps: MoviePropsAggregationWhereInput
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              SeriesProps: SeriesPropsAggregationWhereInput
            }

            input IProductGenreEdgeCreateInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              MovieProps: MoviePropsCreateInput!
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              SeriesProps: SeriesPropsCreateInput
            }

            input IProductGenreEdgeSort {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              MovieProps: MoviePropsSort
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              SeriesProps: SeriesPropsSort
            }

            input IProductGenreEdgeUpdateInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              MovieProps: MoviePropsUpdateInput
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              SeriesProps: SeriesPropsUpdateInput
            }

            input IProductGenreEdgeWhere {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              MovieProps: MoviePropsWhere
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              SeriesProps: SeriesPropsWhere
            }

            input IProductGenreNodeAggregationWhereInput {
              AND: [IProductGenreNodeAggregationWhereInput!]
              NOT: IProductGenreNodeAggregationWhereInput
              OR: [IProductGenreNodeAggregationWhereInput!]
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
            }

            type IProductGenreRelationship {
              cursor: String!
              node: Genre!
              properties: IProductGenreRelationshipProperties!
            }

            union IProductGenreRelationshipProperties = MovieProps | SeriesProps

            input IProductGenreUpdateConnectionInput {
              edge: IProductGenreEdgeUpdateInput
              node: GenreUpdateInput
            }

            input IProductGenreUpdateFieldInput {
              connect: IProductGenreConnectFieldInput
              connectOrCreate: IProductGenreConnectOrCreateFieldInput
              create: IProductGenreCreateFieldInput
              delete: IProductGenreDeleteFieldInput
              disconnect: IProductGenreDisconnectFieldInput
              update: IProductGenreUpdateConnectionInput
              where: IProductGenreConnectionWhere
            }

            enum IProductImplementation {
              Movie
              Series
            }

            input IProductOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more IProductSort objects to sort IProducts by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [IProductSort!]
            }

            \\"\\"\\"
            Fields to sort IProducts by. The order in which sorts are applied is not guaranteed when specifying many fields in one IProductSort object.
            \\"\\"\\"
            input IProductSort {
              id: SortDirection
              name: SortDirection
            }

            input IProductUpdateInput {
              genre: IProductGenreUpdateFieldInput
              id: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              id_SET: String
              name: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              name_SET: String
            }

            input IProductWhere {
              AND: [IProductWhere!]
              NOT: IProductWhere
              OR: [IProductWhere!]
              genre: GenreWhere
              genreAggregate: IProductGenreAggregateInput
              genreConnection: IProductGenreConnectionWhere
              id: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_EQ: String
              id_IN: [String!]
              id_STARTS_WITH: String
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
              typename_IN: [IProductImplementation!]
            }

            type IProductsConnection {
              edges: [IProductEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            type Movie implements IProduct {
              genre(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), limit: Int, offset: Int, options: GenreOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [GenreSort!], where: GenreWhere): Genre!
              genreAggregate(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), where: GenreWhere): MovieGenreGenreAggregationSelection
              genreConnection(after: String, directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), first: Int, sort: [IProductGenreConnectionSort!], where: IProductGenreConnectionWhere): IProductGenreConnection!
              id: String!
              name: String!
            }

            type MovieAggregateSelection {
              count: Int!
              id: StringAggregateSelection!
              name: StringAggregateSelection!
            }

            input MovieCreateInput {
              genre: MovieGenreFieldInput
              id: String!
              name: String!
            }

            type MovieCreatedEvent {
              createdMovie: MovieEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input MovieDeleteInput {
              genre: IProductGenreDeleteFieldInput
            }

            type MovieDeletedEvent {
              deletedMovie: MovieEventPayload!
              event: EventType!
              timestamp: Float!
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            type MovieEventPayload {
              id: String!
              name: String!
            }

            input MovieGenreAggregateInput {
              AND: [MovieGenreAggregateInput!]
              NOT: MovieGenreAggregateInput
              OR: [MovieGenreAggregateInput!]
              count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: MoviePropsAggregationWhereInput
              node: MovieGenreNodeAggregationWhereInput
            }

            input MovieGenreConnectFieldInput {
              connect: GenreConnectInput
              edge: MoviePropsCreateInput!
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true @deprecated(reason: \\"The overwrite argument is deprecated and will be removed\\")
              where: GenreConnectWhere
            }

            input MovieGenreConnectOrCreateFieldInput {
              onCreate: MovieGenreConnectOrCreateFieldInputOnCreate!
              where: GenreConnectOrCreateWhere!
            }

            input MovieGenreConnectOrCreateFieldInputOnCreate {
              edge: MoviePropsCreateInput!
              node: GenreOnCreateInput!
            }

            input MovieGenreCreateFieldInput {
              edge: MoviePropsCreateInput!
              node: GenreCreateInput!
            }

            input MovieGenreFieldInput {
              connect: MovieGenreConnectFieldInput
              connectOrCreate: MovieGenreConnectOrCreateFieldInput @deprecated(reason: \\"The connectOrCreate operation is deprecated and will be removed\\")
              create: MovieGenreCreateFieldInput
            }

            type MovieGenreGenreAggregationSelection {
              count: Int!
              edge: MovieGenreGenreEdgeAggregateSelection
              node: MovieGenreGenreNodeAggregateSelection
            }

            type MovieGenreGenreEdgeAggregateSelection {
              year: IntAggregateSelection!
            }

            type MovieGenreGenreNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input MovieGenreNodeAggregationWhereInput {
              AND: [MovieGenreNodeAggregationWhereInput!]
              NOT: MovieGenreNodeAggregationWhereInput
              OR: [MovieGenreNodeAggregationWhereInput!]
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
            }

            input MovieGenreUpdateConnectionInput {
              edge: MoviePropsUpdateInput
              node: GenreUpdateInput
            }

            input MovieGenreUpdateFieldInput {
              connect: MovieGenreConnectFieldInput
              connectOrCreate: MovieGenreConnectOrCreateFieldInput
              create: MovieGenreCreateFieldInput
              delete: IProductGenreDeleteFieldInput
              disconnect: IProductGenreDisconnectFieldInput
              update: MovieGenreUpdateConnectionInput
              where: IProductGenreConnectionWhere
            }

            input MovieOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [MovieSort!]
            }

            \\"\\"\\"
            The edge properties for the following fields:
            * Movie.genre
            \\"\\"\\"
            type MovieProps {
              year: Int!
            }

            input MoviePropsAggregationWhereInput {
              AND: [MoviePropsAggregationWhereInput!]
              NOT: MoviePropsAggregationWhereInput
              OR: [MoviePropsAggregationWhereInput!]
              year_AVERAGE_EQUAL: Float
              year_AVERAGE_GT: Float
              year_AVERAGE_GTE: Float
              year_AVERAGE_LT: Float
              year_AVERAGE_LTE: Float
              year_MAX_EQUAL: Int
              year_MAX_GT: Int
              year_MAX_GTE: Int
              year_MAX_LT: Int
              year_MAX_LTE: Int
              year_MIN_EQUAL: Int
              year_MIN_GT: Int
              year_MIN_GTE: Int
              year_MIN_LT: Int
              year_MIN_LTE: Int
              year_SUM_EQUAL: Int
              year_SUM_GT: Int
              year_SUM_GTE: Int
              year_SUM_LT: Int
              year_SUM_LTE: Int
            }

            input MoviePropsCreateInput {
              year: Int!
            }

            input MoviePropsSort {
              year: SortDirection
            }

            input MoviePropsUpdateInput {
              year: Int @deprecated(reason: \\"Please use the explicit _SET field\\")
              year_DECREMENT: Int
              year_INCREMENT: Int
              year_SET: Int
            }

            input MoviePropsWhere {
              AND: [MoviePropsWhere!]
              NOT: MoviePropsWhere
              OR: [MoviePropsWhere!]
              year: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              year_EQ: Int
              year_GT: Int
              year_GTE: Int
              year_IN: [Int!]
              year_LT: Int
              year_LTE: Int
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              id: SortDirection
              name: SortDirection
            }

            input MovieSubscriptionWhere {
              AND: [MovieSubscriptionWhere!]
              NOT: MovieSubscriptionWhere
              OR: [MovieSubscriptionWhere!]
              id: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_EQ: String
              id_IN: [String!]
              id_STARTS_WITH: String
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
            }

            input MovieUpdateInput {
              genre: MovieGenreUpdateFieldInput
              id: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              id_SET: String
              name: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              name_SET: String
            }

            type MovieUpdatedEvent {
              event: EventType!
              previousState: MovieEventPayload!
              timestamp: Float!
              updatedMovie: MovieEventPayload!
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              genre: GenreWhere
              genreAggregate: MovieGenreAggregateInput
              genreConnection: IProductGenreConnectionWhere
              id: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_EQ: String
              id_IN: [String!]
              id_STARTS_WITH: String
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
            }

            type MoviesConnection {
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createGenres(input: [GenreCreateInput!]!): CreateGenresMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
              deleteGenres(delete: GenreDeleteInput, where: GenreWhere): DeleteInfo!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              deleteSeries(delete: SeriesDeleteInput, where: SeriesWhere): DeleteInfo!
              updateGenres(update: GenreUpdateInput, where: GenreWhere): UpdateGenresMutationResponse!
              updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
              updateSeries(update: SeriesUpdateInput, where: SeriesWhere): UpdateSeriesMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              genres(limit: Int, offset: Int, options: GenreOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [GenreSort!], where: GenreWhere): [Genre!]!
              genresAggregate(where: GenreWhere): GenreAggregateSelection!
              genresConnection(after: String, first: Int, sort: [GenreSort!], where: GenreWhere): GenresConnection!
              iProducts(limit: Int, offset: Int, options: IProductOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [IProductSort!], where: IProductWhere): [IProduct!]!
              iProductsAggregate(where: IProductWhere): IProductAggregateSelection!
              iProductsConnection(after: String, first: Int, sort: [IProductSort!], where: IProductWhere): IProductsConnection!
              movies(limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
              series(limit: Int, offset: Int, options: SeriesOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [SeriesSort!], where: SeriesWhere): [Series!]!
              seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
              seriesConnection(after: String, first: Int, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
            }

            type Series implements IProduct {
              genre(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), limit: Int, offset: Int, options: GenreOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [GenreSort!], where: GenreWhere): Genre!
              genreAggregate(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), where: GenreWhere): SeriesGenreGenreAggregationSelection
              genreConnection(after: String, directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), first: Int, sort: [IProductGenreConnectionSort!], where: IProductGenreConnectionWhere): IProductGenreConnection!
              id: String!
              name: String!
            }

            type SeriesAggregateSelection {
              count: Int!
              id: StringAggregateSelection!
              name: StringAggregateSelection!
            }

            type SeriesConnection {
              edges: [SeriesEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesCreateInput {
              genre: SeriesGenreFieldInput
              id: String!
              name: String!
            }

            type SeriesCreatedEvent {
              createdSeries: SeriesEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input SeriesDeleteInput {
              genre: IProductGenreDeleteFieldInput
            }

            type SeriesDeletedEvent {
              deletedSeries: SeriesEventPayload!
              event: EventType!
              timestamp: Float!
            }

            type SeriesEdge {
              cursor: String!
              node: Series!
            }

            type SeriesEventPayload {
              id: String!
              name: String!
            }

            input SeriesGenreAggregateInput {
              AND: [SeriesGenreAggregateInput!]
              NOT: SeriesGenreAggregateInput
              OR: [SeriesGenreAggregateInput!]
              count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: SeriesPropsAggregationWhereInput
              node: SeriesGenreNodeAggregationWhereInput
            }

            input SeriesGenreConnectFieldInput {
              connect: GenreConnectInput
              edge: SeriesPropsCreateInput
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true @deprecated(reason: \\"The overwrite argument is deprecated and will be removed\\")
              where: GenreConnectWhere
            }

            input SeriesGenreConnectOrCreateFieldInput {
              onCreate: SeriesGenreConnectOrCreateFieldInputOnCreate!
              where: GenreConnectOrCreateWhere!
            }

            input SeriesGenreConnectOrCreateFieldInputOnCreate {
              edge: SeriesPropsCreateInput
              node: GenreOnCreateInput!
            }

            input SeriesGenreCreateFieldInput {
              edge: SeriesPropsCreateInput
              node: GenreCreateInput!
            }

            input SeriesGenreFieldInput {
              connect: SeriesGenreConnectFieldInput
              connectOrCreate: SeriesGenreConnectOrCreateFieldInput @deprecated(reason: \\"The connectOrCreate operation is deprecated and will be removed\\")
              create: SeriesGenreCreateFieldInput
            }

            type SeriesGenreGenreAggregationSelection {
              count: Int!
              edge: SeriesGenreGenreEdgeAggregateSelection
              node: SeriesGenreGenreNodeAggregateSelection
            }

            type SeriesGenreGenreEdgeAggregateSelection {
              episodes: IntAggregateSelection!
            }

            type SeriesGenreGenreNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input SeriesGenreNodeAggregationWhereInput {
              AND: [SeriesGenreNodeAggregationWhereInput!]
              NOT: SeriesGenreNodeAggregationWhereInput
              OR: [SeriesGenreNodeAggregationWhereInput!]
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
            }

            input SeriesGenreUpdateConnectionInput {
              edge: SeriesPropsUpdateInput
              node: GenreUpdateInput
            }

            input SeriesGenreUpdateFieldInput {
              connect: SeriesGenreConnectFieldInput
              connectOrCreate: SeriesGenreConnectOrCreateFieldInput
              create: SeriesGenreCreateFieldInput
              delete: IProductGenreDeleteFieldInput
              disconnect: IProductGenreDisconnectFieldInput
              update: SeriesGenreUpdateConnectionInput
              where: IProductGenreConnectionWhere
            }

            input SeriesOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more SeriesSort objects to sort Series by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [SeriesSort!]
            }

            \\"\\"\\"
            The edge properties for the following fields:
            * Series.genre
            \\"\\"\\"
            type SeriesProps {
              episodes: Int
            }

            input SeriesPropsAggregationWhereInput {
              AND: [SeriesPropsAggregationWhereInput!]
              NOT: SeriesPropsAggregationWhereInput
              OR: [SeriesPropsAggregationWhereInput!]
              episodes_AVERAGE_EQUAL: Float
              episodes_AVERAGE_GT: Float
              episodes_AVERAGE_GTE: Float
              episodes_AVERAGE_LT: Float
              episodes_AVERAGE_LTE: Float
              episodes_MAX_EQUAL: Int
              episodes_MAX_GT: Int
              episodes_MAX_GTE: Int
              episodes_MAX_LT: Int
              episodes_MAX_LTE: Int
              episodes_MIN_EQUAL: Int
              episodes_MIN_GT: Int
              episodes_MIN_GTE: Int
              episodes_MIN_LT: Int
              episodes_MIN_LTE: Int
              episodes_SUM_EQUAL: Int
              episodes_SUM_GT: Int
              episodes_SUM_GTE: Int
              episodes_SUM_LT: Int
              episodes_SUM_LTE: Int
            }

            input SeriesPropsCreateInput {
              episodes: Int
            }

            input SeriesPropsSort {
              episodes: SortDirection
            }

            input SeriesPropsUpdateInput {
              episodes: Int @deprecated(reason: \\"Please use the explicit _SET field\\")
              episodes_DECREMENT: Int
              episodes_INCREMENT: Int
              episodes_SET: Int
            }

            input SeriesPropsWhere {
              AND: [SeriesPropsWhere!]
              NOT: SeriesPropsWhere
              OR: [SeriesPropsWhere!]
              episodes: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              episodes_EQ: Int
              episodes_GT: Int
              episodes_GTE: Int
              episodes_IN: [Int]
              episodes_LT: Int
              episodes_LTE: Int
            }

            \\"\\"\\"
            Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
            \\"\\"\\"
            input SeriesSort {
              id: SortDirection
              name: SortDirection
            }

            input SeriesSubscriptionWhere {
              AND: [SeriesSubscriptionWhere!]
              NOT: SeriesSubscriptionWhere
              OR: [SeriesSubscriptionWhere!]
              id: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_EQ: String
              id_IN: [String!]
              id_STARTS_WITH: String
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
            }

            input SeriesUpdateInput {
              genre: SeriesGenreUpdateFieldInput
              id: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              id_SET: String
              name: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              name_SET: String
            }

            type SeriesUpdatedEvent {
              event: EventType!
              previousState: SeriesEventPayload!
              timestamp: Float!
              updatedSeries: SeriesEventPayload!
            }

            input SeriesWhere {
              AND: [SeriesWhere!]
              NOT: SeriesWhere
              OR: [SeriesWhere!]
              genre: GenreWhere
              genreAggregate: SeriesGenreAggregateInput
              genreConnection: IProductGenreConnectionWhere
              id: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_EQ: String
              id_IN: [String!]
              id_STARTS_WITH: String
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
            }

            \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            type StringAggregateSelection {
              longest: String
              shortest: String
            }

            type Subscription {
              genreCreated(where: GenreSubscriptionWhere): GenreCreatedEvent!
              genreDeleted(where: GenreSubscriptionWhere): GenreDeletedEvent!
              genreUpdated(where: GenreSubscriptionWhere): GenreUpdatedEvent!
              movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
              movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
              movieUpdated(where: MovieSubscriptionWhere): MovieUpdatedEvent!
              seriesCreated(where: SeriesSubscriptionWhere): SeriesCreatedEvent!
              seriesDeleted(where: SeriesSubscriptionWhere): SeriesDeletedEvent!
              seriesUpdated(where: SeriesSubscriptionWhere): SeriesUpdatedEvent!
            }

            type UpdateGenresMutationResponse {
              genres: [Genre!]!
              info: UpdateInfo!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created and deleted during an update mutation
            \\"\\"\\"
            type UpdateInfo {
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            type UpdateMoviesMutationResponse {
              info: UpdateInfo!
              movies: [Movie!]!
            }

            type UpdateSeriesMutationResponse {
              info: UpdateInfo!
              series: [Series!]!
            }"
        `);
    });

    test("Simple type definitions implementing just one interface - relationship to union type", async () => {
        const typeDefs = gql`
            interface IProduct {
                id: String!

                name: String!
                genre: UGenre! @declareRelationship
            }

            type Movie implements IProduct @node {
                id: String!

                name: String!
                genre: UGenre! @relationship(type: "HAS_GENRE", direction: OUT, properties: "MovieProps")
            }

            type Series implements IProduct @node {
                id: String!

                name: String!
                genre: UGenre! @relationship(type: "HAS_GENRE", direction: OUT, properties: "SeriesProps")
            }

            type MovieProps @relationshipProperties {
                year: Int!
            }

            type SeriesProps @relationshipProperties {
                episodes: Int
            }

            union UGenre = Genre | Rating

            type Genre @node {
                name: String! @unique
                product: [IProduct!]! @relationship(type: "HAS_GENRE", direction: IN)
            }

            type Rating @node {
                number: Int! @unique
                product: [IProduct!]! @relationship(type: "HAS_RATING", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { subscriptions: new TestCDCEngine() } });

        const schema = await neoSchema.getSchema();
        const errors = validateSchema(schema);
        expect(errors).toHaveLength(0);

        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
              subscription: Subscription
            }

            type CreateGenresMutationResponse {
              genres: [Genre!]!
              info: CreateInfo!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateMoviesMutationResponse {
              info: CreateInfo!
              movies: [Movie!]!
            }

            type CreateRatingsMutationResponse {
              info: CreateInfo!
              ratings: [Rating!]!
            }

            type CreateSeriesMutationResponse {
              info: CreateInfo!
              series: [Series!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            enum EventType {
              CREATE
              CREATE_RELATIONSHIP
              DELETE
              DELETE_RELATIONSHIP
              UPDATE
            }

            type Genre {
              name: String!
              product(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), limit: Int, offset: Int, options: IProductOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [IProductSort!], where: IProductWhere): [IProduct!]!
              productAggregate(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), where: IProductWhere): GenreIProductProductAggregationSelection
              productConnection(after: String, directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), first: Int, sort: [GenreProductConnectionSort!], where: GenreProductConnectionWhere): GenreProductConnection!
            }

            type GenreAggregateSelection {
              count: Int!
              name: StringAggregateSelection!
            }

            input GenreConnectInput {
              product: [GenreProductConnectFieldInput!]
            }

            input GenreConnectOrCreateWhere {
              node: GenreUniqueWhere!
            }

            input GenreConnectWhere {
              node: GenreWhere!
            }

            input GenreCreateInput {
              name: String!
              product: GenreProductFieldInput
            }

            type GenreCreatedEvent {
              createdGenre: GenreEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input GenreDeleteInput {
              product: [GenreProductDeleteFieldInput!]
            }

            type GenreDeletedEvent {
              deletedGenre: GenreEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input GenreDisconnectInput {
              product: [GenreProductDisconnectFieldInput!]
            }

            type GenreEdge {
              cursor: String!
              node: Genre!
            }

            type GenreEventPayload {
              name: String!
            }

            type GenreIProductProductAggregationSelection {
              count: Int!
              node: GenreIProductProductNodeAggregateSelection
            }

            type GenreIProductProductNodeAggregateSelection {
              id: StringAggregateSelection!
              name: StringAggregateSelection!
            }

            input GenreOnCreateInput {
              name: String!
            }

            input GenreOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more GenreSort objects to sort Genres by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [GenreSort!]
            }

            input GenreProductAggregateInput {
              AND: [GenreProductAggregateInput!]
              NOT: GenreProductAggregateInput
              OR: [GenreProductAggregateInput!]
              count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: GenreProductNodeAggregationWhereInput
            }

            input GenreProductConnectFieldInput {
              connect: IProductConnectInput
              where: IProductConnectWhere
            }

            type GenreProductConnection {
              edges: [GenreProductRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input GenreProductConnectionSort {
              node: IProductSort
            }

            input GenreProductConnectionWhere {
              AND: [GenreProductConnectionWhere!]
              NOT: GenreProductConnectionWhere
              OR: [GenreProductConnectionWhere!]
              node: IProductWhere
            }

            input GenreProductCreateFieldInput {
              node: IProductCreateInput!
            }

            input GenreProductDeleteFieldInput {
              delete: IProductDeleteInput
              where: GenreProductConnectionWhere
            }

            input GenreProductDisconnectFieldInput {
              disconnect: IProductDisconnectInput
              where: GenreProductConnectionWhere
            }

            input GenreProductFieldInput {
              connect: [GenreProductConnectFieldInput!]
              create: [GenreProductCreateFieldInput!]
            }

            input GenreProductNodeAggregationWhereInput {
              AND: [GenreProductNodeAggregationWhereInput!]
              NOT: GenreProductNodeAggregationWhereInput
              OR: [GenreProductNodeAggregationWhereInput!]
              id_AVERAGE_LENGTH_EQUAL: Float
              id_AVERAGE_LENGTH_GT: Float
              id_AVERAGE_LENGTH_GTE: Float
              id_AVERAGE_LENGTH_LT: Float
              id_AVERAGE_LENGTH_LTE: Float
              id_LONGEST_LENGTH_EQUAL: Int
              id_LONGEST_LENGTH_GT: Int
              id_LONGEST_LENGTH_GTE: Int
              id_LONGEST_LENGTH_LT: Int
              id_LONGEST_LENGTH_LTE: Int
              id_SHORTEST_LENGTH_EQUAL: Int
              id_SHORTEST_LENGTH_GT: Int
              id_SHORTEST_LENGTH_GTE: Int
              id_SHORTEST_LENGTH_LT: Int
              id_SHORTEST_LENGTH_LTE: Int
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
            }

            type GenreProductRelationship {
              cursor: String!
              node: IProduct!
            }

            input GenreProductUpdateConnectionInput {
              node: IProductUpdateInput
            }

            input GenreProductUpdateFieldInput {
              connect: [GenreProductConnectFieldInput!]
              create: [GenreProductCreateFieldInput!]
              delete: [GenreProductDeleteFieldInput!]
              disconnect: [GenreProductDisconnectFieldInput!]
              update: GenreProductUpdateConnectionInput
              where: GenreProductConnectionWhere
            }

            \\"\\"\\"
            Fields to sort Genres by. The order in which sorts are applied is not guaranteed when specifying many fields in one GenreSort object.
            \\"\\"\\"
            input GenreSort {
              name: SortDirection
            }

            input GenreSubscriptionWhere {
              AND: [GenreSubscriptionWhere!]
              NOT: GenreSubscriptionWhere
              OR: [GenreSubscriptionWhere!]
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
            }

            input GenreUniqueWhere {
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_EQ: String
            }

            input GenreUpdateInput {
              name: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              name_SET: String
              product: [GenreProductUpdateFieldInput!]
            }

            type GenreUpdatedEvent {
              event: EventType!
              previousState: GenreEventPayload!
              timestamp: Float!
              updatedGenre: GenreEventPayload!
            }

            input GenreWhere {
              AND: [GenreWhere!]
              NOT: GenreWhere
              OR: [GenreWhere!]
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
              productAggregate: GenreProductAggregateInput
              \\"\\"\\"
              Return Genres where all of the related GenreProductConnections match this filter
              \\"\\"\\"
              productConnection_ALL: GenreProductConnectionWhere
              \\"\\"\\"
              Return Genres where none of the related GenreProductConnections match this filter
              \\"\\"\\"
              productConnection_NONE: GenreProductConnectionWhere
              \\"\\"\\"
              Return Genres where one of the related GenreProductConnections match this filter
              \\"\\"\\"
              productConnection_SINGLE: GenreProductConnectionWhere
              \\"\\"\\"
              Return Genres where some of the related GenreProductConnections match this filter
              \\"\\"\\"
              productConnection_SOME: GenreProductConnectionWhere
              \\"\\"\\"Return Genres where all of the related IProducts match this filter\\"\\"\\"
              product_ALL: IProductWhere
              \\"\\"\\"Return Genres where none of the related IProducts match this filter\\"\\"\\"
              product_NONE: IProductWhere
              \\"\\"\\"Return Genres where one of the related IProducts match this filter\\"\\"\\"
              product_SINGLE: IProductWhere
              \\"\\"\\"Return Genres where some of the related IProducts match this filter\\"\\"\\"
              product_SOME: IProductWhere
            }

            type GenresConnection {
              edges: [GenreEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            interface IProduct {
              genre(limit: Int, offset: Int, options: QueryOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), where: UGenreWhere): UGenre!
              genreConnection(after: String, first: Int, sort: [IProductGenreConnectionSort!], where: IProductGenreConnectionWhere): IProductGenreConnection!
              id: String!
              name: String!
            }

            type IProductAggregateSelection {
              count: Int!
              id: StringAggregateSelection!
              name: StringAggregateSelection!
            }

            input IProductConnectInput {
              genre: IProductGenreConnectInput
            }

            input IProductConnectWhere {
              node: IProductWhere!
            }

            input IProductCreateInput {
              Movie: MovieCreateInput
              Series: SeriesCreateInput
            }

            input IProductDeleteInput {
              genre: IProductGenreDeleteInput
            }

            input IProductDisconnectInput {
              genre: IProductGenreDisconnectInput
            }

            type IProductEdge {
              cursor: String!
              node: IProduct!
            }

            input IProductGenreConnectInput {
              Genre: IProductGenreGenreConnectFieldInput
              Rating: IProductGenreRatingConnectFieldInput
            }

            type IProductGenreConnection {
              edges: [IProductGenreRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input IProductGenreConnectionSort {
              edge: IProductGenreEdgeSort
            }

            input IProductGenreConnectionWhere {
              Genre: IProductGenreGenreConnectionWhere
              Rating: IProductGenreRatingConnectionWhere
            }

            input IProductGenreDeleteInput {
              Genre: IProductGenreGenreDeleteFieldInput
              Rating: IProductGenreRatingDeleteFieldInput
            }

            input IProductGenreDisconnectInput {
              Genre: IProductGenreGenreDisconnectFieldInput
              Rating: IProductGenreRatingDisconnectFieldInput
            }

            input IProductGenreEdgeCreateInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              MovieProps: MoviePropsCreateInput!
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              SeriesProps: SeriesPropsCreateInput
            }

            input IProductGenreEdgeSort {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              MovieProps: MoviePropsSort
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              SeriesProps: SeriesPropsSort
            }

            input IProductGenreEdgeUpdateInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              MovieProps: MoviePropsUpdateInput
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              SeriesProps: SeriesPropsUpdateInput
            }

            input IProductGenreEdgeWhere {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              MovieProps: MoviePropsWhere
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              SeriesProps: SeriesPropsWhere
            }

            input IProductGenreGenreConnectFieldInput {
              connect: GenreConnectInput
              edge: IProductGenreEdgeCreateInput!
              where: GenreConnectWhere
            }

            input IProductGenreGenreConnectOrCreateFieldInput {
              onCreate: IProductGenreGenreConnectOrCreateFieldInputOnCreate!
              where: GenreConnectOrCreateWhere!
            }

            input IProductGenreGenreConnectOrCreateFieldInputOnCreate {
              edge: IProductGenreEdgeCreateInput!
              node: GenreOnCreateInput!
            }

            input IProductGenreGenreConnectionWhere {
              AND: [IProductGenreGenreConnectionWhere!]
              NOT: IProductGenreGenreConnectionWhere
              OR: [IProductGenreGenreConnectionWhere!]
              edge: IProductGenreEdgeWhere
              node: GenreWhere
            }

            input IProductGenreGenreCreateFieldInput {
              edge: IProductGenreEdgeCreateInput!
              node: GenreCreateInput!
            }

            input IProductGenreGenreDeleteFieldInput {
              delete: GenreDeleteInput
              where: IProductGenreGenreConnectionWhere
            }

            input IProductGenreGenreDisconnectFieldInput {
              disconnect: GenreDisconnectInput
              where: IProductGenreGenreConnectionWhere
            }

            input IProductGenreGenreUpdateConnectionInput {
              edge: IProductGenreEdgeUpdateInput
              node: GenreUpdateInput
            }

            input IProductGenreGenreUpdateFieldInput {
              connect: IProductGenreGenreConnectFieldInput
              connectOrCreate: IProductGenreGenreConnectOrCreateFieldInput
              create: IProductGenreGenreCreateFieldInput
              delete: IProductGenreGenreDeleteFieldInput
              disconnect: IProductGenreGenreDisconnectFieldInput
              update: IProductGenreGenreUpdateConnectionInput
              where: IProductGenreGenreConnectionWhere
            }

            input IProductGenreRatingConnectFieldInput {
              connect: RatingConnectInput
              edge: IProductGenreEdgeCreateInput!
              where: RatingConnectWhere
            }

            input IProductGenreRatingConnectOrCreateFieldInput {
              onCreate: IProductGenreRatingConnectOrCreateFieldInputOnCreate!
              where: RatingConnectOrCreateWhere!
            }

            input IProductGenreRatingConnectOrCreateFieldInputOnCreate {
              edge: IProductGenreEdgeCreateInput!
              node: RatingOnCreateInput!
            }

            input IProductGenreRatingConnectionWhere {
              AND: [IProductGenreRatingConnectionWhere!]
              NOT: IProductGenreRatingConnectionWhere
              OR: [IProductGenreRatingConnectionWhere!]
              edge: IProductGenreEdgeWhere
              node: RatingWhere
            }

            input IProductGenreRatingCreateFieldInput {
              edge: IProductGenreEdgeCreateInput!
              node: RatingCreateInput!
            }

            input IProductGenreRatingDeleteFieldInput {
              delete: RatingDeleteInput
              where: IProductGenreRatingConnectionWhere
            }

            input IProductGenreRatingDisconnectFieldInput {
              disconnect: RatingDisconnectInput
              where: IProductGenreRatingConnectionWhere
            }

            input IProductGenreRatingUpdateConnectionInput {
              edge: IProductGenreEdgeUpdateInput
              node: RatingUpdateInput
            }

            input IProductGenreRatingUpdateFieldInput {
              connect: IProductGenreRatingConnectFieldInput
              connectOrCreate: IProductGenreRatingConnectOrCreateFieldInput
              create: IProductGenreRatingCreateFieldInput
              delete: IProductGenreRatingDeleteFieldInput
              disconnect: IProductGenreRatingDisconnectFieldInput
              update: IProductGenreRatingUpdateConnectionInput
              where: IProductGenreRatingConnectionWhere
            }

            type IProductGenreRelationship {
              cursor: String!
              node: UGenre!
              properties: IProductGenreRelationshipProperties!
            }

            union IProductGenreRelationshipProperties = MovieProps | SeriesProps

            input IProductGenreUpdateInput {
              Genre: IProductGenreGenreUpdateFieldInput
              Rating: IProductGenreRatingUpdateFieldInput
            }

            enum IProductImplementation {
              Movie
              Series
            }

            input IProductOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more IProductSort objects to sort IProducts by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [IProductSort!]
            }

            \\"\\"\\"
            Fields to sort IProducts by. The order in which sorts are applied is not guaranteed when specifying many fields in one IProductSort object.
            \\"\\"\\"
            input IProductSort {
              id: SortDirection
              name: SortDirection
            }

            input IProductUpdateInput {
              genre: IProductGenreUpdateInput
              id: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              id_SET: String
              name: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              name_SET: String
            }

            input IProductWhere {
              AND: [IProductWhere!]
              NOT: IProductWhere
              OR: [IProductWhere!]
              genre: UGenreWhere
              genreConnection: IProductGenreConnectionWhere
              id: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_EQ: String
              id_IN: [String!]
              id_STARTS_WITH: String
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
              typename_IN: [IProductImplementation!]
            }

            type IProductsConnection {
              edges: [IProductEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            type Movie implements IProduct {
              genre(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), limit: Int, offset: Int, options: QueryOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), where: UGenreWhere): UGenre!
              genreConnection(after: String, directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), first: Int, sort: [IProductGenreConnectionSort!], where: IProductGenreConnectionWhere): IProductGenreConnection!
              id: String!
              name: String!
            }

            type MovieAggregateSelection {
              count: Int!
              id: StringAggregateSelection!
              name: StringAggregateSelection!
            }

            input MovieCreateInput {
              genre: MovieGenreCreateInput
              id: String!
              name: String!
            }

            type MovieCreatedEvent {
              createdMovie: MovieEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input MovieDeleteInput {
              genre: MovieGenreDeleteInput
            }

            type MovieDeletedEvent {
              deletedMovie: MovieEventPayload!
              event: EventType!
              timestamp: Float!
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            type MovieEventPayload {
              id: String!
              name: String!
            }

            input MovieGenreCreateInput {
              Genre: MovieGenreGenreFieldInput
              Rating: MovieGenreRatingFieldInput
            }

            input MovieGenreDeleteInput {
              Genre: IProductGenreGenreDeleteFieldInput
              Rating: IProductGenreRatingDeleteFieldInput
            }

            input MovieGenreGenreConnectFieldInput {
              connect: GenreConnectInput
              edge: MoviePropsCreateInput!
              where: GenreConnectWhere
            }

            input MovieGenreGenreConnectOrCreateFieldInput {
              onCreate: MovieGenreGenreConnectOrCreateFieldInputOnCreate!
              where: GenreConnectOrCreateWhere!
            }

            input MovieGenreGenreConnectOrCreateFieldInputOnCreate {
              edge: MoviePropsCreateInput!
              node: GenreOnCreateInput!
            }

            input MovieGenreGenreCreateFieldInput {
              edge: MoviePropsCreateInput!
              node: GenreCreateInput!
            }

            input MovieGenreGenreFieldInput {
              connect: MovieGenreGenreConnectFieldInput
              connectOrCreate: MovieGenreGenreConnectOrCreateFieldInput @deprecated(reason: \\"The connectOrCreate operation is deprecated and will be removed\\")
              create: MovieGenreGenreCreateFieldInput
            }

            input MovieGenreGenreUpdateConnectionInput {
              edge: MoviePropsUpdateInput
              node: GenreUpdateInput
            }

            input MovieGenreGenreUpdateFieldInput {
              connect: MovieGenreGenreConnectFieldInput
              connectOrCreate: MovieGenreGenreConnectOrCreateFieldInput
              create: MovieGenreGenreCreateFieldInput
              delete: IProductGenreGenreDeleteFieldInput
              disconnect: IProductGenreGenreDisconnectFieldInput
              update: MovieGenreGenreUpdateConnectionInput
              where: IProductGenreGenreConnectionWhere
            }

            input MovieGenreRatingConnectFieldInput {
              connect: RatingConnectInput
              edge: MoviePropsCreateInput!
              where: RatingConnectWhere
            }

            input MovieGenreRatingConnectOrCreateFieldInput {
              onCreate: MovieGenreRatingConnectOrCreateFieldInputOnCreate!
              where: RatingConnectOrCreateWhere!
            }

            input MovieGenreRatingConnectOrCreateFieldInputOnCreate {
              edge: MoviePropsCreateInput!
              node: RatingOnCreateInput!
            }

            input MovieGenreRatingCreateFieldInput {
              edge: MoviePropsCreateInput!
              node: RatingCreateInput!
            }

            input MovieGenreRatingFieldInput {
              connect: MovieGenreRatingConnectFieldInput
              connectOrCreate: MovieGenreRatingConnectOrCreateFieldInput @deprecated(reason: \\"The connectOrCreate operation is deprecated and will be removed\\")
              create: MovieGenreRatingCreateFieldInput
            }

            input MovieGenreRatingUpdateConnectionInput {
              edge: MoviePropsUpdateInput
              node: RatingUpdateInput
            }

            input MovieGenreRatingUpdateFieldInput {
              connect: MovieGenreRatingConnectFieldInput
              connectOrCreate: MovieGenreRatingConnectOrCreateFieldInput
              create: MovieGenreRatingCreateFieldInput
              delete: IProductGenreRatingDeleteFieldInput
              disconnect: IProductGenreRatingDisconnectFieldInput
              update: MovieGenreRatingUpdateConnectionInput
              where: IProductGenreRatingConnectionWhere
            }

            input MovieGenreUpdateInput {
              Genre: MovieGenreGenreUpdateFieldInput
              Rating: MovieGenreRatingUpdateFieldInput
            }

            input MovieOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [MovieSort!]
            }

            \\"\\"\\"
            The edge properties for the following fields:
            * Movie.genre
            \\"\\"\\"
            type MovieProps {
              year: Int!
            }

            input MoviePropsCreateInput {
              year: Int!
            }

            input MoviePropsSort {
              year: SortDirection
            }

            input MoviePropsUpdateInput {
              year: Int @deprecated(reason: \\"Please use the explicit _SET field\\")
              year_DECREMENT: Int
              year_INCREMENT: Int
              year_SET: Int
            }

            input MoviePropsWhere {
              AND: [MoviePropsWhere!]
              NOT: MoviePropsWhere
              OR: [MoviePropsWhere!]
              year: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              year_EQ: Int
              year_GT: Int
              year_GTE: Int
              year_IN: [Int!]
              year_LT: Int
              year_LTE: Int
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              id: SortDirection
              name: SortDirection
            }

            input MovieSubscriptionWhere {
              AND: [MovieSubscriptionWhere!]
              NOT: MovieSubscriptionWhere
              OR: [MovieSubscriptionWhere!]
              id: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_EQ: String
              id_IN: [String!]
              id_STARTS_WITH: String
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
            }

            input MovieUpdateInput {
              genre: MovieGenreUpdateInput
              id: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              id_SET: String
              name: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              name_SET: String
            }

            type MovieUpdatedEvent {
              event: EventType!
              previousState: MovieEventPayload!
              timestamp: Float!
              updatedMovie: MovieEventPayload!
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              genre: UGenreWhere
              genreConnection: IProductGenreConnectionWhere
              id: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_EQ: String
              id_IN: [String!]
              id_STARTS_WITH: String
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
            }

            type MoviesConnection {
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createGenres(input: [GenreCreateInput!]!): CreateGenresMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              createRatings(input: [RatingCreateInput!]!): CreateRatingsMutationResponse!
              createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
              deleteGenres(delete: GenreDeleteInput, where: GenreWhere): DeleteInfo!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              deleteRatings(delete: RatingDeleteInput, where: RatingWhere): DeleteInfo!
              deleteSeries(delete: SeriesDeleteInput, where: SeriesWhere): DeleteInfo!
              updateGenres(update: GenreUpdateInput, where: GenreWhere): UpdateGenresMutationResponse!
              updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
              updateRatings(update: RatingUpdateInput, where: RatingWhere): UpdateRatingsMutationResponse!
              updateSeries(update: SeriesUpdateInput, where: SeriesWhere): UpdateSeriesMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              genres(limit: Int, offset: Int, options: GenreOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [GenreSort!], where: GenreWhere): [Genre!]!
              genresAggregate(where: GenreWhere): GenreAggregateSelection!
              genresConnection(after: String, first: Int, sort: [GenreSort!], where: GenreWhere): GenresConnection!
              iProducts(limit: Int, offset: Int, options: IProductOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [IProductSort!], where: IProductWhere): [IProduct!]!
              iProductsAggregate(where: IProductWhere): IProductAggregateSelection!
              iProductsConnection(after: String, first: Int, sort: [IProductSort!], where: IProductWhere): IProductsConnection!
              movies(limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
              ratings(limit: Int, offset: Int, options: RatingOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [RatingSort!], where: RatingWhere): [Rating!]!
              ratingsAggregate(where: RatingWhere): RatingAggregateSelection!
              ratingsConnection(after: String, first: Int, sort: [RatingSort!], where: RatingWhere): RatingsConnection!
              series(limit: Int, offset: Int, options: SeriesOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [SeriesSort!], where: SeriesWhere): [Series!]!
              seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
              seriesConnection(after: String, first: Int, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
              uGenres(limit: Int, offset: Int, options: QueryOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), where: UGenreWhere): [UGenre!]!
            }

            \\"\\"\\"Input type for options that can be specified on a query operation.\\"\\"\\"
            input QueryOptions {
              limit: Int
              offset: Int
            }

            type Rating {
              number: Int!
              product(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), limit: Int, offset: Int, options: IProductOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [IProductSort!], where: IProductWhere): [IProduct!]!
              productAggregate(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), where: IProductWhere): RatingIProductProductAggregationSelection
              productConnection(after: String, directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), first: Int, sort: [RatingProductConnectionSort!], where: RatingProductConnectionWhere): RatingProductConnection!
            }

            type RatingAggregateSelection {
              count: Int!
              number: IntAggregateSelection!
            }

            input RatingConnectInput {
              product: [RatingProductConnectFieldInput!]
            }

            input RatingConnectOrCreateWhere {
              node: RatingUniqueWhere!
            }

            input RatingConnectWhere {
              node: RatingWhere!
            }

            input RatingCreateInput {
              number: Int!
              product: RatingProductFieldInput
            }

            type RatingCreatedEvent {
              createdRating: RatingEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input RatingDeleteInput {
              product: [RatingProductDeleteFieldInput!]
            }

            type RatingDeletedEvent {
              deletedRating: RatingEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input RatingDisconnectInput {
              product: [RatingProductDisconnectFieldInput!]
            }

            type RatingEdge {
              cursor: String!
              node: Rating!
            }

            type RatingEventPayload {
              number: Int!
            }

            type RatingIProductProductAggregationSelection {
              count: Int!
              node: RatingIProductProductNodeAggregateSelection
            }

            type RatingIProductProductNodeAggregateSelection {
              id: StringAggregateSelection!
              name: StringAggregateSelection!
            }

            input RatingOnCreateInput {
              number: Int!
            }

            input RatingOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more RatingSort objects to sort Ratings by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [RatingSort!]
            }

            input RatingProductAggregateInput {
              AND: [RatingProductAggregateInput!]
              NOT: RatingProductAggregateInput
              OR: [RatingProductAggregateInput!]
              count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: RatingProductNodeAggregationWhereInput
            }

            input RatingProductConnectFieldInput {
              connect: IProductConnectInput
              where: IProductConnectWhere
            }

            type RatingProductConnection {
              edges: [RatingProductRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input RatingProductConnectionSort {
              node: IProductSort
            }

            input RatingProductConnectionWhere {
              AND: [RatingProductConnectionWhere!]
              NOT: RatingProductConnectionWhere
              OR: [RatingProductConnectionWhere!]
              node: IProductWhere
            }

            input RatingProductCreateFieldInput {
              node: IProductCreateInput!
            }

            input RatingProductDeleteFieldInput {
              delete: IProductDeleteInput
              where: RatingProductConnectionWhere
            }

            input RatingProductDisconnectFieldInput {
              disconnect: IProductDisconnectInput
              where: RatingProductConnectionWhere
            }

            input RatingProductFieldInput {
              connect: [RatingProductConnectFieldInput!]
              create: [RatingProductCreateFieldInput!]
            }

            input RatingProductNodeAggregationWhereInput {
              AND: [RatingProductNodeAggregationWhereInput!]
              NOT: RatingProductNodeAggregationWhereInput
              OR: [RatingProductNodeAggregationWhereInput!]
              id_AVERAGE_LENGTH_EQUAL: Float
              id_AVERAGE_LENGTH_GT: Float
              id_AVERAGE_LENGTH_GTE: Float
              id_AVERAGE_LENGTH_LT: Float
              id_AVERAGE_LENGTH_LTE: Float
              id_LONGEST_LENGTH_EQUAL: Int
              id_LONGEST_LENGTH_GT: Int
              id_LONGEST_LENGTH_GTE: Int
              id_LONGEST_LENGTH_LT: Int
              id_LONGEST_LENGTH_LTE: Int
              id_SHORTEST_LENGTH_EQUAL: Int
              id_SHORTEST_LENGTH_GT: Int
              id_SHORTEST_LENGTH_GTE: Int
              id_SHORTEST_LENGTH_LT: Int
              id_SHORTEST_LENGTH_LTE: Int
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
            }

            type RatingProductRelationship {
              cursor: String!
              node: IProduct!
            }

            input RatingProductUpdateConnectionInput {
              node: IProductUpdateInput
            }

            input RatingProductUpdateFieldInput {
              connect: [RatingProductConnectFieldInput!]
              create: [RatingProductCreateFieldInput!]
              delete: [RatingProductDeleteFieldInput!]
              disconnect: [RatingProductDisconnectFieldInput!]
              update: RatingProductUpdateConnectionInput
              where: RatingProductConnectionWhere
            }

            \\"\\"\\"
            Fields to sort Ratings by. The order in which sorts are applied is not guaranteed when specifying many fields in one RatingSort object.
            \\"\\"\\"
            input RatingSort {
              number: SortDirection
            }

            input RatingSubscriptionWhere {
              AND: [RatingSubscriptionWhere!]
              NOT: RatingSubscriptionWhere
              OR: [RatingSubscriptionWhere!]
              number: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              number_EQ: Int
              number_GT: Int
              number_GTE: Int
              number_IN: [Int!]
              number_LT: Int
              number_LTE: Int
            }

            input RatingUniqueWhere {
              number: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              number_EQ: Int
            }

            input RatingUpdateInput {
              number: Int @deprecated(reason: \\"Please use the explicit _SET field\\")
              number_DECREMENT: Int
              number_INCREMENT: Int
              number_SET: Int
              product: [RatingProductUpdateFieldInput!]
            }

            type RatingUpdatedEvent {
              event: EventType!
              previousState: RatingEventPayload!
              timestamp: Float!
              updatedRating: RatingEventPayload!
            }

            input RatingWhere {
              AND: [RatingWhere!]
              NOT: RatingWhere
              OR: [RatingWhere!]
              number: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              number_EQ: Int
              number_GT: Int
              number_GTE: Int
              number_IN: [Int!]
              number_LT: Int
              number_LTE: Int
              productAggregate: RatingProductAggregateInput
              \\"\\"\\"
              Return Ratings where all of the related RatingProductConnections match this filter
              \\"\\"\\"
              productConnection_ALL: RatingProductConnectionWhere
              \\"\\"\\"
              Return Ratings where none of the related RatingProductConnections match this filter
              \\"\\"\\"
              productConnection_NONE: RatingProductConnectionWhere
              \\"\\"\\"
              Return Ratings where one of the related RatingProductConnections match this filter
              \\"\\"\\"
              productConnection_SINGLE: RatingProductConnectionWhere
              \\"\\"\\"
              Return Ratings where some of the related RatingProductConnections match this filter
              \\"\\"\\"
              productConnection_SOME: RatingProductConnectionWhere
              \\"\\"\\"Return Ratings where all of the related IProducts match this filter\\"\\"\\"
              product_ALL: IProductWhere
              \\"\\"\\"Return Ratings where none of the related IProducts match this filter\\"\\"\\"
              product_NONE: IProductWhere
              \\"\\"\\"Return Ratings where one of the related IProducts match this filter\\"\\"\\"
              product_SINGLE: IProductWhere
              \\"\\"\\"Return Ratings where some of the related IProducts match this filter\\"\\"\\"
              product_SOME: IProductWhere
            }

            type RatingsConnection {
              edges: [RatingEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Series implements IProduct {
              genre(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), limit: Int, offset: Int, options: QueryOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), where: UGenreWhere): UGenre!
              genreConnection(after: String, directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), first: Int, sort: [IProductGenreConnectionSort!], where: IProductGenreConnectionWhere): IProductGenreConnection!
              id: String!
              name: String!
            }

            type SeriesAggregateSelection {
              count: Int!
              id: StringAggregateSelection!
              name: StringAggregateSelection!
            }

            type SeriesConnection {
              edges: [SeriesEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesCreateInput {
              genre: SeriesGenreCreateInput
              id: String!
              name: String!
            }

            type SeriesCreatedEvent {
              createdSeries: SeriesEventPayload!
              event: EventType!
              timestamp: Float!
            }

            input SeriesDeleteInput {
              genre: SeriesGenreDeleteInput
            }

            type SeriesDeletedEvent {
              deletedSeries: SeriesEventPayload!
              event: EventType!
              timestamp: Float!
            }

            type SeriesEdge {
              cursor: String!
              node: Series!
            }

            type SeriesEventPayload {
              id: String!
              name: String!
            }

            input SeriesGenreCreateInput {
              Genre: SeriesGenreGenreFieldInput
              Rating: SeriesGenreRatingFieldInput
            }

            input SeriesGenreDeleteInput {
              Genre: IProductGenreGenreDeleteFieldInput
              Rating: IProductGenreRatingDeleteFieldInput
            }

            input SeriesGenreGenreConnectFieldInput {
              connect: GenreConnectInput
              edge: SeriesPropsCreateInput
              where: GenreConnectWhere
            }

            input SeriesGenreGenreConnectOrCreateFieldInput {
              onCreate: SeriesGenreGenreConnectOrCreateFieldInputOnCreate!
              where: GenreConnectOrCreateWhere!
            }

            input SeriesGenreGenreConnectOrCreateFieldInputOnCreate {
              edge: SeriesPropsCreateInput
              node: GenreOnCreateInput!
            }

            input SeriesGenreGenreCreateFieldInput {
              edge: SeriesPropsCreateInput
              node: GenreCreateInput!
            }

            input SeriesGenreGenreFieldInput {
              connect: SeriesGenreGenreConnectFieldInput
              connectOrCreate: SeriesGenreGenreConnectOrCreateFieldInput @deprecated(reason: \\"The connectOrCreate operation is deprecated and will be removed\\")
              create: SeriesGenreGenreCreateFieldInput
            }

            input SeriesGenreGenreUpdateConnectionInput {
              edge: SeriesPropsUpdateInput
              node: GenreUpdateInput
            }

            input SeriesGenreGenreUpdateFieldInput {
              connect: SeriesGenreGenreConnectFieldInput
              connectOrCreate: SeriesGenreGenreConnectOrCreateFieldInput
              create: SeriesGenreGenreCreateFieldInput
              delete: IProductGenreGenreDeleteFieldInput
              disconnect: IProductGenreGenreDisconnectFieldInput
              update: SeriesGenreGenreUpdateConnectionInput
              where: IProductGenreGenreConnectionWhere
            }

            input SeriesGenreRatingConnectFieldInput {
              connect: RatingConnectInput
              edge: SeriesPropsCreateInput
              where: RatingConnectWhere
            }

            input SeriesGenreRatingConnectOrCreateFieldInput {
              onCreate: SeriesGenreRatingConnectOrCreateFieldInputOnCreate!
              where: RatingConnectOrCreateWhere!
            }

            input SeriesGenreRatingConnectOrCreateFieldInputOnCreate {
              edge: SeriesPropsCreateInput
              node: RatingOnCreateInput!
            }

            input SeriesGenreRatingCreateFieldInput {
              edge: SeriesPropsCreateInput
              node: RatingCreateInput!
            }

            input SeriesGenreRatingFieldInput {
              connect: SeriesGenreRatingConnectFieldInput
              connectOrCreate: SeriesGenreRatingConnectOrCreateFieldInput @deprecated(reason: \\"The connectOrCreate operation is deprecated and will be removed\\")
              create: SeriesGenreRatingCreateFieldInput
            }

            input SeriesGenreRatingUpdateConnectionInput {
              edge: SeriesPropsUpdateInput
              node: RatingUpdateInput
            }

            input SeriesGenreRatingUpdateFieldInput {
              connect: SeriesGenreRatingConnectFieldInput
              connectOrCreate: SeriesGenreRatingConnectOrCreateFieldInput
              create: SeriesGenreRatingCreateFieldInput
              delete: IProductGenreRatingDeleteFieldInput
              disconnect: IProductGenreRatingDisconnectFieldInput
              update: SeriesGenreRatingUpdateConnectionInput
              where: IProductGenreRatingConnectionWhere
            }

            input SeriesGenreUpdateInput {
              Genre: SeriesGenreGenreUpdateFieldInput
              Rating: SeriesGenreRatingUpdateFieldInput
            }

            input SeriesOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more SeriesSort objects to sort Series by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [SeriesSort!]
            }

            \\"\\"\\"
            The edge properties for the following fields:
            * Series.genre
            \\"\\"\\"
            type SeriesProps {
              episodes: Int
            }

            input SeriesPropsCreateInput {
              episodes: Int
            }

            input SeriesPropsSort {
              episodes: SortDirection
            }

            input SeriesPropsUpdateInput {
              episodes: Int @deprecated(reason: \\"Please use the explicit _SET field\\")
              episodes_DECREMENT: Int
              episodes_INCREMENT: Int
              episodes_SET: Int
            }

            input SeriesPropsWhere {
              AND: [SeriesPropsWhere!]
              NOT: SeriesPropsWhere
              OR: [SeriesPropsWhere!]
              episodes: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              episodes_EQ: Int
              episodes_GT: Int
              episodes_GTE: Int
              episodes_IN: [Int]
              episodes_LT: Int
              episodes_LTE: Int
            }

            \\"\\"\\"
            Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
            \\"\\"\\"
            input SeriesSort {
              id: SortDirection
              name: SortDirection
            }

            input SeriesSubscriptionWhere {
              AND: [SeriesSubscriptionWhere!]
              NOT: SeriesSubscriptionWhere
              OR: [SeriesSubscriptionWhere!]
              id: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_EQ: String
              id_IN: [String!]
              id_STARTS_WITH: String
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
            }

            input SeriesUpdateInput {
              genre: SeriesGenreUpdateInput
              id: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              id_SET: String
              name: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              name_SET: String
            }

            type SeriesUpdatedEvent {
              event: EventType!
              previousState: SeriesEventPayload!
              timestamp: Float!
              updatedSeries: SeriesEventPayload!
            }

            input SeriesWhere {
              AND: [SeriesWhere!]
              NOT: SeriesWhere
              OR: [SeriesWhere!]
              genre: UGenreWhere
              genreConnection: IProductGenreConnectionWhere
              id: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: String
              id_ENDS_WITH: String
              id_EQ: String
              id_IN: [String!]
              id_STARTS_WITH: String
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
            }

            \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            type StringAggregateSelection {
              longest: String
              shortest: String
            }

            type Subscription {
              genreCreated(where: GenreSubscriptionWhere): GenreCreatedEvent!
              genreDeleted(where: GenreSubscriptionWhere): GenreDeletedEvent!
              genreUpdated(where: GenreSubscriptionWhere): GenreUpdatedEvent!
              movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
              movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
              movieUpdated(where: MovieSubscriptionWhere): MovieUpdatedEvent!
              ratingCreated(where: RatingSubscriptionWhere): RatingCreatedEvent!
              ratingDeleted(where: RatingSubscriptionWhere): RatingDeletedEvent!
              ratingUpdated(where: RatingSubscriptionWhere): RatingUpdatedEvent!
              seriesCreated(where: SeriesSubscriptionWhere): SeriesCreatedEvent!
              seriesDeleted(where: SeriesSubscriptionWhere): SeriesDeletedEvent!
              seriesUpdated(where: SeriesSubscriptionWhere): SeriesUpdatedEvent!
            }

            union UGenre = Genre | Rating

            input UGenreWhere {
              Genre: GenreWhere
              Rating: RatingWhere
            }

            type UpdateGenresMutationResponse {
              genres: [Genre!]!
              info: UpdateInfo!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created and deleted during an update mutation
            \\"\\"\\"
            type UpdateInfo {
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            type UpdateMoviesMutationResponse {
              info: UpdateInfo!
              movies: [Movie!]!
            }

            type UpdateRatingsMutationResponse {
              info: UpdateInfo!
              ratings: [Rating!]!
            }

            type UpdateSeriesMutationResponse {
              info: UpdateInfo!
              series: [Series!]!
            }"
        `);
    });
});
