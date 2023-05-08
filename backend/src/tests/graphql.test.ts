import express from "express";
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { DocumentNode } from 'graphql';
import { GraphQLResponse } from '@apollo/server/dist/esm/externalTypes/graphql';
import bodyParser from 'body-parser';
import bcrypt from "bcrypt";
import "reflect-metadata";
import * as op from "./graphql-operations";
import { DataContext, ProductUpdateVariable, SignUpData, TestContext, UserUpdateVariable } from "../types";
import { db } from "../datasource/data-source";
import { resolvers } from '../resolvers/resolvers';
import { typeDefs } from '../schema/schema';


/**
 * Factory function that returns an async function to execute a GraphQL operation.
 *
 * @param {DocumentNode} query - The GraphQL query or mutation document.
 * @param {TestContext} ctx - The testing context containing the test server and datasource instance.
 * @returns {Function} - An async function that executes the GraphQL operation.
 */
function executeOperationFactory(query: DocumentNode, ctx: TestContext): Function {
    return async (variables?: any) => {
        const response = await ctx.testServer.executeOperation({
            query,
            variables
        }, ctx);
        return response;
    }
}

// Helper function that performs the bulk of the comparison using Jest.
function checkResponseMatch(response: GraphQLResponse, expected: Object) {
    if (response.body.kind === "single") {
        const data = response.body.singleResult.data;
        expect(data).toMatchObject(expected);
        return data;
    } else {
        throw new Error("Unexpected multiple results.")
    };
}

// Helper function to test responses for errors in tests that must fail.
function expectError(response: GraphQLResponse) {
    if (response.body.kind === "single") {
        const errors = response.body.singleResult.errors;
        if (!errors) {
            throw new Error("The operation worked when it should have failed.")
        }
        expect(response.body.singleResult.errors).toBeTruthy();
    } else {
        throw new Error("Unexpected multiple results.")
    };
}

