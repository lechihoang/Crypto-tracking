import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { PriceAlert } from "../schemas/price-alert.schema";
import { CreateAlertDto } from "./dto/create-alert.dto";

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectModel(PriceAlert.name)
    private alertModel: Model<PriceAlert>,
  ) {}


  /**
   * Create a new price alert for a user
   * @param userId - The user ID creating the alert
   * @param createAlertDto - Alert details (coinId, targetPrice, condition)
   * @returns The created price alert
   * @throws Error if creation fails or required fields are missing
   */
  async createAlert(
    userId: string,
    createAlertDto: CreateAlertDto,
  ): Promise<PriceAlert> {
    if (!userId) {
      this.logger.error("User ID is required to create alert");
      throw new Error("User ID is required");
    }

    if (
      !createAlertDto.coinId ||
      !createAlertDto.targetPrice ||
      !createAlertDto.condition
    ) {
      this.logger.error("Missing required fields in alert creation");
      throw new Error("coinId, targetPrice, and condition are required");
    }

    try {
      this.logger.log(
        `Creating alert for user ${userId}: ${JSON.stringify(createAlertDto)}`,
      );

      const alert = new this.alertModel({
        ...createAlertDto,
        userId,
        isActive: true,
      });

      const savedAlert = await alert.save();
      this.logger.log(`Alert created successfully: ${savedAlert._id}`);
      return savedAlert;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to create alert for user ${userId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error(`Failed to create alert: ${errorMessage}`);
    }
  }

  async getUserAlerts(userId: string): Promise<PriceAlert[]> {
    if (!userId) {
      this.logger.error("User ID is required to fetch alerts");
      throw new Error("User ID is required");
    }

    try {
      const alerts = await this.alertModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .exec();
      return alerts;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to fetch alerts for user ${userId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error(`Failed to fetch user alerts: ${errorMessage}`);
    }
  }

  async getTriggeredAlerts(userId: string): Promise<PriceAlert[]> {
    if (!userId) {
      this.logger.error("User ID is required to fetch triggered alerts");
      throw new Error("User ID is required");
    }

    try {
      const alerts = await this.alertModel
        .find({
          userId,
          isActive: false,
        })
        .sort({ triggeredAt: -1 })
        .limit(50)
        .exec();
      return alerts;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to fetch triggered alerts for user ${userId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error(`Failed to fetch triggered alerts: ${errorMessage}`);
    }
  }

  async deleteAlert(userId: string, alertId: string): Promise<void> {
    if (!userId) {
      this.logger.error("User ID is required to delete alert");
      throw new Error("User ID is required");
    }

    if (!alertId) {
      this.logger.error("Alert ID is required to delete alert");
      throw new Error("Alert ID is required");
    }

    try {
      const result = await this.alertModel
        .deleteOne({
          _id: alertId,
          userId,
        })
        .exec();

      if (result.deletedCount === 0) {
        this.logger.warn(`Alert ${alertId} not found for user ${userId}`);
        throw new NotFoundException(
          `Alert not found or you don't have permission to delete it`,
        );
      }

      this.logger.log(
        `Alert ${alertId} deleted successfully for user ${userId}`,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to delete alert ${alertId} for user ${userId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error(`Failed to delete alert: ${errorMessage}`);
    }
  }

  async toggleAlert(userId: string, alertId: string): Promise<void> {
    if (!userId) {
      this.logger.error("User ID is required to toggle alert");
      throw new Error("User ID is required");
    }

    if (!alertId) {
      this.logger.error("Alert ID is required to toggle alert");
      throw new Error("Alert ID is required");
    }

    try {
      const alert = await this.alertModel
        .findOne({ _id: alertId, userId })
        .exec();

      if (!alert) {
        this.logger.warn(`Alert ${alertId} not found for user ${userId}`);
        throw new NotFoundException(
          `Alert not found or you don't have permission to toggle it`,
        );
      }

      await this.alertModel
        .updateOne({ _id: alertId, userId }, { isActive: !alert.isActive })
        .exec();

      this.logger.log(
        `Alert ${alertId} toggled to ${!alert.isActive ? "active" : "inactive"} for user ${userId}`,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to toggle alert ${alertId} for user ${userId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error(`Failed to toggle alert: ${errorMessage}`);
    }
  }

  async updateAlert(
    userId: string,
    alertId: string,
    updateData: { condition?: "above" | "below"; targetPrice?: number; isActive?: boolean },
  ): Promise<PriceAlert> {
    if (!userId) {
      this.logger.error("User ID is required to update alert");
      throw new Error("User ID is required");
    }

    if (!alertId) {
      this.logger.error("Alert ID is required to update alert");
      throw new Error("Alert ID is required");
    }

    try {
      const alert = await this.alertModel
        .findOne({ _id: alertId, userId })
        .exec();

      if (!alert) {
        this.logger.warn(`Alert ${alertId} not found for user ${userId}`);
        throw new NotFoundException(
          `Alert not found or you don't have permission to update it`,
        );
      }

      const updatedAlert = await this.alertModel
        .findOneAndUpdate(
          { _id: alertId, userId },
          { $set: updateData },
          { new: true },
        )
        .exec();

      this.logger.log(`Alert ${alertId} updated successfully for user ${userId}`);
      return updatedAlert!;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to update alert ${alertId} for user ${userId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error(`Failed to update alert: ${errorMessage}`);
    }
  }


  /**
   * Get all active price alerts across all users
   * Used by the scheduler to check which alerts need to be triggered
   * @returns Array of active price alerts
   * @throws Error if fetch fails
   */
  async getAllActiveAlerts(): Promise<PriceAlert[]> {
    try {
      const alerts = await this.alertModel.find({ isActive: true }).exec();
      return alerts;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to fetch active alerts: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error(`Failed to fetch active alerts: ${errorMessage}`);
    }
  }

  /**
   * Mark an alert as triggered when its price condition is met
   * Sets isActive to false and records the triggered price and timestamp
   * @param alertId - The alert ID to mark as triggered
   * @param triggeredPrice - The price at which the alert was triggered
   * @throws NotFoundException if alert not found
   * @throws Error if update fails
   */
  async markAsTriggered(
    alertId: string,
    triggeredPrice: number,
  ): Promise<void> {
    if (!alertId) {
      this.logger.error("Alert ID is required to mark as triggered");
      throw new Error("Alert ID is required");
    }

    if (triggeredPrice === undefined || triggeredPrice === null) {
      this.logger.error("Triggered price is required");
      throw new Error("Triggered price is required");
    }

    try {
      const result = await this.alertModel
        .updateOne(
          { _id: alertId },
          {
            isActive: false,
            triggeredPrice,
            triggeredAt: new Date(),
          },
        )
        .exec();

      if (result.matchedCount === 0) {
        this.logger.warn(
          `Alert ${alertId} not found when marking as triggered`,
        );
        throw new NotFoundException(`Alert not found`);
      }

      this.logger.log(
        `Alert ${alertId} marked as triggered at price ${triggeredPrice}`,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to mark alert ${alertId} as triggered: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error(`Failed to mark alert as triggered: ${errorMessage}`);
    }
  }
}
