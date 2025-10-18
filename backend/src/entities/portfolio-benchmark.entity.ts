import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

@Entity("portfolio_benchmarks")
@Index(["userId"], { unique: true })
export class PortfolioBenchmark {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({
    name: "benchmark_value",
    type: "decimal",
    precision: 20,
    scale: 8,
  })
  benchmarkValue: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @Column({ name: "updated_at", type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;
}