// GraphQL API integration test
describe('GraphQL API', () => {
    const app = express();
    // Setup new test server with the DataContext
    const testServer: ApolloServer<DataContext> = new ApolloServer({
        typeDefs,
        resolvers
    });

    // Run logic before any tests are performed.
    beforeAll(async () => {
        // Open database connection and start test server.
        await db.initialize();
        await testServer.start();

        // Apply middleware.
        app.use(
            '/',
            bodyParser.json(),
            expressMiddleware(testServer, {
                context: async () => (
                    {
                        dataSource: {
                            database: db
                        }
                    }
                )
            }),
        );
    });

    // Run logic after all tests have concluded.
    afterAll(async () => {
        // Foreign key constraints prevent the truncation of tables, so we first disable checks.
        await db.query('SET FOREIGN_KEY_CHECKS = 0')
        
        // Pull all entities(tables) from meta data and truncate them.
        const entities = db.entityMetadatas;
        for (const entity of entities) {
            const repository = db.getRepository(entity.name);
            await repository.clear();
        }

        // Enable foreign key checks again.
        await db.query('SET FOREIGN_KEY_CHECKS = 1')

        // Teardown server and database connection.
        await testServer.stop()
        await db.destroy();
    });

    // Create new testing context to share between operations.
    const ctx: TestContext = {
        contextValue: {
            dataSource: {
                database: db
            }
        },
        testServer
    }

    describe('User mutations', () => {
        // A bundle of functions that execute the GraphQL operation.
        const signUpOperation = executeOperationFactory(op.signUpMutation, ctx);
        const signInOperation = executeOperationFactory(op.signInMutation, ctx);
        const updateUserOperation = executeOperationFactory(op.updateUserMutation, ctx);
        describe('signUp', () => {
            test('creates a new user with all properties', async () => {
                const response = await signUpOperation({
                    firstName: "Jane", lastName: "Doe", email: "janedoe@gmail.com", password: "p4ssw0rd", role: "SELLER"
                });
                checkResponseMatch(response, {
                    signUp: {
                        firstName: "Jane",
                        lastName: "Doe",
                        email: "janedoe@gmail.com",
                        password: expect.any(String),
                        role: "SELLER"
                    }
                });
            });

            test('creates a new user without optional properties', async () => {
                const response = await signUpOperation({
                    firstName: "John", lastName: null, email: "johndoe@gmail.com", password: "p4ssw0rd", role: "CUSTOMER"
                });
                const data = checkResponseMatch(response, {
                    signUp: {
                        firstName: "John",
                        lastName: null,
                        email: "johndoe@gmail.com",
                        password: expect.any(String),
                        role: "CUSTOMER"
                    }
                });

                // Add a sample user to the test context to be re-used as subject in other tests.
                if (data) {
                    ctx.samples = { sampleUser: data }
                };
            });

            test('fails to create a user with duplicate email', async () => {
                const response = await signUpOperation({
                    firstName: "Jane", lastName: "Doe", email: "janedoe@gmail.com", password: "p4ssw0rd", role: "CUSTOMER"
                });
                expectError(response);
            });

            test('fails to create a user with invalid data', async () => {
                let response = await signUpOperation({
                    firstName: "Ron", lastName: "Bonn", email: "ronbonbon", password: "p4ssw0rd", role: "SELLER"
                });
                expectError(response);
                response = await signUpOperation({
                    firstName: "Ron", lastName: "Bonn", email: "ronbonbon@gmail.com", password: 123, role: "SELLER"
                });
                expectError(response);
            });
        });

        describe('signIn', () => {
            test('login succeeds and AuthPayload is returned', async () => {
                const response = await signInOperation({ email: "janedoe@gmail.com", password: "p4ssw0rd" });
                checkResponseMatch(response, {
                    signIn: {
                        user: {
                            firstName: "Jane"
                        },
                        token: expect.any(String)
                    }
                });
            });

            test('login fails with incorrect email or password', async () => {
                let response = await signInOperation({ email: "wrongemail@gmail.com", password: "p4ssw0rd" });
                expectError(response);
                response = await signInOperation({ email: "janedoe@gmail.com", password: "wrongpassword" });
                expectError(response);
            });

            test('login fails with invalid input', async () => {
                const response = await signInOperation({ email: "p4ssw0rd", password: "p4ssw0rd" });
                expectError(response);
            });

        });

        describe('updateUser', () => {
            test('updates individual user fields successfully', async () => {
                // Fetch sample user, which we saved earlier, by its id from the context ctx.
                const id = ctx.samples?.sampleUser.signUp.id;
                const variableList: UserUpdateVariable[] = [
                    { firstName: "Johnathan" },
                    { lastName: "Doern" },
                    { email: "dearjohn@gmail.com" },
                    { password: "newpassword" },
                    { role: "ADMIN" }
                ];

                // Update user properties individually with separate operations.
                for (const variable of variableList) {
                    const input = { id, ...variable };
                    const response = await updateUserOperation(input);
                    if (variable === variableList[3]) { 
                        if (response.body.kind === "single") {
                            const data = response.body.singleResult.data?.signUp as Record<string, SignUpData>;
                            if (data) {
                                const isMatch = await bcrypt.compare(variable.password, data.signUp.password);
                                expect(isMatch).toBe(true);
                            }
                        }
                
                    } else {
                        checkResponseMatch(response, {
                            updateUser: { ...variable }
                        });
                    }
                };
            });

            test('updates multiple user fields successfully', async () => {
                const id = ctx.samples?.sampleUser.signUp.id;
                const response = await updateUserOperation({
                    id,
                    firstName: "John",
                    lastName: "Doe",
                    email: "johndoe@gmail.com",
                    password: "p4ssw0rd",
                    role: "CUSTOMER"
                });

                checkResponseMatch(response, {
                    updateUser: {
                        firstName: "John",
                        lastName: "Doe",
                        email: "johndoe@gmail.com",
                        password: expect.any(String),
                        role: "CUSTOMER"
                    }
                });
            });

            test('fails to update with duplicate email', async () => {
                const id = ctx.samples?.sampleUser.id;
                const response = await updateUserOperation({
                    id,
                    email: "janedoe@gmail.com",
                });
                expectError(response);
            });

            test('fails to update with invalid input', async () => {
                const id = ctx.samples?.sampleUser.id;
                const response = await updateUserOperation({
                    id,
                    email: "johndoe",
                });
                expectError(response);
            });
        });
    });
    describe('Category mutations', () => {
        const createCategoryOperation = executeOperationFactory(op.createCategoryMutation, ctx);
        const updateCategoryOperation = executeOperationFactory(op.updateCategoryMutation, ctx);
        const deleteCategoryOperation = executeOperationFactory(op.deleteCategoryMutation, ctx);

        describe('createCategory', () => {
            test('creates a category with valid data', async () => {
                const response = await createCategoryOperation({ categoryName: "Miscellaneous" });
                const data = checkResponseMatch(response, {
                    createCategory: {
                        categoryName: "Miscellaneous"
                    }
                });

                // Pass sample category to the test context for other tests.
                if (data) {
                    ctx.samples = { sampleCategory: data, ...ctx.samples };
                };

                await createCategoryOperation({ categoryName: "Trash"})
            });

            test('fails to create a category with duplicate name', async () => {
                const response = await createCategoryOperation({ categoryName: "Miscellaneous" });
                expectError(response);
            });

            test('fails to create a category with invalid data', async () => {
                const response = await createCategoryOperation({ categoryName: "1234" });
                expectError(response);
            });
        });

        describe('updateCategory', () => {
            test('updates category name successfully', async () => {
                // Fetch sample category, which we saved earlier, by its id from the context ctx.
                const id = ctx.samples?.sampleCategory.createCategory.id;
                const response = await updateCategoryOperation({ id, categoryName: "Essentials" });

                checkResponseMatch(response, {
                    updateCategory: {
                        categoryName: "Essentials"
                    }
                });
            });

            test('fails to update a non-existent category', async () => {
                const response = await updateCategoryOperation({ id: 1111111111111111, categoryName: "Essentials" });
                expectError(response);
            });

            test('fails to update with invalid input', async () => {
                const id = Number(ctx.samples?.sampleCategory.createCategory.id) + 1;
                const response = await updateCategoryOperation({ id, categoryName: "" });
                expectError(response);
            });
        });

        describe('deleteCategory', () => {
            test('deletes an existing category successfully', async () => {
                const id = Number(ctx.samples?.sampleCategory.createCategory.id) + 1;
                console.log( "Trying to delete category with ID: ", id)
                const response = await deleteCategoryOperation({ id });
                checkResponseMatch(response, {
                    deleteCategory: {
                        id: String(id)
                    }
                });
            });

            test('fails to delete a non-existent category', async () => {
                const response = await deleteCategoryOperation({ id: 11111111111 });
                expectError(response);
            });

            test('fails to delete with invalid input', async () => {
                const response = await deleteCategoryOperation({ id: "22" });
                expectError(response);
            });
        });

    });

    describe('Product mutations', () => {
        const createProductOperation = executeOperationFactory(op.createProductMutation, ctx);
        const updateProductOperation = executeOperationFactory(op.updateProductMutation, ctx);
        const deleteProductOperation = executeOperationFactory(op.deleteProductMutation, ctx);

        describe('createProduct', () => {
            test('creates a product with all properties', async () => {
                const response = await createProductOperation({
                    productName: "The Blimbop MK1",
                    description: "The most interesting gadget in the market.",
                    price: 39.99,
                    imageUrl: "http://images.com/images/image.jpeg",
                    categoryId: ctx.samples?.sampleCategory.createCategory.id,
                    sellerId: ctx.samples?.sampleUser.signUp.id,
                });

                const data = checkResponseMatch(response, {
                    createProduct: {
                        productName: "The Blimbop MK1",
                        description: "The most interesting gadget in the market.",
                        price: 39.99,
                        imageUrl: "http://images.com/images/image.jpeg",
                        category: expect.any(Object),
                        seller: expect.any(Object)
                    }
                })

                if (data) {
                    ctx.samples = { sampleProduct: data, ...ctx.samples };
                };
            });

            test('creates a product without optional properties', async () => {
                const response = await createProductOperation({
                    productName: "The FlipFlop",
                    price: 9.99,
                    categoryId: ctx.samples?.sampleCategory.createCategory.id,
                    sellerId: ctx.samples?.sampleUser.signUp.id,
                });

                checkResponseMatch(response, {
                    createProduct: {
                        productName: "The FlipFlop",
                        price: 9.99,
                        category: expect.any(Object),
                        seller: expect.any(Object)
                    }
                })
            });

            test('fails to create a product with invalid data', async () => {
                const response = await createProductOperation({
                    productName: "A Bad Item",
                    price: 0.99,
                    categoryId: 0,
                    sellerId: 0
                });
                expectError(response);
            });
        });

        describe('updateProduct', () => {
            test('updates individual product fields successfully', async () => {
                const id = ctx.samples?.sampleProduct.createProduct.id;
                const variableList: ProductUpdateVariable[] = [
                    { productName: "The Blimbop Mk2" },
                    { description: "A blimbop, but now even better" },
                    { price: 49.99 },
                    { imageUrl: "http://betterimages.com/images/image.jpeg" }
                ];

                for (const variable of variableList) {
                    const input = { id, ...variable };
                    let response = await updateProductOperation(input);
                    checkResponseMatch(response, {
                        updateProduct: { ...variable }
                    });
                };
            });

            test('updates multiple product fields successfully', async () => {
                const id = ctx.samples?.sampleProduct.createProduct.id;
                const response = await updateProductOperation({
                    id,
                    productName: "The Blimbop Mk3",
                    price: 99.99
                });
                checkResponseMatch(response, {
                    updateProduct: {
                        productName: "The Blimbop Mk3",
                        price: 99.99
                    }
                });
            });

            test('fails to update a non-existent product', async () => {
                const id = ctx.samples?.sampleProduct.createProduct.id;
                const response = await updateProductOperation({
                    id: id + 2,
                    productName: "The Big NuhUh",
                    price: 6.66,
                    categoryId: ctx.samples?.sampleCategory.createCategory.id,
                    sellerId: ctx.samples?.sampleUser.signUp.id
                });
                expectError(response);
            });

            test('fails to update with invalid input', async () => {
                const id = ctx.samples?.sampleProduct.createProduct.id;
                const response = await updateProductOperation({
                    id,
                    productName: "922222"
                })
                expectError(response);
            });
        });

        describe('deleteProduct', () => {
            test('deletes an existing product successfully', async () => {
                const id = Number(ctx.samples?.sampleProduct.createProduct.id) + 1;
                const response = await deleteProductOperation({ id });
                checkResponseMatch(response, {
                    deleteProduct: {
                        id: String(id)
                    }
                })
            });

            test('fails to delete a non-existent product', async () => {
                const id = Number(ctx.samples?.sampleProduct.createProduct.id) + 2;
                const response = await deleteProductOperation({ id })
                expectError(response);
            });

            test('fails to delete with invalid input', async () => {
                const response = await deleteProductOperation({ id: "3" })
                expectError(response);
            });
        });

    });

    describe('Order mutations', () => {
        const createOrderOperation = executeOperationFactory(op.createOrderMutation, ctx);
        const updateOrderOperation = executeOperationFactory(op.updateOrderStatusMutation, ctx);
        describe('createOrder', () => {
            test('creates an order with valid items', async () => {
                const userId = ctx.samples?.sampleUser.signUp.id;
                const productId = ctx.samples?.sampleProduct.createProduct.id;
                const response = await createOrderOperation({
                    userId,
                    items: [{ id: productId, quantity: 4 }]
                })
                const data = checkResponseMatch(response, {
                    createOrder: {
                        customer: { id: userId },
                        items: [{ id: productId, quantity: 4 }],
                        total: 99.99 * 4,
                        status: "PENDING"
                    }
                })

                if (data) {
                    ctx.samples = { sampleOrder: data, ...ctx.samples }
                }

            });

            test('fails to create an order with empty items', async () => {
                const userID = Number(ctx.samples?.sampleUser.signUp.id) + 1;
                const response = await createOrderOperation({
                    id: userID,
                    items: []
                })
                expectError(response);
            });

            test('fails to create an order with invalid input', async () => {
                const productId = Number(ctx.samples?.sampleProduct.createProduct.id) + 1;
                const response = await createOrderOperation({
                    id: 0,
                    items: [{ id: productId, quantity: 1 }]
                })
                expectError(response);
            });
        });

        describe('updateOrderStatus', () => {
            test('updates order status for an existing order successfully', async () => {
                const id = ctx.samples?.sampleOrder.createOrder.id;
                const response = await updateOrderOperation({
                    id,
                    status: "PROCESSING"
                })
                checkResponseMatch(response, {
                    updateOrderStatus: {
                        id,
                        status: "PROCESSING"
                    }
                });
            });

            test('fails to update order status for a non-existent order', async () => {
                const response = await updateOrderOperation({
                    id: 0,
                    status: "CANCELLED"
                });
                expectError(response)
            });

            test('fails to update order status with invalid input', async () => {
                const id = ctx.samples?.sampleOrder.createOrder.id;
                const response = await updateOrderOperation({
                    id,
                    status: "RECALLED"
                });
                expectError(response)
            });
        });
    });


    /* 
        Query tests that are not yet implemented. The initial tests have been conducted manually
        via Apollo Sandbox.
    */
    describe("Queries", () => {
        const getUserOperation = executeOperationFactory(op.getUserQuery, ctx);
        const getUsersOperation = executeOperationFactory(op.getUsersQuery, ctx);
        const getProductOperation = executeOperationFactory(op.getProductQuery, ctx);
        const getProductsOperation = executeOperationFactory(op.getProductsQuery, ctx);
        const getProductsByCategoryOperation = executeOperationFactory(op.getProductsByCategoryQuery, ctx);
        const getCategoryOperation = executeOperationFactory(op.getCategoryQuery, ctx);
        const getCategoriesOperation = executeOperationFactory(op.getCategoriesQuery, ctx);
        const getOrderOperation = executeOperationFactory(op.getOrderQuery, ctx);
        const getOrdersOperation = executeOperationFactory(op.getOrdersQuery, ctx);
        const getOrdersByCustomerOperation = executeOperationFactory(op.getOrdersByCustomerQuery, ctx);
        

        
        describe("getUser", () => {

        });

        describe("getUsers", () => {

        });

        describe("getProduct", () => {

        });

        describe("getProducts", () => {

        });

        describe("getProductsByCategory", () => {

        });

        describe("getCategory", () => {

        });

        describe("getCategories", () => {

        });

        describe("getOrder", () => {

        });

        describe("getOrders", () => {

        });

        describe("getOrdersByCustomer", () => {

        });
    })
});