import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { AlertsService } from "../alerts.service";
import { PriceAlert } from "../../entities";
import { CryptoService } from "../../crypto/crypto.service";
import { CreateAlertDto } from "../dto/create-alert.dto";

describe("AlertsService", () => {
  let service: AlertsService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  };

  const mockCryptoService = {
    getTopCoins: jest.fn(),
    getCoinDetails: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        {
          provide: getRepositoryToken(PriceAlert),
          useValue: mockRepository,
        },
        {
          provide: CryptoService,
          useValue: mockCryptoService,
        },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createAlert", () => {
    it("should create a price alert successfully", async () => {
      const userId = "user-123";
      const createAlertDto: CreateAlertDto = {
        coinId: "bitcoin",
        coinSymbol: "BTC",
        coinName: "Bitcoin",
        condition: "above",
        targetPrice: 50000,
      };

      const mockAlert: PriceAlert = {
        id: "alert-1",
        userId,
        ...createAlertDto,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockAlert);
      mockRepository.save.mockResolvedValue(mockAlert);

      const result = await service.createAlert(userId, createAlertDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId,
        coinId: createAlertDto.coinId,
        coinSymbol: createAlertDto.coinSymbol,
        coinName: createAlertDto.coinName,
        condition: createAlertDto.condition,
        targetPrice: createAlertDto.targetPrice,
        isActive: true,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockAlert);
      expect(result).toEqual(mockAlert);
    });

    it("should create alert with 'below' condition", async () => {
      const userId = "user-456";
      const createAlertDto: CreateAlertDto = {
        coinId: "ethereum",
        coinSymbol: "ETH",
        coinName: "Ethereum",
        condition: "below",
        targetPrice: 3000,
      };

      const mockAlert: PriceAlert = {
        id: "alert-2",
        userId,
        ...createAlertDto,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockAlert);
      mockRepository.save.mockResolvedValue(mockAlert);

      const result = await service.createAlert(userId, createAlertDto);

      expect(result.condition).toBe("below");
      expect(result.targetPrice).toBe(3000);
    });
  });

  describe("getUserAlerts", () => {
    it("should return all alerts for a user", async () => {
      const userId = "user-123";
      const mockAlerts: PriceAlert[] = [
        {
          id: "alert-1",
          userId,
          coinId: "bitcoin",
          coinSymbol: "BTC",
          coinName: "Bitcoin",
          condition: "above",
          targetPrice: 50000,
          isActive: true,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
        {
          id: "alert-2",
          userId,
          coinId: "ethereum",
          coinSymbol: "ETH",
          coinName: "Ethereum",
          condition: "below",
          targetPrice: 3000,
          isActive: true,
          createdAt: new Date("2024-01-02"),
          updatedAt: new Date("2024-01-02"),
        },
      ];

      mockRepository.find.mockResolvedValue(mockAlerts);

      const result = await service.getUserAlerts(userId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: "DESC" },
      });
      expect(result).toEqual(mockAlerts);
      expect(result).toHaveLength(2);
    });

    it("should return empty array if user has no alerts", async () => {
      const userId = "user-no-alerts";
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getUserAlerts(userId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe("deleteAlert", () => {
    it("should delete an alert successfully", async () => {
      const userId = "user-123";
      const alertId = "alert-1";

      mockRepository.delete.mockResolvedValue({ affected: 1, raw: [] });

      await service.deleteAlert(userId, alertId);

      expect(mockRepository.delete).toHaveBeenCalledWith({
        id: alertId,
        userId,
      });
    });

    it("should throw error if alert not found", async () => {
      const userId = "user-123";
      const alertId = "non-existent-alert";

      mockRepository.delete.mockResolvedValue({ affected: 0, raw: [] });

      await expect(service.deleteAlert(userId, alertId)).rejects.toThrow(
        "Alert not found",
      );
    });

    it("should not delete alert from another user", async () => {
      const userId = "user-123";
      const alertId = "alert-owned-by-other-user";

      mockRepository.delete.mockResolvedValue({ affected: 0, raw: [] });

      await expect(service.deleteAlert(userId, alertId)).rejects.toThrow(
        "Alert not found",
      );
    });
  });

  describe("toggleAlert", () => {
    it("should activate an alert", async () => {
      const userId = "user-123";
      const alertId = "alert-1";
      const isActive = true;

      mockRepository.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      await service.toggleAlert(userId, alertId, isActive);

      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: alertId, userId },
        { isActive },
      );
    });

    it("should deactivate an alert", async () => {
      const userId = "user-123";
      const alertId = "alert-1";
      const isActive = false;

      mockRepository.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      await service.toggleAlert(userId, alertId, isActive);

      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: alertId, userId },
        { isActive: false },
      );
    });

    it("should throw error if alert not found", async () => {
      const userId = "user-123";
      const alertId = "non-existent-alert";

      mockRepository.update.mockResolvedValue({ affected: 0, raw: [], generatedMaps: [] });

      await expect(
        service.toggleAlert(userId, alertId, true),
      ).rejects.toThrow("Alert not found");
    });
  });

  describe("getAllActiveAlerts", () => {
    it("should return all active alerts", async () => {
      const mockActiveAlerts: PriceAlert[] = [
        {
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
        },
        {
          id: "alert-2",
          userId: "user-2",
          coinId: "ethereum",
          coinSymbol: "ETH",
          coinName: "Ethereum",
          condition: "below",
          targetPrice: 3000,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.find.mockResolvedValue(mockActiveAlerts);

      const result = await service.getAllActiveAlerts();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
      });
      expect(result).toEqual(mockActiveAlerts);
      expect(result.every((alert) => alert.isActive)).toBe(true);
    });

    it("should return empty array if no active alerts", async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getAllActiveAlerts();

      expect(result).toEqual([]);
    });
  });

  describe("disableAlert", () => {
    it("should disable an alert", async () => {
      const alertId = "alert-1";

      mockRepository.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      await service.disableAlert(alertId);

      expect(mockRepository.update).toHaveBeenCalledWith(alertId, {
        isActive: false,
      });
    });

    it("should disable alert even if already inactive", async () => {
      const alertId = "alert-already-inactive";

      mockRepository.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      await service.disableAlert(alertId);

      expect(mockRepository.update).toHaveBeenCalledWith(alertId, {
        isActive: false,
      });
    });
  });
});
