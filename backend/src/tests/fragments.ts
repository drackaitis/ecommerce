import gql from "graphql-tag";

/*
    This file contains fragments that allow us to re-use common request 
    patterns within GraphQL. They are then inserted into a GraphQL string 
    through a spread operator "..."
*/

export const userFragment = gql`
    fragment UserFields on User {
        id
        firstName
        lastName
        email
        role
        createdAt
        updatedAt
    }
`;

export const productFragment = gql`
    fragment ProductFields on Product {
        id,
        productName,
        description,
        price,
        imageUrl,
        category,
        seller,
        createdAt,
        updatedAt
    }
`

export const categoryFragment = gql`
    fragment CategoryFields on Category {
        id,
        categoryName,
        createdAt,
        updatedAt
    }
`

export const orderFragment = gql`
    fragment OrderFields on Order {
        id,
        customer,
        items,
        total,
        status,
        createdAt,
        updatedAt
    }
`