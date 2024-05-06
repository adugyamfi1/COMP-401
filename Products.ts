import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Users } from "./Users";
import { ISecondaryImages } from "../utils/interfaces";
import { ProductCategories } from "./ProductCategories";
import { Shops } from "./Shops";

@Entity()
export class Products {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "longtext", nullable: false })
  name!: string;

  @Column({ type: "longtext", nullable: false })
  primaryImage!: string;

  @Column({ type: "json", nullable: true })
  secondaryImages!: ISecondaryImages[];

  @Column({ nullable: true, type: "longtext" })
  description!: string;

  @Column({ nullable: true, type: "longtext" })
  keywords!: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price!: number;

  @Column({ type: "enum", enum: ["GHS", "USD"] })
  currency!: string;

  @Column({ nullable: false, type: "int" })
  quantity!: number;

  @Column({ type: "int", default: 0 })
  quantitySold!: number;

  @Column({
    type: "enum",
    enum: ["In Stock", "Out of Stock"],
    default: "In Stock",
  })
  stockStatus!: "In Stock" | "Out of Stock";

  @Column({ nullable: true })
  brand!: string;

  @Column({
    type: "enum",
    enum: ["ACTIVE", "INACTIVE"],
    default: "ACTIVE",
  })
  productStatus!: "ACTIVE" | "INACTIVE";

  @ManyToOne(() => Shops, (shop) => shop.id)
  shop!: number;

  @ManyToOne(() => ProductCategories, (category) => category.id)
  category!: number;

  @ManyToOne(() => Users, (user) => user.id)
  owner!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
