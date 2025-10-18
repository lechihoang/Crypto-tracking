import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

@Entity("chat_messages")
@Index(["userId"])
@Index(["sessionId"])
@Index(["createdAt"])
export class ChatMessage {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id", type: "uuid", nullable: true })
  userId: string | null;

  @Column({ name: "session_id", type: "uuid" })
  sessionId: string;

  @Column({
    type: "enum",
    enum: ["user", "assistant", "system"],
  })
  role: "user" | "assistant" | "system";

  @Column({ type: "text" })
  content: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
