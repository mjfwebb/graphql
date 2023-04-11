## Problem

Users would like to be able to query for relationships over a variable length of hops.

This is something that is already available with Cypher: https://neo4j.com/docs/cypher-manual/current/syntax/patterns/#cypher-pattern-varlength

In Cypher you can do the following length-based relationship queries:

Describe paths with a minimum length of 3, and a maximum of 5:

```sql
(a)-[*3..5]->(b)
```

Describe paths of length 3 or more:

```sql
(a)-[*3..]->(b)
```

Describe paths of length 5 or less:

```sql
(a)-[*..5]->(b)
```

## Proposed Solution

Given the following type definitions with variable length opted-in on the `friends` field:

```gql
type Person {
    name: String
    friends: [Person!]! @relationship(type: "IS_FRIENDS", direction: OUT, maxLength: 3)
}
```

We specify a maximum length so we can enforce limits on the query lengths.

We add a `length` query argument to relationship fields which contains an optional `min` and an optional `max` property:

```gql
people(where: {name: "Sam"}) {
    name
    friends(length: { min: 1, max: 3 }) {
        name
    }
}
```

If the `maxLength` property of the relationship directive is `undefined` or set to `1` then the `length` query argument would not be added to the schema. A `maxLength` property on the relationship directive is required to use this feature.

### Defaults

If no query length is given in a query then we default to a single hop.
If no query length maximum is given in a query then we default to the maximum defined in the schema.
If no query minimum length is given then we default to min 1.
If the query length maximum is bigger than the schema maximum then we throw an error.

As the directed argument in a query of a relationship field is `true` by default, it would be possible to set this to false, by specifying it:

```gql
people(where: {name: "Sam"}) {
    name
    friends(directed: false, length: { min: 1, max: 3 }) {
        name
    }
}
```

### Usage Examples

Undirected with a minimum length of 2, and a maximum of 4:

```gql
people(where: {name: "Sam"}) {
    name
    friends(directed: false,  length: { min: 2, max: 4 }) {
        name
    }
}
```

Undirected with a minimum length of 1:

```gql
people(where: {name: "Sam"}) {
    name
    friends(directed: false, length: { min: 1 }) {
        name
    }
}
```

Directed with a maximum length of 2:

```gql
people(where: {name: "Sam"}) {
    name
    friends(length: { max: 2 }) {
        name
    }
}
```

## Risks

## Out of Scope

Mutations
Creations

## Security consideration

It could be possible for queries to return data for nodes that are not defined in the schema. If there are several nodes using the same relationship type, but of a different node label, these would still be matched by the query.
