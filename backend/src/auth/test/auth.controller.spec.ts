import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import { AuthController } from "../auth.controller";
import { AuthService } from "../auth.service";
import {
  SignUpDto,
  SignInDto,
  ResetPasswordDto,
  UpdatePasswordDto,
  ChangePasswordDto,
} from "../dto/auth.dto";

describe("AuthController", () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    signUp: jest.fn(),
    signIn: jest.fn(),
    resetPassword: jest.fn(),
    updatePassword: jest.fn(),
    changePassword: jest.fn(),
    getUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("signUp", () => {
    it("should successfully sign up a user", async () => {
      const signUpDto: SignUpDto = {
        email: "test@example.com",
        password: "Password123!",
        fullName: "Test User",
      };

      const mockResponse = {
        user: { id: "user-123", email: signUpDto.email },
        message: "Please check your email to confirm your account",
      };

      mockAuthService.signUp.mockResolvedValue(mockResponse);

      const result = await controller.signUp(signUpDto);

      expect(authService.signUp).toHaveBeenCalledWith(signUpDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe("signIn", () => {
    it("should successfully sign in a user and return formatted response", async () => {
      const signInDto: SignInDto = {
        email: "test@example.com",
        password: "Password123!",
      };

      const mockUser = {
        id: "user-123",
        email: signInDto.email,
        user_metadata: { full_name: "Test User" },
      };

      const mockSession = {
        access_token: "access-token-123",
        refresh_token: "refresh-token-123",
      };

      mockAuthService.signIn.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });

      const result = await controller.signIn(signInDto);

      expect(authService.signIn).toHaveBeenCalledWith(signInDto);
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          full_name: mockUser.user_metadata.full_name,
        },
        access_token: mockSession.access_token,
      });
    });

    it("should handle user without user_metadata", async () => {
      const signInDto: SignInDto = {
        email: "test@example.com",
        password: "Password123!",
      };

      const mockUser = {
        id: "user-123",
        email: signInDto.email,
      };

      const mockSession = {
        access_token: "access-token-123",
        refresh_token: "refresh-token-123",
      };

      mockAuthService.signIn.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });

      const result = await controller.signIn(signInDto);

      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          full_name: undefined,
        },
        access_token: mockSession.access_token,
      });
    });
  });

  describe("resetPassword", () => {
    it("should successfully send password reset email", async () => {
      const resetPasswordDto: ResetPasswordDto = {
        email: "test@example.com",
      };

      const mockResponse = {
        message: "Password reset email sent",
      };

      mockAuthService.resetPassword.mockResolvedValue(mockResponse);

      const result = await controller.resetPassword(resetPasswordDto);

      expect(authService.resetPassword).toHaveBeenCalledWith(resetPasswordDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe("updatePassword", () => {
    it("should successfully update password", async () => {
      const updatePasswordDto: UpdatePasswordDto = {
        password: "NewPassword123!",
        accessToken: "valid-access-token",
      };

      const mockResponse = {
        message: "Password updated successfully",
      };

      mockAuthService.updatePassword.mockResolvedValue(mockResponse);

      const result = await controller.updatePassword(updatePasswordDto);

      expect(authService.updatePassword).toHaveBeenCalledWith(
        updatePasswordDto,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe("changePassword", () => {
    it("should successfully change password with valid token", async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: "OldPassword123!",
        newPassword: "NewPassword123!",
      };
      const authHeader = "Bearer valid-access-token";

      const mockResponse = {
        message: "Password changed successfully",
      };

      mockAuthService.changePassword.mockResolvedValue(mockResponse);

      const result = await controller.changePassword(
        changePasswordDto,
        authHeader,
      );

      expect(authService.changePassword).toHaveBeenCalledWith(
        changePasswordDto,
        "valid-access-token",
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw UnauthorizedException if no auth header", async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: "OldPassword123!",
        newPassword: "NewPassword123!",
      };

      await expect(
        controller.changePassword(changePasswordDto, ""),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        controller.changePassword(changePasswordDto, ""),
      ).rejects.toThrow("Authorization header required");
    });

    it("should extract token from Bearer header correctly", async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: "OldPassword123!",
        newPassword: "NewPassword123!",
      };
      const authHeader = "Bearer my-access-token-123";

      mockAuthService.changePassword.mockResolvedValue({
        message: "Password changed successfully",
      });

      await controller.changePassword(changePasswordDto, authHeader);

      expect(authService.changePassword).toHaveBeenCalledWith(
        changePasswordDto,
        "my-access-token-123",
      );
    });
  });

  describe("getProfile", () => {
    it("should successfully get user profile with valid token", async () => {
      const authHeader = "Bearer valid-access-token";
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        user_metadata: { full_name: "Test User" },
      };

      mockAuthService.getUser.mockResolvedValue(mockUser);

      const result = await controller.getProfile(authHeader);

      expect(authService.getUser).toHaveBeenCalledWith("valid-access-token");
      expect(result).toEqual(mockUser);
    });

    it("should throw UnauthorizedException if no auth header", async () => {
      await expect(controller.getProfile("")).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.getProfile("")).rejects.toThrow(
        "Authorization header required",
      );
    });

    it("should extract token from Bearer header correctly", async () => {
      const authHeader = "Bearer another-token-456";
      const mockUser = {
        id: "user-456",
        email: "user@example.com",
      };

      mockAuthService.getUser.mockResolvedValue(mockUser);

      await controller.getProfile(authHeader);

      expect(authService.getUser).toHaveBeenCalledWith("another-token-456");
    });
  });
});
