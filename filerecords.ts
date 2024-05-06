import "reflect-metadata";
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
export class FilesRecord {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "json" })
  image!: any;

  @ManyToOne(() => Users, (user) => user.id)
  creator!: any;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
