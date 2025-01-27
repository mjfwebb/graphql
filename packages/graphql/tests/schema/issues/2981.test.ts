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
import { gql } from "graphql-tag";
import { lexicographicSortSchema } from "graphql/utilities";
import { Neo4jGraphQL } from "../../../src";

describe("https://github.com/neo4j/graphql/issues/2981", () => {
    test("BookTranslatedTitleCreateFieldInput fields should not be of type List", async () => {
        const typeDefs = gql`
            type Book @node {
                originalTitle: String!
                translatedTitle: BookTitle @relationship(type: "TRANSLATED_BOOK_TITLE", direction: IN)
                isbn: String!
            }

            union BookTitle = BookTitle_SV | BookTitle_EN

            type BookTitle_SV @node {
                book: Book! @relationship(type: "TRANSLATED_BOOK_TITLE", direction: OUT)
                value: String!
            }

            type BookTitle_EN @node {
                book: Book! @relationship(type: "TRANSLATED_BOOK_TITLE", direction: OUT)
                value: String!
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type Book {
              isbn: String!
              originalTitle: String!
              translatedTitle(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), limit: Int, offset: Int, options: QueryOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), where: BookTitleWhere): BookTitle
              translatedTitleConnection(after: String, directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), first: Int, where: BookTranslatedTitleConnectionWhere): BookTranslatedTitleConnection!
            }

            type BookAggregateSelection {
              count: Int!
              isbn: StringAggregateSelection!
              originalTitle: StringAggregateSelection!
            }

            input BookConnectInput {
              translatedTitle: BookTranslatedTitleConnectInput
            }

            input BookConnectWhere {
              node: BookWhere!
            }

            input BookCreateInput {
              isbn: String!
              originalTitle: String!
              translatedTitle: BookTranslatedTitleCreateInput
            }

            input BookDeleteInput {
              translatedTitle: BookTranslatedTitleDeleteInput
            }

            input BookDisconnectInput {
              translatedTitle: BookTranslatedTitleDisconnectInput
            }

            type BookEdge {
              cursor: String!
              node: Book!
            }

            input BookOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more BookSort objects to sort Books by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [BookSort!]
            }

            \\"\\"\\"
            Fields to sort Books by. The order in which sorts are applied is not guaranteed when specifying many fields in one BookSort object.
            \\"\\"\\"
            input BookSort {
              isbn: SortDirection
              originalTitle: SortDirection
            }

            union BookTitle = BookTitle_EN | BookTitle_SV

            type BookTitleEnsConnection {
              edges: [BookTitle_ENEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type BookTitleSvsConnection {
              edges: [BookTitle_SVEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input BookTitleWhere {
              BookTitle_EN: BookTitle_ENWhere
              BookTitle_SV: BookTitle_SVWhere
            }

            type BookTitle_EN {
              book(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), limit: Int, offset: Int, options: BookOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [BookSort!], where: BookWhere): Book!
              bookAggregate(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), where: BookWhere): BookTitle_ENBookBookAggregationSelection
              bookConnection(after: String, directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), first: Int, sort: [BookTitle_ENBookConnectionSort!], where: BookTitle_ENBookConnectionWhere): BookTitle_ENBookConnection!
              value: String!
            }

            type BookTitle_ENAggregateSelection {
              count: Int!
              value: StringAggregateSelection!
            }

            input BookTitle_ENBookAggregateInput {
              AND: [BookTitle_ENBookAggregateInput!]
              NOT: BookTitle_ENBookAggregateInput
              OR: [BookTitle_ENBookAggregateInput!]
              count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: BookTitle_ENBookNodeAggregationWhereInput
            }

            type BookTitle_ENBookBookAggregationSelection {
              count: Int!
              node: BookTitle_ENBookBookNodeAggregateSelection
            }

            type BookTitle_ENBookBookNodeAggregateSelection {
              isbn: StringAggregateSelection!
              originalTitle: StringAggregateSelection!
            }

            input BookTitle_ENBookConnectFieldInput {
              connect: BookConnectInput
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true @deprecated(reason: \\"The overwrite argument is deprecated and will be removed\\")
              where: BookConnectWhere
            }

            type BookTitle_ENBookConnection {
              edges: [BookTitle_ENBookRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input BookTitle_ENBookConnectionSort {
              node: BookSort
            }

            input BookTitle_ENBookConnectionWhere {
              AND: [BookTitle_ENBookConnectionWhere!]
              NOT: BookTitle_ENBookConnectionWhere
              OR: [BookTitle_ENBookConnectionWhere!]
              node: BookWhere
            }

            input BookTitle_ENBookCreateFieldInput {
              node: BookCreateInput!
            }

            input BookTitle_ENBookDeleteFieldInput {
              delete: BookDeleteInput
              where: BookTitle_ENBookConnectionWhere
            }

            input BookTitle_ENBookDisconnectFieldInput {
              disconnect: BookDisconnectInput
              where: BookTitle_ENBookConnectionWhere
            }

            input BookTitle_ENBookFieldInput {
              connect: BookTitle_ENBookConnectFieldInput
              create: BookTitle_ENBookCreateFieldInput
            }

            input BookTitle_ENBookNodeAggregationWhereInput {
              AND: [BookTitle_ENBookNodeAggregationWhereInput!]
              NOT: BookTitle_ENBookNodeAggregationWhereInput
              OR: [BookTitle_ENBookNodeAggregationWhereInput!]
              isbn_AVERAGE_LENGTH_EQUAL: Float
              isbn_AVERAGE_LENGTH_GT: Float
              isbn_AVERAGE_LENGTH_GTE: Float
              isbn_AVERAGE_LENGTH_LT: Float
              isbn_AVERAGE_LENGTH_LTE: Float
              isbn_LONGEST_LENGTH_EQUAL: Int
              isbn_LONGEST_LENGTH_GT: Int
              isbn_LONGEST_LENGTH_GTE: Int
              isbn_LONGEST_LENGTH_LT: Int
              isbn_LONGEST_LENGTH_LTE: Int
              isbn_SHORTEST_LENGTH_EQUAL: Int
              isbn_SHORTEST_LENGTH_GT: Int
              isbn_SHORTEST_LENGTH_GTE: Int
              isbn_SHORTEST_LENGTH_LT: Int
              isbn_SHORTEST_LENGTH_LTE: Int
              originalTitle_AVERAGE_LENGTH_EQUAL: Float
              originalTitle_AVERAGE_LENGTH_GT: Float
              originalTitle_AVERAGE_LENGTH_GTE: Float
              originalTitle_AVERAGE_LENGTH_LT: Float
              originalTitle_AVERAGE_LENGTH_LTE: Float
              originalTitle_LONGEST_LENGTH_EQUAL: Int
              originalTitle_LONGEST_LENGTH_GT: Int
              originalTitle_LONGEST_LENGTH_GTE: Int
              originalTitle_LONGEST_LENGTH_LT: Int
              originalTitle_LONGEST_LENGTH_LTE: Int
              originalTitle_SHORTEST_LENGTH_EQUAL: Int
              originalTitle_SHORTEST_LENGTH_GT: Int
              originalTitle_SHORTEST_LENGTH_GTE: Int
              originalTitle_SHORTEST_LENGTH_LT: Int
              originalTitle_SHORTEST_LENGTH_LTE: Int
            }

            type BookTitle_ENBookRelationship {
              cursor: String!
              node: Book!
            }

            input BookTitle_ENBookUpdateConnectionInput {
              node: BookUpdateInput
            }

            input BookTitle_ENBookUpdateFieldInput {
              connect: BookTitle_ENBookConnectFieldInput
              create: BookTitle_ENBookCreateFieldInput
              delete: BookTitle_ENBookDeleteFieldInput
              disconnect: BookTitle_ENBookDisconnectFieldInput
              update: BookTitle_ENBookUpdateConnectionInput
              where: BookTitle_ENBookConnectionWhere
            }

            input BookTitle_ENConnectInput {
              book: BookTitle_ENBookConnectFieldInput
            }

            input BookTitle_ENConnectWhere {
              node: BookTitle_ENWhere!
            }

            input BookTitle_ENCreateInput {
              book: BookTitle_ENBookFieldInput
              value: String!
            }

            input BookTitle_ENDeleteInput {
              book: BookTitle_ENBookDeleteFieldInput
            }

            input BookTitle_ENDisconnectInput {
              book: BookTitle_ENBookDisconnectFieldInput
            }

            type BookTitle_ENEdge {
              cursor: String!
              node: BookTitle_EN!
            }

            input BookTitle_ENOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more BookTitle_ENSort objects to sort BookTitleEns by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [BookTitle_ENSort!]
            }

            \\"\\"\\"
            Fields to sort BookTitleEns by. The order in which sorts are applied is not guaranteed when specifying many fields in one BookTitle_ENSort object.
            \\"\\"\\"
            input BookTitle_ENSort {
              value: SortDirection
            }

            input BookTitle_ENUpdateInput {
              book: BookTitle_ENBookUpdateFieldInput
              value: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              value_SET: String
            }

            input BookTitle_ENWhere {
              AND: [BookTitle_ENWhere!]
              NOT: BookTitle_ENWhere
              OR: [BookTitle_ENWhere!]
              book: BookWhere
              bookAggregate: BookTitle_ENBookAggregateInput
              bookConnection: BookTitle_ENBookConnectionWhere
              value: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              value_CONTAINS: String
              value_ENDS_WITH: String
              value_EQ: String
              value_IN: [String!]
              value_STARTS_WITH: String
            }

            type BookTitle_SV {
              book(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), limit: Int, offset: Int, options: BookOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [BookSort!], where: BookWhere): Book!
              bookAggregate(directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), where: BookWhere): BookTitle_SVBookBookAggregationSelection
              bookConnection(after: String, directed: Boolean = true @deprecated(reason: \\"The directed argument is deprecated, and the direction of the field will be configured in the GraphQL server\\"), first: Int, sort: [BookTitle_SVBookConnectionSort!], where: BookTitle_SVBookConnectionWhere): BookTitle_SVBookConnection!
              value: String!
            }

            type BookTitle_SVAggregateSelection {
              count: Int!
              value: StringAggregateSelection!
            }

            input BookTitle_SVBookAggregateInput {
              AND: [BookTitle_SVBookAggregateInput!]
              NOT: BookTitle_SVBookAggregateInput
              OR: [BookTitle_SVBookAggregateInput!]
              count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: BookTitle_SVBookNodeAggregationWhereInput
            }

            type BookTitle_SVBookBookAggregationSelection {
              count: Int!
              node: BookTitle_SVBookBookNodeAggregateSelection
            }

            type BookTitle_SVBookBookNodeAggregateSelection {
              isbn: StringAggregateSelection!
              originalTitle: StringAggregateSelection!
            }

            input BookTitle_SVBookConnectFieldInput {
              connect: BookConnectInput
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true @deprecated(reason: \\"The overwrite argument is deprecated and will be removed\\")
              where: BookConnectWhere
            }

            type BookTitle_SVBookConnection {
              edges: [BookTitle_SVBookRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input BookTitle_SVBookConnectionSort {
              node: BookSort
            }

            input BookTitle_SVBookConnectionWhere {
              AND: [BookTitle_SVBookConnectionWhere!]
              NOT: BookTitle_SVBookConnectionWhere
              OR: [BookTitle_SVBookConnectionWhere!]
              node: BookWhere
            }

            input BookTitle_SVBookCreateFieldInput {
              node: BookCreateInput!
            }

            input BookTitle_SVBookDeleteFieldInput {
              delete: BookDeleteInput
              where: BookTitle_SVBookConnectionWhere
            }

            input BookTitle_SVBookDisconnectFieldInput {
              disconnect: BookDisconnectInput
              where: BookTitle_SVBookConnectionWhere
            }

            input BookTitle_SVBookFieldInput {
              connect: BookTitle_SVBookConnectFieldInput
              create: BookTitle_SVBookCreateFieldInput
            }

            input BookTitle_SVBookNodeAggregationWhereInput {
              AND: [BookTitle_SVBookNodeAggregationWhereInput!]
              NOT: BookTitle_SVBookNodeAggregationWhereInput
              OR: [BookTitle_SVBookNodeAggregationWhereInput!]
              isbn_AVERAGE_LENGTH_EQUAL: Float
              isbn_AVERAGE_LENGTH_GT: Float
              isbn_AVERAGE_LENGTH_GTE: Float
              isbn_AVERAGE_LENGTH_LT: Float
              isbn_AVERAGE_LENGTH_LTE: Float
              isbn_LONGEST_LENGTH_EQUAL: Int
              isbn_LONGEST_LENGTH_GT: Int
              isbn_LONGEST_LENGTH_GTE: Int
              isbn_LONGEST_LENGTH_LT: Int
              isbn_LONGEST_LENGTH_LTE: Int
              isbn_SHORTEST_LENGTH_EQUAL: Int
              isbn_SHORTEST_LENGTH_GT: Int
              isbn_SHORTEST_LENGTH_GTE: Int
              isbn_SHORTEST_LENGTH_LT: Int
              isbn_SHORTEST_LENGTH_LTE: Int
              originalTitle_AVERAGE_LENGTH_EQUAL: Float
              originalTitle_AVERAGE_LENGTH_GT: Float
              originalTitle_AVERAGE_LENGTH_GTE: Float
              originalTitle_AVERAGE_LENGTH_LT: Float
              originalTitle_AVERAGE_LENGTH_LTE: Float
              originalTitle_LONGEST_LENGTH_EQUAL: Int
              originalTitle_LONGEST_LENGTH_GT: Int
              originalTitle_LONGEST_LENGTH_GTE: Int
              originalTitle_LONGEST_LENGTH_LT: Int
              originalTitle_LONGEST_LENGTH_LTE: Int
              originalTitle_SHORTEST_LENGTH_EQUAL: Int
              originalTitle_SHORTEST_LENGTH_GT: Int
              originalTitle_SHORTEST_LENGTH_GTE: Int
              originalTitle_SHORTEST_LENGTH_LT: Int
              originalTitle_SHORTEST_LENGTH_LTE: Int
            }

            type BookTitle_SVBookRelationship {
              cursor: String!
              node: Book!
            }

            input BookTitle_SVBookUpdateConnectionInput {
              node: BookUpdateInput
            }

            input BookTitle_SVBookUpdateFieldInput {
              connect: BookTitle_SVBookConnectFieldInput
              create: BookTitle_SVBookCreateFieldInput
              delete: BookTitle_SVBookDeleteFieldInput
              disconnect: BookTitle_SVBookDisconnectFieldInput
              update: BookTitle_SVBookUpdateConnectionInput
              where: BookTitle_SVBookConnectionWhere
            }

            input BookTitle_SVConnectInput {
              book: BookTitle_SVBookConnectFieldInput
            }

            input BookTitle_SVConnectWhere {
              node: BookTitle_SVWhere!
            }

            input BookTitle_SVCreateInput {
              book: BookTitle_SVBookFieldInput
              value: String!
            }

            input BookTitle_SVDeleteInput {
              book: BookTitle_SVBookDeleteFieldInput
            }

            input BookTitle_SVDisconnectInput {
              book: BookTitle_SVBookDisconnectFieldInput
            }

            type BookTitle_SVEdge {
              cursor: String!
              node: BookTitle_SV!
            }

            input BookTitle_SVOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more BookTitle_SVSort objects to sort BookTitleSvs by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [BookTitle_SVSort!]
            }

            \\"\\"\\"
            Fields to sort BookTitleSvs by. The order in which sorts are applied is not guaranteed when specifying many fields in one BookTitle_SVSort object.
            \\"\\"\\"
            input BookTitle_SVSort {
              value: SortDirection
            }

            input BookTitle_SVUpdateInput {
              book: BookTitle_SVBookUpdateFieldInput
              value: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              value_SET: String
            }

            input BookTitle_SVWhere {
              AND: [BookTitle_SVWhere!]
              NOT: BookTitle_SVWhere
              OR: [BookTitle_SVWhere!]
              book: BookWhere
              bookAggregate: BookTitle_SVBookAggregateInput
              bookConnection: BookTitle_SVBookConnectionWhere
              value: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              value_CONTAINS: String
              value_ENDS_WITH: String
              value_EQ: String
              value_IN: [String!]
              value_STARTS_WITH: String
            }

            input BookTranslatedTitleBookTitle_ENConnectFieldInput {
              connect: BookTitle_ENConnectInput
              where: BookTitle_ENConnectWhere
            }

            input BookTranslatedTitleBookTitle_ENConnectionWhere {
              AND: [BookTranslatedTitleBookTitle_ENConnectionWhere!]
              NOT: BookTranslatedTitleBookTitle_ENConnectionWhere
              OR: [BookTranslatedTitleBookTitle_ENConnectionWhere!]
              node: BookTitle_ENWhere
            }

            input BookTranslatedTitleBookTitle_ENCreateFieldInput {
              node: BookTitle_ENCreateInput!
            }

            input BookTranslatedTitleBookTitle_ENDeleteFieldInput {
              delete: BookTitle_ENDeleteInput
              where: BookTranslatedTitleBookTitle_ENConnectionWhere
            }

            input BookTranslatedTitleBookTitle_ENDisconnectFieldInput {
              disconnect: BookTitle_ENDisconnectInput
              where: BookTranslatedTitleBookTitle_ENConnectionWhere
            }

            input BookTranslatedTitleBookTitle_ENFieldInput {
              connect: BookTranslatedTitleBookTitle_ENConnectFieldInput
              create: BookTranslatedTitleBookTitle_ENCreateFieldInput
            }

            input BookTranslatedTitleBookTitle_ENUpdateConnectionInput {
              node: BookTitle_ENUpdateInput
            }

            input BookTranslatedTitleBookTitle_ENUpdateFieldInput {
              connect: BookTranslatedTitleBookTitle_ENConnectFieldInput
              create: BookTranslatedTitleBookTitle_ENCreateFieldInput
              delete: BookTranslatedTitleBookTitle_ENDeleteFieldInput
              disconnect: BookTranslatedTitleBookTitle_ENDisconnectFieldInput
              update: BookTranslatedTitleBookTitle_ENUpdateConnectionInput
              where: BookTranslatedTitleBookTitle_ENConnectionWhere
            }

            input BookTranslatedTitleBookTitle_SVConnectFieldInput {
              connect: BookTitle_SVConnectInput
              where: BookTitle_SVConnectWhere
            }

            input BookTranslatedTitleBookTitle_SVConnectionWhere {
              AND: [BookTranslatedTitleBookTitle_SVConnectionWhere!]
              NOT: BookTranslatedTitleBookTitle_SVConnectionWhere
              OR: [BookTranslatedTitleBookTitle_SVConnectionWhere!]
              node: BookTitle_SVWhere
            }

            input BookTranslatedTitleBookTitle_SVCreateFieldInput {
              node: BookTitle_SVCreateInput!
            }

            input BookTranslatedTitleBookTitle_SVDeleteFieldInput {
              delete: BookTitle_SVDeleteInput
              where: BookTranslatedTitleBookTitle_SVConnectionWhere
            }

            input BookTranslatedTitleBookTitle_SVDisconnectFieldInput {
              disconnect: BookTitle_SVDisconnectInput
              where: BookTranslatedTitleBookTitle_SVConnectionWhere
            }

            input BookTranslatedTitleBookTitle_SVFieldInput {
              connect: BookTranslatedTitleBookTitle_SVConnectFieldInput
              create: BookTranslatedTitleBookTitle_SVCreateFieldInput
            }

            input BookTranslatedTitleBookTitle_SVUpdateConnectionInput {
              node: BookTitle_SVUpdateInput
            }

            input BookTranslatedTitleBookTitle_SVUpdateFieldInput {
              connect: BookTranslatedTitleBookTitle_SVConnectFieldInput
              create: BookTranslatedTitleBookTitle_SVCreateFieldInput
              delete: BookTranslatedTitleBookTitle_SVDeleteFieldInput
              disconnect: BookTranslatedTitleBookTitle_SVDisconnectFieldInput
              update: BookTranslatedTitleBookTitle_SVUpdateConnectionInput
              where: BookTranslatedTitleBookTitle_SVConnectionWhere
            }

            input BookTranslatedTitleConnectInput {
              BookTitle_EN: BookTranslatedTitleBookTitle_ENConnectFieldInput
              BookTitle_SV: BookTranslatedTitleBookTitle_SVConnectFieldInput
            }

            type BookTranslatedTitleConnection {
              edges: [BookTranslatedTitleRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input BookTranslatedTitleConnectionWhere {
              BookTitle_EN: BookTranslatedTitleBookTitle_ENConnectionWhere
              BookTitle_SV: BookTranslatedTitleBookTitle_SVConnectionWhere
            }

            input BookTranslatedTitleCreateInput {
              BookTitle_EN: BookTranslatedTitleBookTitle_ENFieldInput
              BookTitle_SV: BookTranslatedTitleBookTitle_SVFieldInput
            }

            input BookTranslatedTitleDeleteInput {
              BookTitle_EN: BookTranslatedTitleBookTitle_ENDeleteFieldInput
              BookTitle_SV: BookTranslatedTitleBookTitle_SVDeleteFieldInput
            }

            input BookTranslatedTitleDisconnectInput {
              BookTitle_EN: BookTranslatedTitleBookTitle_ENDisconnectFieldInput
              BookTitle_SV: BookTranslatedTitleBookTitle_SVDisconnectFieldInput
            }

            type BookTranslatedTitleRelationship {
              cursor: String!
              node: BookTitle!
            }

            input BookTranslatedTitleUpdateInput {
              BookTitle_EN: BookTranslatedTitleBookTitle_ENUpdateFieldInput
              BookTitle_SV: BookTranslatedTitleBookTitle_SVUpdateFieldInput
            }

            input BookUpdateInput {
              isbn: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              isbn_SET: String
              originalTitle: String @deprecated(reason: \\"Please use the explicit _SET field\\")
              originalTitle_SET: String
              translatedTitle: BookTranslatedTitleUpdateInput
            }

            input BookWhere {
              AND: [BookWhere!]
              NOT: BookWhere
              OR: [BookWhere!]
              isbn: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              isbn_CONTAINS: String
              isbn_ENDS_WITH: String
              isbn_EQ: String
              isbn_IN: [String!]
              isbn_STARTS_WITH: String
              originalTitle: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              originalTitle_CONTAINS: String
              originalTitle_ENDS_WITH: String
              originalTitle_EQ: String
              originalTitle_IN: [String!]
              originalTitle_STARTS_WITH: String
              translatedTitle: BookTitleWhere
              translatedTitleConnection: BookTranslatedTitleConnectionWhere
            }

            type BooksConnection {
              edges: [BookEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type CreateBookTitleEnsMutationResponse {
              bookTitleEns: [BookTitle_EN!]!
              info: CreateInfo!
            }

            type CreateBookTitleSvsMutationResponse {
              bookTitleSvs: [BookTitle_SV!]!
              info: CreateInfo!
            }

            type CreateBooksMutationResponse {
              books: [Book!]!
              info: CreateInfo!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Mutation {
              createBookTitleEns(input: [BookTitle_ENCreateInput!]!): CreateBookTitleEnsMutationResponse!
              createBookTitleSvs(input: [BookTitle_SVCreateInput!]!): CreateBookTitleSvsMutationResponse!
              createBooks(input: [BookCreateInput!]!): CreateBooksMutationResponse!
              deleteBookTitleEns(delete: BookTitle_ENDeleteInput, where: BookTitle_ENWhere): DeleteInfo!
              deleteBookTitleSvs(delete: BookTitle_SVDeleteInput, where: BookTitle_SVWhere): DeleteInfo!
              deleteBooks(delete: BookDeleteInput, where: BookWhere): DeleteInfo!
              updateBookTitleEns(update: BookTitle_ENUpdateInput, where: BookTitle_ENWhere): UpdateBookTitleEnsMutationResponse!
              updateBookTitleSvs(update: BookTitle_SVUpdateInput, where: BookTitle_SVWhere): UpdateBookTitleSvsMutationResponse!
              updateBooks(update: BookUpdateInput, where: BookWhere): UpdateBooksMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              bookTitleEns(limit: Int, offset: Int, options: BookTitle_ENOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [BookTitle_ENSort!], where: BookTitle_ENWhere): [BookTitle_EN!]!
              bookTitleEnsAggregate(where: BookTitle_ENWhere): BookTitle_ENAggregateSelection!
              bookTitleEnsConnection(after: String, first: Int, sort: [BookTitle_ENSort!], where: BookTitle_ENWhere): BookTitleEnsConnection!
              bookTitleSvs(limit: Int, offset: Int, options: BookTitle_SVOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [BookTitle_SVSort!], where: BookTitle_SVWhere): [BookTitle_SV!]!
              bookTitleSvsAggregate(where: BookTitle_SVWhere): BookTitle_SVAggregateSelection!
              bookTitleSvsConnection(after: String, first: Int, sort: [BookTitle_SVSort!], where: BookTitle_SVWhere): BookTitleSvsConnection!
              bookTitles(limit: Int, offset: Int, options: QueryOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), where: BookTitleWhere): [BookTitle!]!
              books(limit: Int, offset: Int, options: BookOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [BookSort!], where: BookWhere): [Book!]!
              booksAggregate(where: BookWhere): BookAggregateSelection!
              booksConnection(after: String, first: Int, sort: [BookSort!], where: BookWhere): BooksConnection!
            }

            \\"\\"\\"Input type for options that can be specified on a query operation.\\"\\"\\"
            input QueryOptions {
              limit: Int
              offset: Int
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

            type UpdateBookTitleEnsMutationResponse {
              bookTitleEns: [BookTitle_EN!]!
              info: UpdateInfo!
            }

            type UpdateBookTitleSvsMutationResponse {
              bookTitleSvs: [BookTitle_SV!]!
              info: UpdateInfo!
            }

            type UpdateBooksMutationResponse {
              books: [Book!]!
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
            }"
        `);
    });
});
