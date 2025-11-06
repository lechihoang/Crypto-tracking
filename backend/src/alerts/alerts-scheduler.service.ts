import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { AlertsService } from "./alerts.service";
import { EmailService } from "./email.service";
import { UserService } from "../user/user.service";
import { Auth0Service } from "../auth/auth0.service";
import { CryptoService } from "../crypto/crypto.service";

@Injectable()
export class AlertsSchedulerService {
  private readonly logger = new Logger(AlertsSchedulerService.name);

  constructor(
    private alertsService: AlertsService,
    private emailService: EmailService,
    private userService: UserService,
    private auth0Service: Auth0Service,
    private cryptoService: CryptoService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async checkPriceAlerts() {
    this.logger.log("Checking price alerts...");

    try {
      const activeAlerts = await this.alertsService.getAllActiveAlerts();
      this.logger.log(`Found ${activeAlerts.length} active alerts to check`);

      if (activeAlerts.length === 0) {
        return;
      }


      // Fetch market data from CryptoService (with cache)
      const marketData = await this.cryptoService.getTopCoins(250, 1);
      const priceMap = new Map(marketData.map(coin => [coin.coinId, coin.current_price]));

      // Check each alert
      for (const alert of activeAlerts) {
        const currentPrice = priceMap.get(alert.coinId);
        if (!currentPrice) {
          this.logger.warn(`No price found for coin ${alert.coinId}`);
          continue;
        }

        const shouldTrigger =
          (alert.condition === "above" && currentPrice >= alert.targetPrice) ||
          (alert.condition === "below" && currentPrice <= alert.targetPrice);

        if (shouldTrigger) {
          this.logger.log(`Alert triggered for ${alert.coinId}: ${currentPrice} ${alert.condition} ${alert.targetPrice}`);

          try {
            // Try to get user email from our database first
            const user = await this.userService.getUser(alert.userId);
            let userEmail = user?.email;

            // If email not in database, fallback to Auth0 API (for Google OAuth users or legacy users)
            if (!userEmail) {
              this.logger.log(`Email not in database for userId ${alert.userId}, fetching from Auth0...`);
              try {
                const auth0User = await this.auth0Service.getUserById(alert.userId);
                userEmail = auth0User.email;

                // Save email to database for future use
                if (userEmail) {
                  await this.userService.upsertUser(alert.userId, userEmail);
                  this.logger.log(`Email saved to database for userId ${alert.userId}`);
                }
              } catch (auth0Error: unknown) {
                this.logger.error(`Failed to get email from Auth0 for userId ${alert.userId}:`, auth0Error);
              }
            }

            if (!userEmail) {
              this.logger.error(`No email found for userId ${alert.userId} in both database and Auth0`);
              continue;
            }

            await this.emailService.sendPriceAlert(userEmail, alert, currentPrice);

            await this.alertsService.markAsTriggered((alert as any)._id.toString(), currentPrice);
            this.logger.log(`Alert ${(alert as any)._id} marked as triggered`);
          } catch (error: unknown) {
            this.logger.error(`Failed to process alert ${(alert as any)._id}:`, error);
          }
        }
      }
    } catch (error: unknown) {
      this.logger.error("Error checking price alerts:", error);
    }
  }
}
