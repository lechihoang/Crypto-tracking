import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ collection: "chat_messages", timestamps: true })
export class ChatMessage extends Document {
  @Prop({ type: String, index: true, default: null })
  userId: string | null;

  @Prop({ required: true, index: true })
  sessionId: string;

  @Prop({ required: true, enum: ["user", "assistant", "system"] })
  role: "user" | "assistant" | "system";

  @Prop({ required: true })
  content: string;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
