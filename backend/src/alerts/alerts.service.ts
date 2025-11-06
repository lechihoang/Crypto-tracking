import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { PriceAlert } from "../schemas/price-alert.schema";
import { CreateAlertDto } from "./dto/create-alert.dto";

@Injectable()
export class AlertsService {
  constructor(
    @InjectModel(PriceAlert.name)
    private alertModel: Model<PriceAlert>,
  ) {}

  async createAlert(
    userId: string,
    createAlertDto: CreateAlertDto,
  ): Promise<PriceAlert> {
    console.log(
      `[AlertsService] Creating alert for user ${userId}:`,
      createAlertDto,
    );

    const alert = new this.alertModel({
      ...createAlertDto,
      userId,
      isActive: true,
    });

    const savedAlert = await alert.save();
    console.log(`[AlertsService] Alert created successfully:`, savedAlert);
    return savedAlert;
  }

  async getUserAlerts(userId: string): Promise<PriceAlert[]> {
    console.log(`[AlertsService] Fetching alerts for user: ${userId}`);
    const alerts = await this.alertModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
    console.log(
      `[AlertsService] Found ${alerts.length} alerts:`,
      JSON.stringify(alerts, null, 2),
    );
    return alerts;
  }

  async getTriggeredAlerts(userId: string): Promise<PriceAlert[]> {
    console.log(
      `[AlertsService] Fetching triggered alerts for user: ${userId}`,
    );
    const alerts = await this.alertModel
      .find({
        userId,
        isActive: false,
      })
      .sort({ triggeredAt: -1 })
      .limit(50) // Limit to last 50 triggered alerts
      .exec();
    console.log(`[AlertsService] Found ${alerts.length} triggered alerts`);
    console.log(
      `[AlertsService] Alert details:`,
      alerts.map((a) => ({
        id: a._id,
        coinId: a.coinId,
        targetPrice: a.targetPrice,
        triggeredPrice: a.triggeredPrice,
        triggeredAt: a.triggeredAt,
      })),
    );
    return alerts;
  }

  async deleteAlert(userId: string, alertId: string): Promise<void> {
    const result = await this.alertModel
      .deleteOne({
        _id: alertId,
        userId,
      })
      .exec();

    if (result.deletedCount === 0) {
      throw new Error("Alert not found");
    }
  }

  async toggleAlert(
    userId: string,
    alertId: string,
  ): Promise<void> {
    const alert = await this.alertModel.findOne({ _id: alertId, userId }).exec();

    if (!alert) {
      throw new Error("Alert not found");
    }

    await this.alertModel
      .updateOne({ _id: alertId, userId }, { isActive: !alert.isActive })
      .exec();
  }

  async getAllActiveAlerts(): Promise<PriceAlert[]> {
    return this.alertModel.find({ isActive: true }).exec();
  }

  async disableAlert(alertId: string): Promise<void> {
    // Delete the alert instead of just disabling it
    await this.alertModel.deleteOne({ _id: alertId }).exec();
  }

  async markAsTriggered(
    alertId: string,
    triggeredPrice: number,
  ): Promise<void> {
    await this.alertModel
      .updateOne(
        { _id: alertId },
        {
          isActive: false,
          triggeredPrice,
          triggeredAt: new Date(),
        },
      )
      .exec();
  }
}
