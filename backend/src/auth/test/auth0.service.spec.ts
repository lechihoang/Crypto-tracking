import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { UnauthorizedException } from "@nestjs/common";
import { Auth0Service } from "../auth0.service";
import axios from "axios";

jest.mock("axios");

describe("Auth0Service", () => {
  let service: Auth0Service;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        AUTH0_DOMAIN: "dev-test.auth0.com",
        AUTH0_CLIENT_ID: "test-client-id",
        AUTH0_CLIENT_SECRET: "test-client-secret",
        AUTH0_AUDIENCE: "https://dev-test.auth0.com/api/v2/",
        AUTH0_CALLBACK_URL: "http://localhost:3001/api/auth/callback",
      };
      return config[key];
    }),
  };

  const mockManagementClient = {
    users: {
      get: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockAuthenticationClient = {
    oauth: {
      passwordGrant: jest.fn(),
      authorizationCodeGrant: jest.fn(),
    },
    database: {
      signUp: jest.fn(),
      changePassword: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Auth0Service,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<Auth0Service>(Auth0Service);

    // Mock the Auth0 clients
    (service as any).management = mockManagementClient;
    (service as any).authentication = mockAuthenticationClient;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("signInWithPassword", () => {
    it("should successfully sign in with email and password", async () => {
      const email = "test@example.com";
      const password = "Password123!";
      const mockResponse = {
        data: {
          access_token: "access-token-123",
          id_token: "id-token-123",
          token_type: "Bearer",
          expires_in: 86400,
        },
      };

      mockAuthenticationClient.oauth.passwordGrant.mockResolvedValue(
        mockResponse,
      );

      const result = await service.signInWithPassword(email, password);

      expect(
        mockAuthenticationClient.oauth.passwordGrant,
      ).toHaveBeenCalledWith({
        username: email,
        password,
        realm: "Username-Password-Authentication",
        scope: "openid profile email",
        // audience is not included for password grant
      });
      expect(result).toEqual(mockResponse.data);
    });

    it("should throw UnauthorizedException on invalid credentials", async () => {
      const email = "test@example.com";
      const password = "WrongPassword";

      mockAuthenticationClient.oauth.passwordGrant.mockRejectedValue(
        new Error("Invalid credentials"),
      );

      await expect(service.signInWithPassword(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("signUp", () => {
    it("should successfully sign up a new user", async () => {
      const email = "newuser@example.com";
      const password = "Password123!";
      const fullName = "New User";
      const mockResponse = {
        data: {
          _id: "auth0|123",
          email,
          email_verified: false,
        },
      };

      mockAuthenticationClient.database.signUp.mockResolvedValue(mockResponse);

      const result = await service.signUp(email, password, fullName);

      expect(mockAuthenticationClient.database.signUp).toHaveBeenCalledWith({
        email,
        password,
        connection: "Username-Password-Authentication",
        user_metadata: {
          full_name: fullName,
        },
        name: fullName,
      });
      expect(result).toEqual(mockResponse.data);
    });

    it("should use email as name if fullName not provided", async () => {
      const email = "user@example.com";
      const password = "Password123!";
      const mockResponse = {
        data: {
          _id: "auth0|456",
          email,
        },
      };

      mockAuthenticationClient.database.signUp.mockResolvedValue(mockResponse);

      await service.signUp(email, password);

      expect(mockAuthenticationClient.database.signUp).toHaveBeenCalledWith({
        email,
        password,
        connection: "Username-Password-Authentication",
        user_metadata: {
          full_name: "user",
        },
        name: "user",
      });
    });

    it("should throw UnauthorizedException if user already exists", async () => {
      const email = "existing@example.com";
      const password = "Password123!";

      mockAuthenticationClient.database.signUp.mockRejectedValue(
        new Error("The user already exists"),
      );

      await expect(service.signUp(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.signUp(email, password)).rejects.toThrow(
        "User already exists",
      );
    });
  });

  describe("getUserByToken", () => {
    it("should get user by access token", async () => {
      const accessToken = "valid-access-token";
      const mockUser = {
        sub: "auth0|123",
        email: "test@example.com",
        name: "Test User",
        picture: "https://example.com/avatar.jpg",
        email_verified: true,
      };

      // Mock axios.get to return user info from userInfo endpoint
      (axios.get as jest.Mock).mockResolvedValue({
        data: mockUser,
      });

      const result = await service.getUserByToken(accessToken);

      expect(axios.get).toHaveBeenCalledWith(
        "https://dev-test.auth0.com/userinfo",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      expect(result).toEqual({
        user_id: mockUser.sub,
        email: mockUser.email,
        email_verified: mockUser.email_verified,
        name: mockUser.name,
        picture: mockUser.picture,
      });
    });

    it("should throw UnauthorizedException for invalid token", async () => {
      const accessToken = "invalid-token";

      // Mock axios.get to throw 401 error
      (axios.get as jest.Mock).mockRejectedValue({
        response: {
          status: 401,
          data: "Unauthorized",
        },
        message: "Request failed with status code 401",
      });

      await expect(service.getUserByToken(accessToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("updatePassword", () => {
    it("should successfully update user password", async () => {
      const userId = "auth0|123";
      const newPassword = "NewPassword123!";

      mockManagementClient.users.update.mockResolvedValue({
        data: { user_id: userId },
      });

      const result = await service.updatePassword(userId, newPassword);

      expect(mockManagementClient.users.update).toHaveBeenCalledWith(userId, {
        password: newPassword,
      });
      expect(result).toEqual({ message: "Password updated successfully" });
    });

    it("should throw UnauthorizedException on update failure", async () => {
      const userId = "auth0|123";
      const newPassword = "NewPassword123!";

      mockManagementClient.users.update.mockRejectedValue(
        new Error("Update failed"),
      );

      await expect(service.updatePassword(userId, newPassword)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("sendPasswordResetEmail", () => {
    it("should successfully send password reset email", async () => {
      const email = "test@example.com";

      mockAuthenticationClient.database.changePassword.mockResolvedValue({});

      const result = await service.sendPasswordResetEmail(email);

      expect(
        mockAuthenticationClient.database.changePassword,
      ).toHaveBeenCalledWith({
        email,
        connection: "Username-Password-Authentication",
        client_id: "test-client-id",
      });
      expect(result).toEqual({ message: "Password reset email sent" });
    });

    it("should throw UnauthorizedException on failure", async () => {
      const email = "nonexistent@example.com";

      mockAuthenticationClient.database.changePassword.mockRejectedValue(
        new Error("User not found"),
      );

      await expect(service.sendPasswordResetEmail(email)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("getAuthorizationUrl", () => {
    it("should generate correct Google OAuth URL", () => {
      const url = service.getAuthorizationUrl("google-oauth2");

      expect(url).toContain("https://dev-test.auth0.com/authorize");
      expect(url).toContain("response_type=code");
      expect(url).toContain("client_id=test-client-id");
      expect(url).toContain("connection=google-oauth2");
      expect(url).toContain("scope=openid+profile+email");
    });
  });

  describe("exchangeCodeForTokens", () => {
    it("should exchange authorization code for tokens", async () => {
      const code = "auth-code-123";
      const mockResponse = {
        data: {
          access_token: "access-token-123",
          id_token: "id-token-123",
          token_type: "Bearer",
          expires_in: 86400,
        },
      };

      mockAuthenticationClient.oauth.authorizationCodeGrant.mockResolvedValue(
        mockResponse,
      );

      const result = await service.exchangeCodeForTokens(code);

      expect(
        mockAuthenticationClient.oauth.authorizationCodeGrant,
      ).toHaveBeenCalledWith({
        code,
        redirect_uri: "http://localhost:3001/api/auth/callback",
      });
      expect(result).toEqual(mockResponse.data);
    });

    it("should throw UnauthorizedException on invalid code", async () => {
      const code = "invalid-code";

      mockAuthenticationClient.oauth.authorizationCodeGrant.mockRejectedValue(
        new Error("Invalid code"),
      );

      await expect(service.exchangeCodeForTokens(code)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("deleteUser", () => {
    it("should successfully delete a user", async () => {
      const userId = "auth0|123";

      mockManagementClient.users.delete.mockResolvedValue({});

      const result = await service.deleteUser(userId);

      expect(mockManagementClient.users.delete).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ message: "User deleted successfully" });
    });

    it("should throw UnauthorizedException on delete failure", async () => {
      const userId = "auth0|123";

      mockManagementClient.users.delete.mockRejectedValue(
        new Error("Delete failed"),
      );

      await expect(service.deleteUser(userId)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("Client getters", () => {
    it("should return Management Client", () => {
      const client = service.getManagementClient();
      expect(client).toBe(mockManagementClient);
    });

    it("should return Authentication Client", () => {
      const client = service.getAuthenticationClient();
      expect(client).toBe(mockAuthenticationClient);
    });
  });
});
