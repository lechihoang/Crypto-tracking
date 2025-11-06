import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ collection: "portfolio_holdings", timestamps: true })
export class PortfolioHolding extends Document {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  coinId: string; // CoinGecko ID - use this to fetch coin details from API

  @Prop({ required: true, type: Number })
  quantity: number;

  @Prop({ type: Number, required: false })
  averageBuyPrice?: number;

  @Prop({ type: String, required: false })
  notes?: string;
}

export const PortfolioHoldingSchema =
  SchemaFactory.createForClass(PortfolioHolding);

// Compound unique index for userId + coinId combination
PortfolioHoldingSchema.index({ userId: 1, coinId: 1 }, { unique: true });
