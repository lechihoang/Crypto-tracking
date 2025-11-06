import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ collection: "price_alerts", timestamps: true })
export class PriceAlert extends Document {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  coinId: string; // CoinGecko ID: bitcoin, ethereum, etc.

  @Prop({ required: true, enum: ["above", "below"] })
  condition: "above" | "below";

  @Prop({ required: true })
  targetPrice: number;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ type: Number, required: false })
  triggeredPrice?: number;

  @Prop({ type: Date, required: false })
  triggeredAt?: Date;
}

export const PriceAlertSchema = SchemaFactory.createForClass(PriceAlert);
