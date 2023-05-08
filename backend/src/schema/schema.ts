import { DocumentNode } from 'graphql';
import { gql } from 'graphql-tag';

export const typeDefs: DocumentNode = gql`
    type User {
        id: ID!
        firstName: String!
        lastName: String
        email: String!
        password: String!
        role: UserRole!
        createdAt: String!
        updatedAt: String!
    }
    
    enum UserRole {
        CUSTOMER
        ADMIN
        SELLER
    }

    type AuthPayload {
        user: User!
        token: String!
        expiresAt: Int!
    }

    type Product {
        id: ID!
        productName: String!
        description: String
        price: Float!
        imageUrl: String
        category: Category
        seller: User
        createdAt: String!
        updatedAt: String!
    }

    type Category {
        id: ID!
        categoryName: String!
        createdAt: String!
        updatedAt: String!
    }

    type Order {
        id: ID!
        customer: User
        items: [OrderItem]!
        total: Float!
        status: OrderStatus!
        createdAt: String!
        updatedAt: String!
    }
      
    enum OrderStatus {
        PENDING
        PROCESSING
        SHIPPED
        DELIVERED
        CANCELLED
    }

    type OrderItem {
        id: ID!
        order: Order!
        product: Product
        quantity: Int!
        price: Float!
        createdAt: String!
        updatedAt: String!
    }

    input OrderItemInput {
        id: ID!
        quantity: Int!
    }

    type Query {
        # User queries
        getUser(id: ID!): User
        getUsers: [User]!

        # Product queries
        getProduct(id: ID!): Product
        getProducts: [Product]
        getProductsByCategory(id: ID!): [Product]

        # Category queries
        getCategory(id: ID!): Category
        getCategories: [Category]

        # Order queries
        getOrder(id: ID!): Order
        getOrders: [Order!]
        getOrdersByCustomer(id: ID!): [Order!]
    }

    type Mutation {
        # User mutations
        signUp(firstName: String!, lastName: String, email: String!, password: String!, role: UserRole!): User
        signIn(email: String!, password: String!): AuthPayload!
        updateUser(id: ID!, firstName: String, lastName: String, email: String, password: String, role: UserRole): User

        # Product mutations
        createProduct(productName: String!, description: String, price: Float!, imageUrl: String, categoryId: ID!, sellerId: ID!): Product
        updateProduct(id: ID!, productName: String, description: String, price: Float, imageUrl: String ): Product
        deleteProduct(id: ID!): Product

        # Category mutations
        createCategory(categoryName: String!): Category
        updateCategory(id: ID!, categoryName: String!): Category
        deleteCategory(id: ID!): Category

        # Order mutations
        createOrder(userId: ID!, items: [OrderItemInput!]!): Order!
        updateOrderStatus(id: ID!, status: OrderStatus!): Order!
    }
`