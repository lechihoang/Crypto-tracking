import { Test, TestingModule } from "@nestjs/testing";
import {
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { AuthService } from "../auth.service";
import { Auth0Service } from "../auth0.service";
import {
  SignUpDto,
  SignInDto,
  ResetPasswordDto,
  UpdatePasswordDto,
  ChangePasswordDto,
} from "../dto/auth.dto";

describe("AuthService", () => {
  let service: AuthService;

  const mockAuth0Service = {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    getUserByToken: jest.fn(),
    updatePassword: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: Auth0Service,
          useValue: mockAuth0Service,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("signUp", () => {
    it("should successfully sign up a new user", async () => {
      const signUpDto: SignUpDto = {
        email: "newuser@example.com",
        password: "Password123!",
        fullName: "New User",
      };

      const mockUser = {
        _id: "auth0|123",
        email: signUpDto.email,
        email_verified: false,
      };

      mockAuth0Service.signUp.mockResolvedValue(mockUser);

      const result = await service.signUp(signUpDto);

      expect(mockAuth0Service.signUp).toHaveBeenCalledWith(
        signUpDto.email,
        signUpDto.password,
        signUpDto.fullName,
      );
      expect(result).toEqual({
        user: {
          id: mockUser._id,
          email: mockUser.email,
          user_metadata: { full_name: signUpDto.fullName },
        },
        message: "Please check your email to confirm your account",
      });
    });

    it("should handle user_id field from response", async () => {
      const signUpDto: SignUpDto = {
        email: "user@example.com",
        password: "Password123!",
        fullName: "Test User",
      };

      const mockUser = {
        user_id: "auth0|456",
        email: signUpDto.email,
      };

      mockAuth0Service.signUp.mockResolvedValue(mockUser);

      const result = await service.signUp(signUpDto);

      expect(result.user.id).toBe(mockUser.user_id);
    });

    it("should throw ConflictException if user already exists", async () => {
      const signUpDto: SignUpDto = {
        email: "existing@example.com",
        password: "Password123!",
        fullName: "Existing User",
      };

      mockAuth0Service.signUp.mockRejectedValue(
        new UnauthorizedException("User already exists"),
      );

      await expect(service.signUp(signUpDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it("should throw UnauthorizedException for other signup errors", async () => {
      const signUpDto: SignUpDto = {
        email: "invalid@example.com",
        password: "weak",
        fullName: "Test User",
      };

      mockAuth0Service.signUp.mockRejectedValue(
        new UnauthorizedException("Password is too weak"),
      );

      await expect(service.signUp(signUpDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("signIn", () => {
    it("should successfully sign in a user", async () => {
      const signInDto: SignInDto = {
        email: "test@example.com",
        password: "Password123!",
      };

      const mockTokens = {
        access_token: "access-token-123",
        id_token: "id-token-123",
        token_type: "Bearer",
        expires_in: 86400,
      };

      const mockUser = {
        user_id: "auth0|123",
        email: signInDto.email,
        name: "Test User",
        picture: "https://example.com/avatar.jpg",
        email_verified: true,
      };

      mockAuth0Service.signInWithPassword.mockResolvedValue(mockTokens);
      mockAuth0Service.getUserByToken.mockResolvedValue(mockUser);

      const result = await service.signIn(signInDto);

      expect(mockAuth0Service.signInWithPassword).toHaveBeenCalledWith(
        signInDto.email,
        signInDto.password,
      );
      expect(mockAuth0Service.getUserByToken).toHaveBeenCalledWith(
        mockTokens.access_token,
      );
      expect(result).toEqual({
        user: {
          id: mockUser.user_id,
          email: mockUser.email,
          name: mockUser.name,
          picture: mockUser.picture,
        },
        session: {
          access_token: mockTokens.access_token,
          id_token: mockTokens.id_token,
          token_type: mockTokens.token_type,
          expires_in: mockTokens.expires_in,
        },
      });
    });

    it("should throw UnauthorizedException for invalid credentials", async () => {
      const signInDto: SignInDto = {
        email: "test@example.com",
        password: "WrongPassword",
      };

      mockAuth0Service.signInWithPassword.mockRejectedValue(
        new Error("Invalid credentials"),
      );

      await expect(service.signIn(signInDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.signIn(signInDto)).rejects.toThrow(
        "Invalid credentials",
      );
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

      mockAuth0Service.sendPasswordResetEmail.mockResolvedValue(mockResponse);

      const result = await service.resetPassword(resetPasswordDto);

      expect(mockAuth0Service.sendPasswordResetEmail).toHaveBeenCalledWith(
        resetPasswordDto.email,
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw UnauthorizedException if email sending fails", async () => {
      const resetPasswordDto: ResetPasswordDto = {
        email: "nonexistent@example.com",
      };

      mockAuth0Service.sendPasswordResetEmail.mockRejectedValue(
        new Error("User not found"),
      );

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("updatePassword", () => {
    it("should successfully update password with valid token", async () => {
      const updatePasswordDto: UpdatePasswordDto = {
        password: "NewPassword123!",
        accessToken: "valid-access-token",
      };

      const mockUser = {
        user_id: "auth0|123",
        email: "test@example.com",
      };

      mockAuth0Service.getUserByToken.mockResolvedValue(mockUser);
      mockAuth0Service.updatePassword.mockResolvedValue({
        message: "Password updated successfully",
      });

      const result = await service.updatePassword(updatePasswordDto);

      expect(mockAuth0Service.getUserByToken).toHaveBeenCalledWith(
        updatePasswordDto.accessToken,
      );
      expect(mockAuth0Service.updatePassword).toHaveBeenCalledWith(
        mockUser.user_id,
        updatePasswordDto.password,
      );
      expect(result).toEqual({
        message: "Password updated successfully",
      });
    });

    it("should throw UnauthorizedException for invalid token", async () => {
      const updatePasswordDto: UpdatePasswordDto = {
        password: "NewPassword123!",
        accessToken: "invalid-token",
      };

      mockAuth0Service.getUserByToken.mockRejectedValue(
        new Error("Invalid token"),
      );

      await expect(service.updatePassword(updatePasswordDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("changePassword", () => {
    it("should successfully change password", async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: "OldPassword123!",
        newPassword: "NewPassword123!",
      };
      const accessToken = "valid-access-token";

      const mockUser = {
        user_id: "auth0|123",
        email: "test@example.com",
        name: "Test User",
      };

      const mockTokens = {
        access_token: "new-access-token",
        id_token: "new-id-token",
      };

      mockAuth0Service.getUserByToken.mockResolvedValue(mockUser);
      mockAuth0Service.signInWithPassword.mockResolvedValue(mockTokens);
      mockAuth0Service.updatePassword.mockResolvedValue({
        message: "Password updated successfully",
      });

      const result = await service.changePassword(
        changePasswordDto,
        accessToken,
      );

      expect(mockAuth0Service.getUserByToken).toHaveBeenCalledWith(accessToken);
      expect(mockAuth0Service.signInWithPassword).toHaveBeenCalledWith(
        mockUser.email,
        changePasswordDto.currentPassword,
      );
      expect(mockAuth0Service.updatePassword).toHaveBeenCalledWith(
        mockUser.user_id,
        changePasswordDto.newPassword,
      );
      expect(result).toEqual({
        message: "Password changed successfully",
      });
    });

    it("should throw UnauthorizedException if token is invalid", async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: "OldPassword123!",
        newPassword: "NewPassword123!",
      };
      const accessToken = "invalid-token";

      mockAuth0Service.getUserByToken.mockRejectedValue(
        new Error("Invalid token"),
      );

      await expect(
        service.changePassword(changePasswordDto, accessToken),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException if current password is incorrect", async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: "WrongPassword",
        newPassword: "NewPassword123!",
      };
      const accessToken = "valid-access-token";

      const mockUser = {
        user_id: "auth0|123",
        email: "test@example.com",
      };

      mockAuth0Service.getUserByToken.mockResolvedValue(mockUser);
      mockAuth0Service.signInWithPassword.mockRejectedValue(
        new Error("Invalid credentials"),
      );

      await expect(
        service.changePassword(changePasswordDto, accessToken),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.changePassword(changePasswordDto, accessToken),
      ).rejects.toThrow("Current password is incorrect");
    });

    it("should throw UnauthorizedException if user email is missing", async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: "OldPassword123!",
        newPassword: "NewPassword123!",
      };
      const accessToken = "valid-access-token";

      const mockUser = {
        user_id: "auth0|123",
        email: undefined,
      };

      mockAuth0Service.getUserByToken.mockResolvedValue(mockUser);

      await expect(
        service.changePassword(changePasswordDto, accessToken),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.changePassword(changePasswordDto, accessToken),
      ).rejects.toThrow("Invalid token");
    });
  });

  describe("getUser", () => {
    it("should successfully get user by token", async () => {
      const accessToken = "valid-access-token";
      const mockUser = {
        user_id: "auth0|123",
        email: "test@example.com",
        name: "Test User",
        picture: "https://example.com/avatar.jpg",
        email_verified: true,
      };

      mockAuth0Service.getUserByToken.mockResolvedValue(mockUser);

      const result = await service.getUser(accessToken);

      expect(mockAuth0Service.getUserByToken).toHaveBeenCalledWith(accessToken);
      expect(result).toEqual({
        id: mockUser.user_id,
        email: mockUser.email,
        name: mockUser.name,
        picture: mockUser.picture,
        email_verified: mockUser.email_verified,
      });
    });

    it("should throw UnauthorizedException for invalid token", async () => {
      const accessToken = "invalid-token";

      mockAuth0Service.getUserByToken.mockRejectedValue(
        new Error("Invalid token"),
      );

      await expect(service.getUser(accessToken)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.getUser(accessToken)).rejects.toThrow(
        "Invalid token",
      );
    });
  });
});
