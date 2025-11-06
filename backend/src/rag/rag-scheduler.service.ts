import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { RagService } from "./rag.service";

@Injectable()
export class RagSchedulerService {
  private readonly logger = new Logger(RagSchedulerService.name);
  private isRefreshing = false;

  constructor(private readonly ragService: RagService) {}

  /**
   * Auto-refresh crypto data every day at 2:00 AM
   * This ensures the knowledge base is updated with latest crypto info
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleDailyRefresh() {
    if (this.isRefreshing) {
      this.logger.warn("Refresh already in progress, skipping...");
      return;
    }

    try {
      this.isRefreshing = true;
      this.logger.log("Starting scheduled crypto data refresh...");

      await this.ragService.refreshCryptoData();

      this.logger.log("✓ Scheduled refresh completed successfully");
    } catch (error: unknown) {
      this.logger.error("Failed to refresh crypto data:", error);
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Optional: Refresh every 6 hours for more frequent updates
   * Uncomment if you want more frequent updates
   */
  // @Cron(CronExpression.EVERY_6_HOURS)
  // async handleFrequentRefresh() {
  //   if (this.isRefreshing) {
  //     this.logger.warn("Refresh already in progress, skipping...");
  //     return;
  //   }

  //   try {
  //     this.isRefreshing = true;
  //     this.logger.log("Starting frequent crypto data refresh...");

  //     await this.ragService.refreshCryptoData();

  //     this.logger.log("✓ Frequent refresh completed successfully");
  //   } catch (error: unknown) {
  //     this.logger.error("Failed to refresh crypto data:", error);
  //   } finally {
  //     this.isRefreshing = false;
  //   }
  // }

  /**
   * Manual trigger for refresh (can be called via API endpoint)
   */
  async triggerManualRefresh(): Promise<{ success: boolean; message: string }> {
    if (this.isRefreshing) {
      return {
        success: false,
        message: "Refresh is already in progress. Please wait.",
      };
    }

    try {
      this.isRefreshing = true;
      this.logger.log("Starting manual crypto data refresh...");

      await this.ragService.refreshCryptoData();

      this.logger.log("✓ Manual refresh completed successfully");
      return {
        success: true,
        message: "Crypto knowledge base refreshed successfully",
      };
    } catch (error: unknown) {
      this.logger.error("Failed to refresh crypto data:", error);
      return {
        success: false,
        message: `Refresh failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Get refresh status
   */
  getRefreshStatus(): { isRefreshing: boolean } {
    return { isRefreshing: this.isRefreshing };
  }
}
