/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from "@nestjs/testing";
import { EmailService } from "../email.service";
import { PriceAlert } from "../../schemas/price-alert.schema";
import { UserService } from "../../user/user.service";
import * as nodemailer from "nodemailer";

// Mock nodemailer
jest.mock("nodemailer");

interface MockTransporter {
  sendMail: jest.Mock;
}

describe("EmailService", () => {
  let service: EmailService;
  let mockTransporter: MockTransporter;
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(async () => {
    // Create mock transporter
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: "test-message-id" }),
    };

    // Mock createTransport
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    // Mock UserService
    mockUserService = {
      isEmailNotificationEnabled: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<UserService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("sendPriceAlert", () => {
    it("should send price alert email when price goes above target", async () => {
      const mockAlert: any = {
        _id: "alert-1",
        userId: "user-1",
        coinName: "bitcoin",
        condition: "above",
        targetPrice: 50000,
        isActive: true,
        createdAt: new Date(),
      };

      const userEmail = "test@example.com";
      const currentPrice = 51000;

      await service.sendPriceAlert(userEmail, mockAlert, currentPrice);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining<{ to: string; subject: string; html: string }>({
          to: userEmail,
          subject: expect.stringContaining("Bitcoin") as string,
          html: expect.stringContaining("vượt lên") as string,
        }),
      );
    });

    it("should send price alert email when price goes below target", async () => {
      const mockAlert: any = {
        _id: "alert-2",
        userId: "user-1",
        coinName: "ethereum",
        condition: "below",
        targetPrice: 3000,
        isActive: true,
        createdAt: new Date(),
      };

      const userEmail = "test@example.com";
      const currentPrice = 2900;

      await service.sendPriceAlert(userEmail, mockAlert, currentPrice);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining<{ to: string; subject: string; html: string }>({
          to: userEmail,
          subject: expect.stringContaining("Ethereum") as string,
          html: expect.stringContaining("giảm xuống") as string,
        }),
      );
    });

    it("should include current price and target price in email", async () => {
      const mockAlert: any = {
        _id: "alert-3",
        userId: "user-1",
        coinName: "bitcoin",
        condition: "above",
        targetPrice: 50000,
        isActive: true,
        createdAt: new Date(),
      };

      const userEmail = "test@example.com";
      const currentPrice = 52000;

      await service.sendPriceAlert(userEmail, mockAlert, currentPrice);

      const calls = mockTransporter.sendMail.mock.calls as Array<
        [{ html: string }]
      >;
      const emailCall = calls[0]?.[0];
      if (emailCall) {
        expect(emailCall.html).toContain("52,000");
        expect(emailCall.html).toContain("50,000");
        expect(emailCall.html).toContain("Bitcoin");
      }
    });

    it("should throw error when email sending fails", async () => {
      const mockAlert: any = {
        _id: "alert-4",
        userId: "user-1",
        coinName: "bitcoin",
        condition: "above",
        targetPrice: 50000,
        isActive: true,
        createdAt: new Date(),
      };

      const userEmail = "invalid@example.com";
      const currentPrice = 51000;

      // Mock email sending failure
      mockTransporter.sendMail.mockRejectedValueOnce(
        new Error("Email sending failed"),
      );

      await expect(
        service.sendPriceAlert(userEmail, mockAlert, currentPrice),
      ).rejects.toThrow("Email sending failed");
    });

    it("should format prices with comma separators", async () => {
      const mockAlert: any = {
        _id: "alert-5",
        userId: "user-1",
        coinName: "bitcoin",
        condition: "above",
        targetPrice: 123456.789,
        isActive: true,
        createdAt: new Date(),
      };

      const userEmail = "test@example.com";
      const currentPrice = 234567.89;

      await service.sendPriceAlert(userEmail, mockAlert, currentPrice);

      const calls = mockTransporter.sendMail.mock.calls as Array<
        [{ html: string }]
      >;
      const emailCall = calls[0]?.[0];
      // Check that prices are formatted with commas
      // Note: formatTargetPrice rounds to 2 decimal places for prices > 100
      if (emailCall) {
        expect(emailCall.html).toMatch(/234,567\.89/);
        expect(emailCall.html).toMatch(/123,456\.79/); // Rounded to 2 decimals
      }
    });
  });

  describe("sendTestEmail", () => {
    it("should send test email successfully", async () => {
      const testEmail = "test@example.com";

      await service.sendTestEmail(testEmail);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining<{ to: string; subject: string }>({
          to: testEmail,
          subject: "Test Email from Crypto Tracker",
        }),
      );
    });

    it("should throw error when test email fails", async () => {
      const testEmail = "fail@example.com";

      mockTransporter.sendMail.mockRejectedValueOnce(
        new Error("Connection refused"),
      );

      await expect(service.sendTestEmail(testEmail)).rejects.toThrow(
        "Connection refused",
      );
    });
  });

  describe("transporter initialization", () => {
    it("should create transporter with correct configuration", () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          service: "gmail",
          auth: expect.objectContaining({
            user: process.env.GMAIL_USER as string,
            pass: process.env.GMAIL_APP_PASSWORD as string,
          }),
        }),
      );
    });
  });

  describe("email notification preferences", () => {
    it("should send email when notifications are enabled", async () => {
      // Mock user has email notifications enabled
      mockUserService.isEmailNotificationEnabled.mockResolvedValue(true);

      const mockAlert: any = {
        _id: "alert-1",
        userId: "user-1",
        coinName: "bitcoin",
        condition: "above",
        targetPrice: 50000,
        isActive: true,
        triggeredPrice: undefined,
        triggeredAt: undefined,
        createdAt: new Date(),
      };

      await service.sendPriceAlert("test@example.com", mockAlert, 51000);

      // Verify that preference was checked
      expect(mockUserService.isEmailNotificationEnabled).toHaveBeenCalledWith(
        "user-1",
      );

      // Verify email was sent
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "test@example.com",
          subject: expect.stringContaining("Bitcoin"),
        }),
      );
    });

    it("should NOT send email when notifications are disabled", async () => {
      // Mock user has email notifications disabled
      mockUserService.isEmailNotificationEnabled.mockResolvedValue(false);

      const mockAlert: any = {
        _id: "alert-2",
        userId: "user-2",
        coinName: "bitcoin",
        condition: "above",
        targetPrice: 50000,
        isActive: true,
        triggeredPrice: undefined,
        triggeredAt: undefined,
        createdAt: new Date(),
      };

      await service.sendPriceAlert("test@example.com", mockAlert, 51000);

      // Verify that preference was checked
      expect(mockUserService.isEmailNotificationEnabled).toHaveBeenCalledWith(
        "user-2",
      );

      // Verify email was NOT sent
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });

    it("should check preference for each user separately", async () => {
      // User 1: notifications enabled
      mockUserService.isEmailNotificationEnabled.mockImplementation(
        (userId: string) => {
          return Promise.resolve(userId === "user-1");
        },
      );

      const alert1: any = {
        _id: "alert-1",
        userId: "user-1",
        coinName: "bitcoin",
        condition: "above",
        targetPrice: 50000,
        isActive: true,
        triggeredPrice: undefined,
        triggeredAt: undefined,
        createdAt: new Date(),
      };

      const alert2: any = {
        _id: "alert-2",
        userId: "user-2",
        coinName: "bitcoin",
        condition: "above",
        targetPrice: 50000,
        isActive: true,
        triggeredPrice: undefined,
        triggeredAt: undefined,
        createdAt: new Date(),
      };

      // Send for user 1 (enabled)
      await service.sendPriceAlert("user1@example.com", alert1, 51000);
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);

      // Send for user 2 (disabled)
      await service.sendPriceAlert("user2@example.com", alert2, 51000);
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1); // Still 1, not called again

      // Verify both preferences were checked
      expect(mockUserService.isEmailNotificationEnabled).toHaveBeenCalledWith(
        "user-1",
      );
      expect(mockUserService.isEmailNotificationEnabled).toHaveBeenCalledWith(
        "user-2",
      );
    });
  });
});
