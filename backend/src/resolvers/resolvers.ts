import bcrypt from "bcrypt";
import { default as jwt } from "jsonwebtoken";
import { validateOrReject } from "class-validator";

import { User } from "../entity/User";
import { Product } from "../entity/Product";
import { Category } from "../entity/Category";
import { Order, OrderStatus } from "../entity/Order";
import { OrderItem } from "../entity/OrderItem";

import { 
    CreateProductInput, 
    DataContext, 
    OrderItemInput, 
    SignUpInput, 
    UpdateProductInput, 
    UpdateUserInput 
} from "../types";


// Helper function to validate inputs by the decorators set on the entities; e.g. @IsNotEmpty()
async function validateInput(input: any, options?: any) {
    try {
      await validateOrReject(input, options);
    } catch (errors) {
      throw new Error("Validation failed.");
    }
}

export const resolvers = {
    // Queries for fetching data from the DataSource
    Query: {
        getUser: async (_: any, { id }: { id: number }, ctx: DataContext) => {
            // Error-first check to see if a user was passed through authentication and placed into the context
            if (!ctx.user) {
                throw new Error("Authentication is required");
            }

            // Check against tampered id within request body.
            if (ctx.user?.id != id) {
                throw new Error("No authorization to access user");
            }

            const user = await ctx.dataSource.database
                .createQueryBuilder()
                .select("user")
                .from(User, "user")
                .where("user.id = :id", { id })
                .getOne();

            if (!user) {
                throw new Error("User should exist, but wasn't found.")
            }

            return user;
        },

        getUsers: async (_: any, args: any, ctx: DataContext) => {
            return await ctx.dataSource.database
                .createQueryBuilder()
                .select("user")
                .from(User, "user")
                .getMany();
        },

        getProduct: async (_: any, { id }: { id: number }, ctx: DataContext) => {
            const product = await ctx.dataSource.database
                .createQueryBuilder()
                .select("product")
                .from(Product, "product")
                .innerJoinAndSelect("product.category", "category")
                .innerJoinAndSelect("product.seller", "user")
                .where("product.id = :id", { id })
                .getOne();

            if (!product) {
                throw new Error("No product found.");
            }

            return product;
        },

        getProducts: async (_: any, args: any, ctx: DataContext) => {
            return await ctx.dataSource.database
                .createQueryBuilder(Product, "product")
                .innerJoinAndSelect("product.category", "category")
                .innerJoinAndSelect("product.seller", "user")
                .getMany();
        },

        getProductsByCategory: async (_: any, { id }: { id: number }, ctx: DataContext) => {
            return await ctx.dataSource.database
                .createQueryBuilder()
                .select("product")
                .from(Product, "product")
                .innerJoinAndSelect("product.category", "category")
                .innerJoinAndSelect("product.seller", "user")
                .where("category.id = :id", { id })
                .getMany();
        },

        getCategory: async (_: any, { id }: { id: number }, ctx: DataContext) => {
            const category =  await ctx.dataSource.database
                .createQueryBuilder()
                .select("category")
                .from(Category, "category")
                .where("category.id = :id", { id })
                .getOne();

            if (!category) {
                throw new Error("No category found.");
            }

            return category;
        },

        getCategories: async (_: any, args: any, ctx: DataContext) => {
            return await ctx.dataSource.database
                .createQueryBuilder()
                .select("category")
                .from(Category, "category")
                .getMany();
        },

        getOrder: async (_: any, { id }: { id: number }, ctx: DataContext) => {
            const order = await ctx.dataSource.database
                .createQueryBuilder()
                .select("order")
                .from(Order, "order")
                .where("order.id = :id", { id })
                .getOne();

            if (!order) {
                throw new Error("No order found.");
            }

            return order;
        },

        getOrders: async (_: any, args: any, ctx: DataContext) => {
            return await ctx.dataSource.database
                .createQueryBuilder()
                .select("order")
                .from(Order, "order")
                .getMany();
        },

        getOrdersByCustomer: async (_: any, { id }: { id: number }, ctx: DataContext) => {
            return await ctx.dataSource.database
                .createQueryBuilder()
                .select("order")
                .from(Order, "order")
                .leftJoinAndSelect("order.customer", "user")
                .leftJoinAndSelect("order.items", "orderItem")
                .leftJoinAndSelect("orderItem.product", "product")
                .where("user.id = :id", { id })
                .getMany();
        }
    },
    // Queries to manipulate data within the DataSource
    Mutation: {
        signUp: async (_: any, { firstName, lastName, email, password, role }: SignUpInput, ctx: DataContext) => {
            const manager = ctx.dataSource.database.manager;
            // Using Bcrypt library to hash and salt the raw password
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = manager.create(User, {
                firstName,
                lastName,
                email,
                password,
                role
            });
            // Validate arguments used to create user
            await validateInput(user);
            // Replace the raw password with the hashed version before saving
            user.password = hashedPassword;

            return await manager.save(user);

        },

        signIn: async (_: any, { email, password }: { email: string, password: string }, ctx: DataContext) => {
            const user = await ctx.dataSource.database
                .createQueryBuilder()
                .select("user")
                .from(User, "user")
                .where("user.email = :email", { email })
                .getOne();

            if (!user) {
                throw new Error("Invalid email or password!");
            }

            // Compare provided password to the hashed password in the database.
            const isValidPassword = await bcrypt.compare(password, user.password);

            if (!isValidPassword) {
                throw new Error("Invalid email or password!");
            }

            // Set expiration date of 1 day as UNIX timestamp and attach to token for signing
            const expiresAt = Math.floor(Date.now() / 1000) + 86400
            const token = jwt.sign({ id: user.id, email: user.email, exp: expiresAt }, process.env.JWT_SECRET as string);

            return { user, token, expiresAt };
        },

        updateUser: async (_: any, { id, ...updates }: { id: number } & UpdateUserInput, ctx: DataContext) => {
            let user = await ctx.dataSource.database
                .createQueryBuilder()
                .select("user")
                .from(User, "user")
                .where("user.id = :id", { id })
                .cache(true)
                .getOne();

            if (!user) {
                throw new Error(`User with id ${id} not found.`);
            }

            // If password is target of change, hash it before updating
            if (updates.password) {
                updates.password = await bcrypt.hash(updates.password, 10)
            }

            Object.assign(user, updates);

            await validateInput(user);

            await ctx.dataSource.database
                .createQueryBuilder()
                .update(User)
                .set(user)
                .where("user.id = :id", { id })
                .execute();

            return user;
        },

        createProduct: async (_: any, { productName, description, price, imageUrl, categoryId, sellerId }: CreateProductInput, ctx: DataContext) => {
            const manager = ctx.dataSource.database.manager;
            const category = await manager.findOneBy(Category, { id: categoryId });

            if (!category) {
                throw new Error("Category is missing.");
            };

            const seller = await manager.findOneBy(User, { id: sellerId });

            if (!seller) {
                throw new Error("No seller assigned.");
            };

            const product = manager.create(Product, {
                productName,
                description,
                price,
                imageUrl,
                category,
                seller
            });

            await validateInput(product);

            return await manager.save(product);
        },

        updateProduct: async (_: any, { id, ...updates }: { id: number } & UpdateProductInput, ctx: DataContext) => {
            const manager = ctx.dataSource.database.manager;
            const product = await manager.findOneBy(Product, { id });

            if (!product) {
                throw new Error("Product does not exist!");
            }

            // In case somehow a number-string is passed
            const numberfiedPrice = Number(product.price)

            Object.assign(product, { price: numberfiedPrice, ...updates });
            await validateInput(product)

            return await manager.save(Product, product);
        },

        deleteProduct: async (_: any, { id }: { id: number }, ctx: DataContext) => {
            const manager = ctx.dataSource.database.manager;
            const product = await manager.findOneBy(Product, { id });

            if (!product) {
                throw new Error("Product does not exist!");
            }

            await manager.delete(Product, id);
            return product;
        },

        createCategory: async (_: any, { categoryName }: { categoryName: string }, ctx: DataContext) => {
            const manager = ctx.dataSource.database.manager;
            const category = manager.create(Category, {
                categoryName
            });

            await validateInput(category);

            return await manager.save(category);
        },

        updateCategory: async (_: any, { id, categoryName }: { id: number, categoryName: string }, ctx: DataContext) => {
            const manager = ctx.dataSource.database.manager;
            const category = await manager.findOneBy(Category, { id });

            if (!category) {
                throw new Error("Category does not exist");
            }

            Object.assign(category, { categoryName });
            await validateInput(category);

            return await manager.save(category);

        },

        deleteCategory: async (_: any, { id }: { id: number }, ctx: DataContext) => {
            const manager = ctx.dataSource.database.manager;
            const category = await manager.findOneBy(Category, { id });

            if (!category) {
                throw new Error("Category does not exist");
            }

            await manager.delete(Category, id);
            return category;
        },

        createOrder: async (_: any, { userId, items }: { userId: number, items: OrderItemInput[] }, ctx: DataContext) => {
            const manager = ctx.dataSource.database.manager;
            
            // Fetch products from 'items' argument and package as orderItem
            const orderItems = await Promise.all(items.map(async (item) => {
                const product = await manager.findOneBy(Product, { id: item.id });
                if (!product) {
                    throw new Error(`Error fetching product with ID: ${item.id}`);
                }
                const orderItem = manager.create(OrderItem, {
                    product,
                    quantity: item.quantity,
                    price: item.quantity * product.price,
                });
                return orderItem;
            }));

            const total: number = orderItems.reduce((total, item) => total + item.price, 0);
            const customer = await manager.findOneBy(User, { id: userId });
            const order: Order = new Order();

            Object.assign(order, {
                customer,
                items: orderItems,
                total,
                status: "PENDING"
            })
            await validateInput(order);
            return await manager.save(order);
        },

        updateOrderStatus: async (_: any, { id, status }: { id: number, status: OrderStatus }, ctx: DataContext) => {
            const manager = ctx.dataSource.database.manager;
            const order = await manager
                .createQueryBuilder()
                .select("order")
                .from(Order, "order")
                .innerJoinAndSelect("order.customer", "user")
                .where("order.id = :id", { id })
                .getOne();

            if (!order) {
                throw new Error("Order couldn't be found");
            }

            Object.assign(order, { status });

            return await manager.save(order);

        },
    }
}