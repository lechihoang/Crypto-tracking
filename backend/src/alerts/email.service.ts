import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import { PriceAlert } from "../schemas";
import { UserService } from "../user/user.service";

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private userService: UserService) {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  /**
   * Capitalize coin name for display
   */
  private capitalizeCoinName(coinName: string): string {
    return coinName.charAt(0).toUpperCase() + coinName.slice(1);
  }

  /**
   * Format target price by removing trailing zeros
   */
  private formatTargetPrice(price: number): string {
    // Determine decimal places based on price range
    let decimalPlaces: number;
    if (price < 0.01) {
      decimalPlaces = 8;
    } else if (price < 1) {
      decimalPlaces = 6;
    } else if (price < 100) {
      decimalPlaces = 4;
    } else {
      decimalPlaces = 2;
    }

    // Format with locale for comma separators, then remove trailing zeros
    const formatted = price.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimalPlaces,
    });

    return formatted;
  }

  /**
   * Format current price with full precision (2-8 decimal places)
   */
  private formatCurrentPrice(price: number): string {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    });
  }

  async sendPriceAlert(
    userEmail: string,
    alert: PriceAlert,
    currentPrice: number,
  ): Promise<void> {
    if (!userEmail) {
      this.logger.error("User email is required to send price alert");
      throw new Error("User email is required");
    }

    if (!alert) {
      this.logger.error("Alert data is required to send price alert");
      throw new Error("Alert data is required");
    }

    if (currentPrice === undefined || currentPrice === null) {
      this.logger.error("Current price is required to send price alert");
      throw new Error("Current price is required");
    }

    try {
      const isEnabled = await this.userService.isEmailNotificationEnabled(
        alert.userId,
      );

      if (!isEnabled) {
        this.logger.log(
          `Email notification skipped for user ${alert.userId} - notifications disabled`,
        );
        return;
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to check email notification settings for user ${alert.userId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error(
        `Failed to check email notification settings: ${errorMessage}`,
      );
    }

    const condition = alert.condition === "above" ? "vượt lên" : "giảm xuống";
    const formattedTargetPrice = this.formatTargetPrice(
      Number(alert.targetPrice),
    );
    const formattedCurrentPrice = this.formatCurrentPrice(currentPrice);
    const displayName = this.capitalizeCoinName(alert.coinId);

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: userEmail,
      subject: `🔔 Cảnh báo giá ${displayName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔔 Cảnh báo giá crypto</h1>
          </div>

          <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; margin-top: 0;">Giá ${displayName} đã ${condition} mức đặt!</h2>

            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #6b7280;">Đồng coin:</td>
                  <td style="padding: 10px 0; font-weight: bold; color: #1f2937; text-align: right;">
                    ${displayName}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280;">Giá hiện tại:</td>
                  <td style="padding: 10px 0; font-weight: bold; color: #059669; text-align: right; font-size: 18px;">
                    $${formattedCurrentPrice}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280;">Giá mục tiêu:</td>
                  <td style="padding: 10px 0; font-weight: bold; color: #1f2937; text-align: right;">
                    $${formattedTargetPrice}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280;">Điều kiện:</td>
                  <td style="padding: 10px 0; font-weight: bold; color: #1f2937; text-align: right;">
                    ${condition} $${formattedTargetPrice}
                  </td>
                </tr>
              </table>
            </div>

            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                💡 <strong>Lưu ý:</strong> Cảnh báo này đã được tắt tự động. Bạn có thể tạo cảnh báo mới nếu cần.
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL}"
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Xem chi tiết trên Crypto Tracker
              </a>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
              <p style="margin: 5px 0;">Email này được gửi từ Crypto Tracker</p>
              <p style="margin: 5px 0;">© ${new Date().getFullYear()} Crypto Tracker. All rights reserved.</p>
            </div>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Price alert email sent to ${userEmail} for ${alert.coinId}`,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to send price alert email to ${userEmail} for ${alert.coinId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error(`Failed to send price alert email: ${errorMessage}`);
    }
  }

  async sendTestEmail(to: string): Promise<void> {
    if (!to) {
      this.logger.error("Recipient email is required to send test email");
      throw new Error("Recipient email is required");
    }

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to,
      subject: "Test Email from Crypto Tracker",
      text: "This is a test email from Crypto Tracker price alert system.",
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Test email sent successfully to ${to}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to send test email to ${to}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error(`Failed to send test email: ${errorMessage}`);
    }
  }
}
