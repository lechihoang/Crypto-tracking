import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ collection: "portfolio_snapshots", timestamps: true })
export class PortfolioSnapshot extends Document {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, type: Number })
  totalValue: number;

  // Note: createdAt is automatically added by timestamps and serves as snapshotDate
  // updatedAt is also added but snapshots should be immutable
}

export const PortfolioSnapshotSchema =
  SchemaFactory.createForClass(PortfolioSnapshot);

// Index for querying snapshots by date
PortfolioSnapshotSchema.index({ userId: 1, createdAt: -1 });
