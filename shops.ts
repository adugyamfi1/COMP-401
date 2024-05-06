import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { orderStatuses } from "../utils/data";
import { IOrderStatus } from "../utils/types";
import { Products } from "./Products";
import { Shops } from "./Shops";
import { Users } from "./Users";

@Entity()
export class ShopOrders {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  trackingNumber!: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  unitPrice!: number;

  @Column({ type: "int" })
  quantity!: string;

  @ManyToOne(() => Users, (user) => user.id)
  user!: number;

  @ManyToOne(() => Shops, (shop) => shop.id, { nullable: true })
  shop!: number;

  @ManyToOne(() => Products, (product) => product.id)
  product!: number;

  @Column({
    type: "enum",
    enum: orderStatuses,
    default: "PENDING",
  })
  orderStatus!: IOrderStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
