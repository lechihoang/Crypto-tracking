import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { AlertsService } from "./alerts.service";
import { EmailService } from "./email.service";
import { CryptoService } from "../crypto/crypto.service";
import { AuthService } from "../auth/auth.service";

@Injectable()
export class AlertsSchedulerService {
  private readonly logger = new Logger(AlertsSchedulerService.name);

  constructor(
    private alertsService: AlertsService,
    private emailService: EmailService,
    private cryptoService: CryptoService,
    private authService: AuthService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE) // Check every minute
  async checkPriceAlerts() {
    this.logger.log("Checking price alerts...");

    try {
      const activeAlerts = await this.alertsService.getAllActiveAlerts();
      this.logger.log(`Found ${activeAlerts.length} active alerts to check`);

      if (activeAlerts.length === 0) {
        return;
      }

      // Group alerts by coinId to minimize API calls
      const alertsByCoin = new Map<number, typeof activeAlerts>();
      for (const alert of activeAlerts) {
        if (!alertsByCoin.has(alert.coinId)) {
          alertsByCoin.set(alert.coinId, []);
        }
        alertsByCoin.get(alert.coinId)!.push(alert);
      }

      // Get prices for all coins at once
      const coinIds = Array.from(alertsByCoin.keys());
      const prices = await this.cryptoService.getCurrentPrices(coinIds);

      // Check each alert
      for (const alert of activeAlerts) {
        const currentPrice = prices[alert.coinId];
        if (!currentPrice) {
          this.logger.warn(`No price found for coin ${alert.coinId}`);
          continue;
        }

        let shouldTrigger = false;
        if (alert.condition === "above" && currentPrice >= alert.targetPrice) {
          shouldTrigger = true;
        } else if (alert.condition === "below" && currentPrice <= alert.targetPrice) {
          shouldTrigger = true;
        }

        if (shouldTrigger) {
          this.logger.log(
            `Alert triggered for ${alert.coinName}: ${currentPrice} ${alert.condition} ${alert.targetPrice}`,
          );

          // Get user info from Supabase
          try {
            // Get user email from Supabase using userId
            const { data: userData, error } = await this.authService
              .getSupabaseAdmin()
              .auth.admin.getUserById(alert.userId);

            if (error || !userData?.user?.email) {
              this.logger.error(`Failed to get user email for userId ${alert.userId}`);
              continue;
            }

            // Send email
            await this.emailService.sendPriceAlert(
              userData.user.email,
              alert,
              currentPrice,
            );

            // Delete the alert after triggering
            await this.alertsService.disableAlert(alert.id);
            this.logger.log(`Alert ${alert.id} deleted after triggering`);
          } catch (error) {
            this.logger.error(`Failed to process alert ${alert.id}:`, error);
          }
        }
      }
    } catch (error) {
      this.logger.error("Error checking price alerts:", error);
    }
  }
}
