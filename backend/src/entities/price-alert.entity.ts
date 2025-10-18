import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity("price_alerts")
@Index(["userId"])
@Index(["isActive"])
export class PriceAlert {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ name: "coin_id", type: "integer" })
  coinId: number;

  @Column({ name: "coin_symbol", type: "varchar", length: 20 })
  coinSymbol: string;

  @Column({ name: "coin_name", type: "varchar", length: 100 })
  coinName: string;

  @Column({ name: "coin_image", type: "varchar", length: 500, nullable: true })
  coinImage?: string;

  @Column({
    type: "enum",
    enum: ["above", "below"],
  })
  condition: "above" | "below";

  @Column({ name: "target_price", type: "decimal", precision: 20, scale: 8 })
  targetPrice: number;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
