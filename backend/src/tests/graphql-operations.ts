import gql from "graphql-tag";
import { categoryFragment, orderFragment, productFragment, userFragment } from "./fragments";

// This file collects the GraphQL strings that are passed to a factory function within the test suite.

// Query strings
export const getUserQuery = gql`
    query getUser($id: ID!) {
        getUser(id: $id) {
            ...UserFields
        }
    }
    ${userFragment}
`

export const getUsersQuery = gql`
    query getUsers {
        getUsers {
            ...UserFields
        }
    }
    ${userFragment}
`

export const getProductQuery = gql`
    query getProduct($id: ID!) {
        getProduct(id: $id) {
            ...ProductFields
        }
    }
    ${productFragment}
`

export const getProductsQuery = gql`
    query getProducts {
        getProducts {
            ...ProductFields
        }
    }
    ${productFragment}
`

export const getProductsByCategoryQuery = gql`
    query getProductsByCategory($id: ID!) {
        getProductsByCategory(id: $id) {
            ...ProductFields
        }
    }
    ${productFragment}
`

export const getCategoryQuery = gql`
    query getCategory($id: ID!) {
        getCategory(id: $id) {
            ...CategoryFields
        }
    }
    ${categoryFragment}
`

export const getCategoriesQuery = gql`
    query getCategories {
        getCategories {
            ...CategoryFields
        }
    }
    ${categoryFragment}
`

export const getOrderQuery = gql`
    query getOrder($id: ID!) {
        getOrder(id: $id) {
            ...OrderFields
        }
    }
    ${orderFragment}
`

export const getOrdersQuery = gql`
    query getOrders {
        getOrders {
            ...OrderFields
        }
    }
    ${orderFragment}
`

export const getOrdersByCustomerQuery = gql`
    query getOrdersByCustomer($id: ID!) {
        getOrdersByCustomer(id: $id) {
            ...OrderFields
        }
    }
    ${orderFragment}
`

// Mutation strings

// User operations
export const signUpMutation = gql`
    mutation signUp($firstName: String!, $lastName: String, $email: String!, $password: String!, $role: UserRole!) {
        signUp(firstName: $firstName, lastName: $lastName, email: $email, password: $password, role: $role) {
            id,
            firstName,
            lastName,
            email,
            password,
            role
        }
    }
`;

export const signInMutation = gql`
    mutation signIn($email: String!, $password: String!) {
        signIn(email: $email, password: $password) {
            user {
                firstName
            },
            token
        }
    }
`;

export const updateUserMutation = gql`
    mutation updateUser($id: ID!, $firstName: String, $lastName: String, $email: String, $password: String, $role: UserRole) {
        updateUser(id: $id, firstName: $firstName, lastName: $lastName, email: $email, password: $password, role: $role) {
            id,
            firstName,
            lastName,
            email,
            password,
            role
        }
    }
`;

export const updateEmailMutation = gql`
    mutation updateUser($id: ID!, $email: String!) {
        updateUser(id: $id, email: $email) {
            email
        }
    }
`;

export const updatePasswordMutation = gql`
    mutation updateUser($id: ID!, $password: String!) {
        updateUser(id: $id, password: $password) {
            id,
            firstName,
            lastName,
            email
            password,
            role
        }
    }
`;

// Category operations
export const createCategoryMutation = gql`
    mutation createCategory($categoryName: String!) {
        createCategory(categoryName: $categoryName) {
            id,
            categoryName
        }
    }
`;

export const updateCategoryMutation = gql`
    mutation updateCategory($id: ID!, $categoryName: String!) {
        updateCategory(id: $id, categoryName: $categoryName) {
            id,
            categoryName
        }
    }
`;

export const deleteCategoryMutation = gql`
    mutation deleteCategory($id: ID!) {
        deleteCategory(id: $id) {
            id,
            categoryName
        }
    }
`;

// Product operations
export const createProductMutation = gql`
    mutation createProduct($productName: String!, $description: String, $price: Float!, $imageUrl: String, $categoryId: ID!, $sellerId: ID!) {
        createProduct(productName: $productName, description: $description, price: $price, imageUrl: $imageUrl, categoryId: $categoryId, sellerId: $sellerId) {
            id,
            productName,
            description,
            price,
            imageUrl,
            category {
                id,
                categoryName
            },
            seller {
                id,
                firstName
            }
        }
    }
`;

export const updateProductMutation = gql`
    mutation updateProduct($id: ID!, $productName: String, $description: String, $price: Float, $imageUrl: String) {
        updateProduct(id: $id, productName: $productName, description: $description, price: $price, imageUrl: $imageUrl) {
            id,
            productName,
            description,
            price,
            imageUrl
        }
    }
`;

export const deleteProductMutation = gql`
    mutation deleteProduct($id: ID!) {
        deleteProduct(id: $id) {
            id,
            productName
        }
    }
`

// Order operations
export const createOrderMutation = gql`
    mutation createOrder($userId: ID!, $items: [OrderItemInput!]!) {
        createOrder(userId: $userId, items: $items) {
            id,
            customer {
                id,
                firstName
            },
            items {
                id,
                product {
                    id,
                    productName,
                    price
                },
                quantity,
                price
            },
            total,
            status
        }
    }
`

export const updateOrderStatusMutation = gql`
    mutation updateOrderStatus($id: ID!, $status: OrderStatus!) {
        updateOrderStatus(id: $id, status: $status) {
            id,
            status
        }
    }
`