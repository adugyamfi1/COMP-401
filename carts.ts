import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { IShopStatus, IUserStatus, IUserTypes } from "../utils/types";
import { Users } from "./Users";
import { Products } from "./Products";

@Entity()
export class Carts {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false, type: "int" })
  quantity!: number;

  @ManyToOne(() => Products, (product) => product.id)
  product!: number;

  @ManyToOne(() => Users, (user) => user.id)
  user!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
