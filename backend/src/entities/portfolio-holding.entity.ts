import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from "typeorm";

@Entity("portfolio_holdings")
@Index(["userId"])
@Unique(["userId", "coinId"])
export class PortfolioHolding {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ name: "coin_id", type: "varchar", length: 100 })
  coinId: string;

  @Column({ name: "coin_symbol", type: "varchar", length: 20 })
  coinSymbol: string;

  @Column({ name: "coin_name", type: "varchar", length: 100 })
  coinName: string;

  @Column({ name: "coin_image", type: "text", nullable: true })
  coinImage?: string;

  @Column({ type: "decimal", precision: 20, scale: 8 })
  quantity: number;

  @Column({
    name: "average_buy_price",
    type: "decimal",
    precision: 20,
    scale: 8,
    nullable: true,
  })
  averageBuyPrice?: number;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
