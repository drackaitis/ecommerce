import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    OneToMany,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Relation
} from "typeorm";

import { User } from "./User";
import { OrderItem } from "./OrderItem";
import { ArrayMinSize, IsNotEmpty, Min, IsEnum } from "class-validator";

export enum OrderStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    SHIPPED = "SHIPPED",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED"
}

@Entity()
export class Order {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, user => user.products)
    @IsNotEmpty()
    customer: Relation<User>;

    @OneToMany(() => OrderItem, orderItem => orderItem.order, { cascade: true })
    @IsNotEmpty()
    @ArrayMinSize(1)
    items: Relation<OrderItem[]>;

    @Column({ type: "decimal", precision: 10, scale: 2})
    @IsNotEmpty()
    @Min(0)
    total!: number;

    @Column({type: "enum", enum: OrderStatus, default: OrderStatus.PENDING})
    @IsEnum(OrderStatus)
    status: OrderStatus;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}