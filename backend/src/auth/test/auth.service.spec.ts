import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException, ConflictException } from "@nestjs/common";
import { AuthService } from "../auth.service";
import { SupabaseService } from "../supabase.service";
import {
  SignUpDto,
  SignInDto,
  ResetPasswordDto,
  UpdatePasswordDto,
  ChangePasswordDto,
} from "../dto/auth.dto";

describe("AuthService", () => {
  let service: AuthService;
  let supabaseService: SupabaseService;

  const mockSupabaseClient = {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      setSession: jest.fn(),
      updateUser: jest.fn(),
      getUser: jest.fn(),
    },
  };

  const mockSupabaseService = {
    getAnonClient: jest.fn().mockReturnValue(mockSupabaseClient),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    supabaseService = module.get<SupabaseService>(SupabaseService);
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
        email: "test@example.com",
        password: "Password123!",
        fullName: "Test User",
      };

      const mockUser = {
        id: "user-123",
        email: signUpDto.email,
        user_metadata: { full_name: signUpDto.fullName },
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await service.signUp(signUpDto);

      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: signUpDto.email,
        password: signUpDto.password,
        options: {
          data: {
            full_name: signUpDto.fullName,
          },
        },
      });
      expect(result).toEqual({
        user: mockUser,
        message: "Please check your email to confirm your account",
      });
    });

    it("should throw ConflictException if user already exists", async () => {
      const signUpDto: SignUpDto = {
        email: "existing@example.com",
        password: "Password123!",
        fullName: "Existing User",
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: "User already registered" },
      });

      await expect(service.signUp(signUpDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.signUp(signUpDto)).rejects.toThrow(
        "User already exists",
      );
    });

    it("should throw UnauthorizedException for other signup errors", async () => {
      const signUpDto: SignUpDto = {
        email: "invalid@example.com",
        password: "weak",
        fullName: "Test User",
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: "Password is too weak" },
      });

      await expect(service.signUp(signUpDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.signUp(signUpDto)).rejects.toThrow(
        "Password is too weak",
      );
    });
  });

  describe("signIn", () => {
    it("should successfully sign in a user", async () => {
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

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await service.signIn(signInDto);

      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: signInDto.email,
        password: signInDto.password,
      });
      expect(result).toEqual({
        user: mockUser,
        session: mockSession,
      });
    });

    it("should throw UnauthorizedException for invalid credentials", async () => {
      const signInDto: SignInDto = {
        email: "test@example.com",
        password: "WrongPassword",
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid login credentials" },
      });

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

      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await service.resetPassword(resetPasswordDto);

      expect(
        mockSupabaseClient.auth.resetPasswordForEmail,
      ).toHaveBeenCalledWith(resetPasswordDto.email, {
        redirectTo: `${process.env.FRONTEND_URL}/auth/reset-password`,
      });
      expect(result).toEqual({
        message: "Password reset email sent",
      });
    });

    it("should throw UnauthorizedException if email sending fails", async () => {
      const resetPasswordDto: ResetPasswordDto = {
        email: "nonexistent@example.com",
      };

      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: { message: "User not found" },
      });

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        "User not found",
      );
    });
  });

  describe("updatePassword", () => {
    it("should successfully update password", async () => {
      const updatePasswordDto: UpdatePasswordDto = {
        password: "NewPassword123!",
        accessToken: "valid-access-token",
      };

      mockSupabaseClient.auth.setSession.mockResolvedValue({
        data: {},
        error: null,
      });

      mockSupabaseClient.auth.updateUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const result = await service.updatePassword(updatePasswordDto);

      expect(mockSupabaseClient.auth.setSession).toHaveBeenCalledWith({
        access_token: updatePasswordDto.accessToken,
        refresh_token: "",
      });
      expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
        password: updatePasswordDto.password,
      });
      expect(result).toEqual({
        message: "Password updated successfully",
      });
    });

    it("should throw UnauthorizedException if update fails", async () => {
      const updatePasswordDto: UpdatePasswordDto = {
        password: "NewPassword123!",
        accessToken: "invalid-token",
      };

      mockSupabaseClient.auth.setSession.mockResolvedValue({
        data: {},
        error: null,
      });

      mockSupabaseClient.auth.updateUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Invalid token" },
      });

      await expect(service.updatePassword(updatePasswordDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.updatePassword(updatePasswordDto)).rejects.toThrow(
        "Invalid token",
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
        id: "user-123",
        email: "test@example.com",
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      });

      mockSupabaseClient.auth.updateUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await service.changePassword(
        changePasswordDto,
        accessToken,
      );

      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledWith(
        accessToken,
      );
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: mockUser.email,
        password: changePasswordDto.currentPassword,
      });
      expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
        password: changePasswordDto.newPassword,
      });
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

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(
        service.changePassword(changePasswordDto, accessToken),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.changePassword(changePasswordDto, accessToken),
      ).rejects.toThrow("Invalid token");
    });

    it("should throw UnauthorizedException if current password is incorrect", async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: "WrongPassword",
        newPassword: "NewPassword123!",
      };
      const accessToken = "valid-access-token";

      const mockUser = {
        id: "user-123",
        email: "test@example.com",
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid credentials" },
      });

      await expect(
        service.changePassword(changePasswordDto, accessToken),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.changePassword(changePasswordDto, accessToken),
      ).rejects.toThrow("Current password is incorrect");
    });
  });

  describe("getUser", () => {
    it("should successfully get user by token", async () => {
      const accessToken = "valid-access-token";
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        user_metadata: { full_name: "Test User" },
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await service.getUser(accessToken);

      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledWith(
        accessToken,
      );
      expect(result).toEqual(mockUser);
    });

    it("should throw UnauthorizedException if token is invalid", async () => {
      const accessToken = "invalid-token";

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Invalid token" },
      });

      await expect(service.getUser(accessToken)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.getUser(accessToken)).rejects.toThrow(
        "Invalid token",
      );
    });

    it("should throw UnauthorizedException if user is null", async () => {
      const accessToken = "expired-token";

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(service.getUser(accessToken)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.getUser(accessToken)).rejects.toThrow(
        "Invalid token",
      );
    });
  });
});
