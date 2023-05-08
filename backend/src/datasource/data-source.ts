import * as dotenv from "dotenv";
dotenv.config();

import { DataSource } from "typeorm";
import { User } from "../entity/User";
import { Order } from "../entity/Order";
import { Product } from "../entity/Product";
import { OrderItem } from "../entity/OrderItem";
import { Category } from "../entity/Category";

// Initialize database connection
export const db = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.NODE_ENV === "test" ? process.env.TEST_DATABASE : process.env.DB_DATABASE,
    synchronize: true, // Automatically synchronize database schema
    logging: false, // Disable database query logging
    cache: true, // Enable query caching
    entities: [User, Order, Product, OrderItem, Category]
});