import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import { Response } from "express";
import { AuthController } from "../auth.controller";
import { AuthService } from "../auth.service";
import { Auth0Service } from "../auth0.service";
import {
  SignUpDto,
  SignInDto,
  ResetPasswordDto,
  UpdatePasswordDto,
  ChangePasswordDto,
} from "../dto/auth.dto";

describe("AuthController", () => {
  let controller: AuthController;

  const mockAuthService = {
    signUp: jest.fn(),
    signIn: jest.fn(),
    resetPassword: jest.fn(),
    updatePassword: jest.fn(),
    changePassword: jest.fn(),
    getUser: jest.fn(),
  };

  const mockAuth0Service = {
    getAuthorizationUrl: jest.fn(),
    exchangeCodeForTokens: jest.fn(),
    getUserByToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: Auth0Service,
          useValue: mockAuth0Service,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
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

      expect(mockAuthService.signUp).toHaveBeenCalledWith(signUpDto);
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
        name: "Test User",
        picture: "https://example.com/avatar.jpg",
      };

      const mockSession = {
        access_token: "access-token-123",
        id_token: "id-token-123",
        token_type: "Bearer",
        expires_in: 86400,
      };

      mockAuthService.signIn.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });

      const result = await controller.signIn(signInDto);

      expect(mockAuthService.signIn).toHaveBeenCalledWith(signInDto);
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          picture: mockUser.picture,
        },
        access_token: mockSession.access_token,
        id_token: mockSession.id_token,
        expires_in: mockSession.expires_in,
      });
    });

    it("should handle user without optional fields", async () => {
      const signInDto: SignInDto = {
        email: "test@example.com",
        password: "Password123!",
      };

      const mockUser = {
        id: "user-123",
        email: signInDto.email,
        name: undefined,
        picture: undefined,
      };

      const mockSession = {
        access_token: "access-token-123",
        id_token: "id-token-123",
        token_type: "Bearer",
        expires_in: 86400,
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
          name: undefined,
          picture: undefined,
        },
        access_token: mockSession.access_token,
        id_token: mockSession.id_token,
        expires_in: mockSession.expires_in,
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

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
        resetPasswordDto,
      );
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

      expect(mockAuthService.updatePassword).toHaveBeenCalledWith(
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

      expect(mockAuthService.changePassword).toHaveBeenCalledWith(
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

      expect(mockAuthService.changePassword).toHaveBeenCalledWith(
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

      expect(mockAuthService.getUser).toHaveBeenCalledWith(
        "valid-access-token",
      );
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

      expect(mockAuthService.getUser).toHaveBeenCalledWith("another-token-456");
    });
  });

  describe("googleLogin", () => {
    it("should redirect to Google OAuth URL", async () => {
      const mockAuthUrl =
        "https://dev-example.auth0.com/authorize?client_id=123&connection=google-oauth2";
      const mockResponse = {
        redirect: jest.fn(),
      } as unknown as Response;

      mockAuth0Service.getAuthorizationUrl.mockReturnValue(mockAuthUrl);

      await controller.googleLogin(mockResponse);

      expect(mockAuth0Service.getAuthorizationUrl).toHaveBeenCalledWith(
        "google-oauth2",
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(mockAuthUrl);
    });
  });

  describe("authCallback", () => {
    it("should handle successful OAuth callback and redirect with tokens", async () => {
      const code = "auth-code-123";
      const mockTokens = {
        access_token: "access-token-123",
        id_token: "id-token-123",
        token_type: "Bearer",
        expires_in: 86400,
      };
      const mockUser = {
        user_id: "auth0|123",
        email: "user@example.com",
        name: "Test User",
        picture: "https://example.com/avatar.jpg",
        email_verified: true,
      };

      const mockResponse = {
        redirect: jest.fn(),
      } as unknown as Response;

      mockAuth0Service.exchangeCodeForTokens.mockResolvedValue(mockTokens);
      mockAuth0Service.getUserByToken.mockResolvedValue(mockUser);

      await controller.authCallback(code, "", mockResponse);

      expect(mockAuth0Service.exchangeCodeForTokens).toHaveBeenCalledWith(code);
      expect(mockAuth0Service.getUserByToken).toHaveBeenCalledWith(
        mockTokens.access_token,
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining("http://localhost:3000/auth/callback"),
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining("access_token=access-token-123"),
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining("user_id=auth0%7C123"),
      );
    });

    it("should redirect with error if OAuth returns error", async () => {
      const error = "access_denied";
      const mockResponse = {
        redirect: jest.fn(),
      } as unknown as Response;

      await controller.authCallback("", error, mockResponse);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining("error=access_denied"),
      );
      expect(mockAuth0Service.exchangeCodeForTokens).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException if no code provided", async () => {
      const mockResponse = {
        redirect: jest.fn(),
      } as unknown as Response;

      await expect(
        controller.authCallback("", "", mockResponse),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        controller.authCallback("", "", mockResponse),
      ).rejects.toThrow("Authorization code missing");
    });

    it("should redirect with error if token exchange fails", async () => {
      const code = "invalid-code";
      const mockResponse = {
        redirect: jest.fn(),
      } as unknown as Response;

      mockAuth0Service.exchangeCodeForTokens.mockRejectedValue(
        new Error("Invalid code"),
      );

      await controller.authCallback(code, "", mockResponse);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining("error="),
      );
    });
  });
});
