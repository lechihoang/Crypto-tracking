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
      let marketData;
      try {
        marketData = await this.cryptoService.getTopCoins(250, 1);
        if (!marketData || marketData.length === 0) {
          this.logger.warn("No market data returned from CryptoService");
          return;
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        this.logger.error(
          `Failed to fetch market data from CryptoService: ${errorMessage}`,
          error instanceof Error ? error.stack : undefined,
        );
        // Don't throw - just log and return to allow next scheduled run
        return;
      }

      const priceMap = new Map(
        marketData.map((coin) => [coin.coinId, coin.current_price]),
      );

      for (const alert of activeAlerts) {
        if (!alert.coinId || !alert.targetPrice || !alert.condition) {
          this.logger.warn(`Invalid alert data: ${JSON.stringify(alert)}`);
          continue;
        }

        const currentPrice = priceMap.get(alert.coinId);
        if (!currentPrice || typeof currentPrice !== "number") {
          this.logger.warn(`No valid price found for coin ${alert.coinId}`);
          continue;
        }

        const shouldTrigger =
          (alert.condition === "above" &&
            currentPrice >= Number(alert.targetPrice)) ||
          (alert.condition === "below" &&
            currentPrice <= Number(alert.targetPrice));

        if (shouldTrigger) {
          this.logger.log(
            `Alert triggered for ${alert.coinId}: ${currentPrice} ${alert.condition} ${alert.targetPrice}`,
          );

          try {
            // Try to get user email from our database first
            let user;
            try {
              user = await this.userService.getUser(alert.userId);
            } catch (error: unknown) {
              const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
              this.logger.error(
                `Failed to get user from database for userId ${alert.userId}: ${errorMessage}`,
                error instanceof Error ? error.stack : undefined,
              );
            }

            let userEmail = user?.email;

            // If email not in database, fallback to Auth0 API (for Google OAuth users or legacy users)
            if (!userEmail) {
              this.logger.log(
                `Email not in database for userId ${alert.userId}, fetching from Auth0...`,
              );
              try {
                const auth0User = await this.auth0Service.getUserById(
                  alert.userId,
                );
                userEmail = auth0User.email;

                // Save email to database for future use
                if (userEmail) {
                  await this.userService.upsertUser(alert.userId, userEmail);
                  this.logger.log(
                    `Email saved to database for userId ${alert.userId}`,
                  );
                }
              } catch (auth0Error: unknown) {
                const errorMessage =
                  auth0Error instanceof Error
                    ? auth0Error.message
                    : "Unknown error";
                this.logger.error(
                  `Failed to get email from Auth0 for userId ${alert.userId}: ${errorMessage}`,
                  auth0Error instanceof Error ? auth0Error.stack : undefined,
                );
              }
            }

            if (!userEmail) {
              this.logger.error(
                `No email found for userId ${alert.userId} in both database and Auth0`,
              );
              continue;
            }

            try {
              await this.emailService.sendPriceAlert(
                userEmail,
                alert,
                currentPrice,
              );
            } catch (emailError: unknown) {
              const errorMessage =
                emailError instanceof Error
                  ? emailError.message
                  : "Unknown error";
              this.logger.error(
                `Failed to send price alert email for alert ${(alert as any)._id}: ${errorMessage}`,
                emailError instanceof Error ? emailError.stack : undefined,
              );
              // Continue to mark as triggered even if email fails
            }

            try {
              await this.alertsService.markAsTriggered(
                (alert as any)._id.toString(),
                currentPrice,
              );
              this.logger.log(
                `Alert ${(alert as any)._id} marked as triggered`,
              );
            } catch (markError: unknown) {
              const errorMessage =
                markError instanceof Error
                  ? markError.message
                  : "Unknown error";
              this.logger.error(
                `Failed to mark alert ${(alert as any)._id} as triggered: ${errorMessage}`,
                markError instanceof Error ? markError.stack : undefined,
              );
            }
          } catch (error: unknown) {
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";
            this.logger.error(
              `Failed to process alert ${(alert as any)._id}: ${errorMessage}`,
              error instanceof Error ? error.stack : undefined,
            );
          }
        }
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Error checking price alerts: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
