import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Users } from "./Users";

@Entity()
export class UserOrders {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  trackingNumber!: string;

  @Column({ type: "int" })
  amount!: number;

  @Column({ type: "json" })
  products!: any;

  @ManyToOne(() => Users, (user) => user.id)
  user!: number;

  @Column({
    type: "enum",
    enum: ["PENDING", "PAID", "PAY-ON-DELIVERY"],
    default: "PENDING",
  })
  paymentStatus!: "PENDING" | "PAID" | "PAY-ON-DELIVERY";

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
