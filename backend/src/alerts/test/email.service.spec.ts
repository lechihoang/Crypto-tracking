import { Test, TestingModule } from "@nestjs/testing";
import { EmailService } from "../email.service";
import { PriceAlert } from "../../entities";
import * as nodemailer from "nodemailer";

// Mock nodemailer
jest.mock("nodemailer");

describe("EmailService", () => {
  let service: EmailService;
  let mockTransporter: any;

  beforeEach(async () => {
    // Create mock transporter
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: "test-message-id" }),
    };

    // Mock createTransport
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
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
      const mockAlert: PriceAlert = {
        id: "alert-1",
        userId: "user-1",
        coinId: "bitcoin",
        coinSymbol: "BTC",
        coinName: "Bitcoin",
        condition: "above",
        targetPrice: 50000,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const userEmail = "test@example.com";
      const currentPrice = 51000;

      await service.sendPriceAlert(userEmail, mockAlert, currentPrice);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: userEmail,
          subject: expect.stringContaining("Bitcoin"),
          html: expect.stringContaining("vượt lên"),
        }),
      );
    });

    it("should send price alert email when price goes below target", async () => {
      const mockAlert: PriceAlert = {
        id: "alert-2",
        userId: "user-1",
        coinId: "ethereum",
        coinSymbol: "ETH",
        coinName: "Ethereum",
        condition: "below",
        targetPrice: 3000,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const userEmail = "test@example.com";
      const currentPrice = 2900;

      await service.sendPriceAlert(userEmail, mockAlert, currentPrice);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: userEmail,
          subject: expect.stringContaining("Ethereum"),
          html: expect.stringContaining("giảm xuống"),
        }),
      );
    });

    it("should include current price and target price in email", async () => {
      const mockAlert: PriceAlert = {
        id: "alert-3",
        userId: "user-1",
        coinId: "bitcoin",
        coinSymbol: "BTC",
        coinName: "Bitcoin",
        condition: "above",
        targetPrice: 50000,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const userEmail = "test@example.com";
      const currentPrice = 52000;

      await service.sendPriceAlert(userEmail, mockAlert, currentPrice);

      const emailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(emailCall.html).toContain("52,000");
      expect(emailCall.html).toContain("50,000");
      expect(emailCall.html).toContain("Bitcoin");
      expect(emailCall.html).toContain("BTC");
    });

    it("should throw error when email sending fails", async () => {
      const mockAlert: PriceAlert = {
        id: "alert-4",
        userId: "user-1",
        coinId: "bitcoin",
        coinSymbol: "BTC",
        coinName: "Bitcoin",
        condition: "above",
        targetPrice: 50000,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
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
      const mockAlert: PriceAlert = {
        id: "alert-5",
        userId: "user-1",
        coinId: "bitcoin",
        coinSymbol: "BTC",
        coinName: "Bitcoin",
        condition: "above",
        targetPrice: 123456.789,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const userEmail = "test@example.com";
      const currentPrice = 234567.89;

      await service.sendPriceAlert(userEmail, mockAlert, currentPrice);

      const emailCall = mockTransporter.sendMail.mock.calls[0][0];
      // Check that prices are formatted with commas
      expect(emailCall.html).toMatch(/234,567\.89/);
      expect(emailCall.html).toMatch(/123,456\.789/);
    });
  });

  describe("sendTestEmail", () => {
    it("should send test email successfully", async () => {
      const testEmail = "test@example.com";

      await service.sendTestEmail(testEmail);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
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
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
          }),
        }),
      );
    });
  });
});
