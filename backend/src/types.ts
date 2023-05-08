import { ApolloServer, BaseContext } from "@apollo/server"
import { DataSource } from "typeorm"
import { User, UserRole } from "./entity/User"

/* 
    This file contains the type definitions that by decision 
    were moved out of relevant files. These are imported 
    throughout the backend.
*/

// Custom Contexts
export interface DataContext extends BaseContext {
    user?: User
    dataSource: {
        database: DataSource
    }
}

export interface TestContext {
    contextValue: DataContext,
    testServer: ApolloServer<DataContext>,
    samples?: {
        [sampleName: string]: Record<string, any>
    }
}

// Custom Input-types
export interface OrderItemInput {
    id: number
    quantity: number
}

export interface SignUpInput {
    firstName: string
    lastName?: string
    email: string
    password: string
    role: UserRole
}

export interface UpdateUserInput {
    firstName?: string
    lastName?: string
    email?: string 
    password?: string
    role?: UserRole
}

export interface CreateProductInput {
    productName: string
    description?: string
    price: number 
    imageUrl?: string 
    categoryId: number
    sellerId: number
}

export interface UpdateProductInput {
    productName?: string
    description?: string 
    price?: number 
    imageUrl?: string
}

export interface SignUpData {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
}

// Custom Variable-Types for Testing
export interface UserUpdateVariable {
    [key: string]: string
};

export type ProductUpdateVariable = 
    | { productName: string }
    | { description: string }
    | { price: number }
    | { imageUrl: string }