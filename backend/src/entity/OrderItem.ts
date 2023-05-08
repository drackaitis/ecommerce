import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Relation
} from "typeorm";

import { Order } from "./Order";
import { Product } from "./Product";
import { IsInt, IsNotEmpty, Min } from "class-validator";

@Entity()
export class OrderItem {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Order, order => order.items)
    order: Relation<Order>;

    @ManyToOne(() => Product, product => product.orderItems)
    product: Relation<Product>;

    @Column()
    @IsNotEmpty()
    @IsInt()
    @Min(1)
    quantity!: number;

    @Column({ type: "decimal", precision: 10, scale: 2})
    price!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}