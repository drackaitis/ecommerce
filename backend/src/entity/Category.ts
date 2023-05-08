import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    PrimaryGeneratedColumn
} from "typeorm";

import { IsAlpha, IsNotEmpty, MinLength } from "class-validator";

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column( { unique: true })
    @IsNotEmpty()
    @IsAlpha()
    @MinLength(2)
    categoryName!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}