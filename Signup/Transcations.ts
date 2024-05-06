import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserOrders } from "./UserOrders";

@Entity()
export class Transactions {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => UserOrders, (order) => order.id)
  orderId!: number;

  @Column({
    type: "enum",
    enum: [
      "Incomplete",
      "Incomplete, awaiting payment",
      "Incomplete, expired",
      "Incomplete, failed",
      "Canceled",
      "Succeeded",
      "Refunded",
      "Failed",
      "Processing",
    ],
  })
  status!:
    | "Incomplete"
    | "Incomplete, awaiting payment"
    | "Incomplete, expired"
    | "Incomplete, failed"
    | "Canceled"
    | "Succeeded"
    | "Refunded"
    | "Failed"
    | "Processing";

  @Column({ type: "longtext" })
  reference!: number;

  @Column({ type: "json" })
  paymentIntent!: any;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
