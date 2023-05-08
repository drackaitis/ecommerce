import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column,
    Index,
    CreateDateColumn, 
    UpdateDateColumn,
    OneToMany,
    Relation
} from "typeorm";

import { 
    IsEmail, 
    IsNotEmpty, 
    MinLength, 
    IsEnum, 
    IsOptional 
} from "class-validator";

import { Product } from "./Product";
import { Order } from "./Order";

export enum UserRole {
    CUSTOMER = "CUSTOMER",
    ADMIN = "ADMIN",
    SELLER = "SELLER"
}

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    @IsNotEmpty()
    @MinLength(2)
    firstName!: string

    @Column( { default: null })
    @IsOptional()
    @MinLength(2)
    lastName?: string

    @Index("idx_1", { synchronize: false})
    @Column({ unique: true })
    @IsNotEmpty()
    @IsEmail()
    email!: string

    @Column()
    @IsNotEmpty()
    @MinLength(8)
    password!: string

    @Column({
        type: "enum",
        enum: UserRole,
        default: UserRole.CUSTOMER
    })
    @IsEnum(UserRole)
    role: UserRole

    @CreateDateColumn()
    createdAt!: Date

    @UpdateDateColumn()
    updatedAt!: Date

    @OneToMany(() => Product, product => product.seller, { onDelete: "CASCADE"})
    products: Relation<Product[]>;

    @OneToMany(() => Order, order => order.customer, { cascade: true, onDelete: "CASCADE" })
    orders: Relation<Order[]>
}


