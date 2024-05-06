import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Users } from "./Users";

@Entity()
export class ProductCategories {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ nullable: true, type: "longtext" })
  logo!: string;

  @Column({ type: "boolean", default: true })
  isMainCategory!: boolean;

  @Column({ nullable: true, type: "int" })
  mainCategory!: number;

  @ManyToOne(() => Users, (user) => user.id)
  creator!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
