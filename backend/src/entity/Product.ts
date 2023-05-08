import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    Relation
} from "typeorm"

import { 
    IsNotEmpty, 
    MinLength, 
    MaxLength, 
    Min, 
    IsUrl, 
    IsOptional, 
    Matches 
} from "class-validator";

import { User } from "./User";
import { Category } from "./Category";
import { OrderItem } from "./OrderItem";

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    @IsNotEmpty()
    @Matches(/.*[a-zA-Z].*/)
    @MinLength(2)
    productName!: string
    
    @Column({ length: 200, default: null })
    @IsOptional()
    @MaxLength(200)
    description?: string

    @Column({ type: "decimal", precision: 10, scale: 2})
    @IsNotEmpty()
    @Min(0)
    price!: number

    @Column({ default: null })
    @IsOptional()
    @IsUrl()
    imageUrl?: string

    @ManyToOne(() => Category, { onDelete: "CASCADE"})
    category!: Relation<Category>

    @ManyToOne(() => User, { onDelete: "CASCADE"})
    seller!: Relation<User>

    @OneToMany(() => OrderItem, orderItem => orderItem.product)
    orderItems: Relation<OrderItem[]>

    @CreateDateColumn()
    createdAt!: Date

    @UpdateDateColumn()
    updatedAt!: Date
};