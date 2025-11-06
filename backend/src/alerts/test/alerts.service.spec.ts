import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { AlertsService } from "../alerts.service";
import { PriceAlert } from "../../schemas/price-alert.schema";
import { CreateAlertDto } from "../dto/create-alert.dto";

describe("AlertsService", () => {
  let service: AlertsService;

  // Mock Mongoose model instance methods
  const mockSave = jest.fn();
  const mockExec = jest.fn();
  const mockSort = jest.fn();
  const mockLimit = jest.fn();
  const mockFind = jest.fn();
  const mockFindOne = jest.fn();
  const mockDeleteOne = jest.fn();
  const mockUpdateOne = jest.fn();

  // Mock Mongoose model constructor
  const mockAlertModel: any = jest.fn().mockImplementation((dto) => ({
    ...dto,
    save: mockSave,
  }));

  // Add static methods to the mock model
  mockAlertModel.find = mockFind.mockReturnValue({
    sort: mockSort.mockReturnValue({
      exec: mockExec,
      limit: mockLimit.mockReturnValue({
        exec: mockExec,
      }),
    }),
    exec: mockExec,
  });
  mockAlertModel.findOne = mockFindOne.mockReturnValue({
    exec: mockExec,
  });
  mockAlertModel.deleteOne = mockDeleteOne.mockReturnValue({
    exec: mockExec,
  });
  mockAlertModel.updateOne = mockUpdateOne.mockReturnValue({
    exec: mockExec,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        {
          provide: getModelToken(PriceAlert.name),
          useValue: mockAlertModel,
        },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);

    // Reset mocks
    jest.clearAllMocks();
    mockSort.mockReturnValue({
      exec: mockExec,
      limit: mockLimit.mockReturnValue({
        exec: mockExec,
      }),
    });
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
        condition: "above",
        targetPrice: 50000,
      };

      const mockAlert = {
        _id: "alert-1",
        userId,
        ...createAlertDto,
        isActive: true,
        createdAt: new Date(),
      };

      mockSave.mockResolvedValue(mockAlert);

      const result = await service.createAlert(userId, createAlertDto);

      expect(mockAlertModel).toHaveBeenCalledWith({
        ...createAlertDto,
        userId,
        isActive: true,
      });
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(mockAlert);
    });

    it("should create alert with 'below' condition", async () => {
      const userId = "user-456";
      const createAlertDto: CreateAlertDto = {
        coinId: "ethereum",
        condition: "below",
        targetPrice: 3000,
      };

      const mockAlert = {
        _id: "alert-2",
        userId,
        ...createAlertDto,
        isActive: true,
        createdAt: new Date(),
      };

      mockSave.mockResolvedValue(mockAlert);

      const result = await service.createAlert(userId, createAlertDto);

      expect(result.condition).toBe("below");
      expect(result.targetPrice).toBe(3000);
    });
  });

  describe("getUserAlerts", () => {
    it("should return all alerts for a user", async () => {
      const userId = "user-123";
      const mockAlerts = [
        {
          _id: "alert-1",
          userId,
          coinName: "bitcoin",
          condition: "above",
          targetPrice: 50000,
          isActive: true,
          createdAt: new Date("2024-01-01"),
        },
        {
          _id: "alert-2",
          userId,
          coinName: "ethereum",
          condition: "below",
          targetPrice: 3000,
          isActive: true,
          createdAt: new Date("2024-01-02"),
        },
      ];

      mockExec.mockResolvedValue(mockAlerts);

      const result = await service.getUserAlerts(userId);

      expect(mockAlertModel.find).toHaveBeenCalledWith({ userId });
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockExec).toHaveBeenCalled();
      expect(result).toEqual(mockAlerts);
      expect(result).toHaveLength(2);
    });

    it("should return empty array if user has no alerts", async () => {
      const userId = "user-no-alerts";
      mockExec.mockResolvedValue([]);

      const result = await service.getUserAlerts(userId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe("deleteAlert", () => {
    it("should delete an alert successfully", async () => {
      const userId = "user-123";
      const alertId = "alert-1";

      mockExec.mockResolvedValue({ deletedCount: 1 });

      await service.deleteAlert(userId, alertId);

      expect(mockAlertModel.deleteOne).toHaveBeenCalledWith({
        _id: alertId,
        userId,
      });
      expect(mockExec).toHaveBeenCalled();
    });

    it("should throw error if alert not found", async () => {
      const userId = "user-123";
      const alertId = "non-existent-alert";

      mockExec.mockResolvedValue({ deletedCount: 0 });

      await expect(service.deleteAlert(userId, alertId)).rejects.toThrow(
        "Alert not found",
      );
    });

    it("should not delete alert from another user", async () => {
      const userId = "user-123";
      const alertId = "alert-owned-by-other-user";

      mockExec.mockResolvedValue({ deletedCount: 0 });

      await expect(service.deleteAlert(userId, alertId)).rejects.toThrow(
        "Alert not found",
      );
    });
  });

  describe("toggleAlert", () => {
    it("should toggle an alert from inactive to active", async () => {
      const userId = "user-123";
      const alertId = "alert-1";
      const mockAlert = { isActive: false };

      mockFindOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAlert),
      });

      mockExec.mockResolvedValue({ matchedCount: 1 });

      await service.toggleAlert(userId, alertId);

      expect(mockAlertModel.findOne).toHaveBeenCalledWith({ _id: alertId, userId });
      expect(mockAlertModel.updateOne).toHaveBeenCalledWith(
        { _id: alertId, userId },
        { isActive: true },
      );
    });

    it("should toggle an alert from active to inactive", async () => {
      const userId = "user-123";
      const alertId = "alert-1";
      const mockAlert = { isActive: true };

      mockFindOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAlert),
      });

      mockExec.mockResolvedValue({ matchedCount: 1 });

      await service.toggleAlert(userId, alertId);

      expect(mockAlertModel.findOne).toHaveBeenCalledWith({ _id: alertId, userId });
      expect(mockAlertModel.updateOne).toHaveBeenCalledWith(
        { _id: alertId, userId },
        { isActive: false },
      );
    });

    it("should throw error if alert not found", async () => {
      const userId = "user-123";
      const alertId = "non-existent-alert";

      mockFindOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.toggleAlert(userId, alertId)).rejects.toThrow(
        "Alert not found",
      );
    });
  });

  describe("getAllActiveAlerts", () => {
    it("should return all active alerts", async () => {
      const mockActiveAlerts = [
        {
          _id: "alert-1",
          userId: "user-1",
          coinName: "bitcoin",
          condition: "above",
          targetPrice: 50000,
          isActive: true,
          createdAt: new Date(),
        },
        {
          _id: "alert-2",
          userId: "user-2",
          coinName: "ethereum",
          condition: "below",
          targetPrice: 3000,
          isActive: true,
          createdAt: new Date(),
        },
      ];

      mockExec.mockResolvedValue(mockActiveAlerts);

      const result = await service.getAllActiveAlerts();

      expect(mockAlertModel.find).toHaveBeenCalledWith({ isActive: true });
      expect(mockExec).toHaveBeenCalled();
      expect(result).toEqual(mockActiveAlerts);
      expect(result.every((alert) => alert.isActive)).toBe(true);
    });

    it("should return empty array if no active alerts", async () => {
      mockExec.mockResolvedValue([]);

      const result = await service.getAllActiveAlerts();

      expect(result).toEqual([]);
    });
  });

  describe("disableAlert", () => {
    it("should disable an alert by deleting it", async () => {
      const alertId = "alert-1";

      mockExec.mockResolvedValue({ deletedCount: 1 });

      await service.disableAlert(alertId);

      expect(mockAlertModel.deleteOne).toHaveBeenCalledWith({ _id: alertId });
      expect(mockExec).toHaveBeenCalled();
    });

    it("should handle alert that does not exist", async () => {
      const alertId = "alert-already-deleted";

      mockExec.mockResolvedValue({ deletedCount: 0 });

      await service.disableAlert(alertId);

      expect(mockAlertModel.deleteOne).toHaveBeenCalledWith({ _id: alertId });
      expect(mockExec).toHaveBeenCalled();
    });
  });
});
