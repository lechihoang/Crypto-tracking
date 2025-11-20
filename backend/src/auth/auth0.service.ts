import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ManagementClient, AuthenticationClient } from "auth0";
import * as jwt from "jsonwebtoken";
import axios from "axios";
import NodeCache = require("node-cache");

export interface Auth0User {
  user_id: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  nickname?: string;
  identities?: Array<{
    provider: string;
    user_id: string;
    connection: string;
  }>;
}

export interface Auth0TokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
}

@Injectable()
export class Auth0Service {
  private management: ManagementClient;
  private authentication: AuthenticationClient;
  private domain: string;
  private clientId: string;
  private clientSecret: string;
  private userCache: NodeCache;

  constructor(private configService: ConfigService) {
    this.domain = this.configService.get<string>("AUTH0_DOMAIN") || "";
    this.clientId = this.configService.get<string>("AUTH0_CLIENT_ID") || "";
    this.clientSecret =
      this.configService.get<string>("AUTH0_CLIENT_SECRET") || "";

    // Management API client for user operations
    this.management = new ManagementClient({
      domain: this.domain,
      clientId: this.clientId,
      clientSecret: this.clientSecret,
    });

    // Authentication API client for login operations
    this.authentication = new AuthenticationClient({
      domain: this.domain,
      clientId: this.clientId,
      clientSecret: this.clientSecret,
    });

    // Initialize user cache with 5 minute TTL to prevent Auth0 rate limiting
    // This dramatically reduces API calls to Auth0's userInfo endpoint
    this.userCache = new NodeCache({
      stdTTL: 300, // 5 minutes (300 seconds)
      checkperiod: 60, // Check for expired keys every 60 seconds
      useClones: false, // Better performance - we don't modify cached objects
    });
  }

  /**
   * Sign in with email and password (Embedded Login)
   */
  async signInWithPassword(
    email: string,
    password: string,
  ): Promise<Auth0TokenResponse> {
    try {
      const response = await this.authentication.oauth.passwordGrant({
        username: email,
        password,
        realm: "Username-Password-Authentication",
        scope: "openid profile email",
      });

      return response.data as Auth0TokenResponse;
    } catch (error: any) {
      throw new UnauthorizedException(
        error.response?.data?.error_description ||
          error.message ||
          "Invalid email or password",
      );
    }
  }

  /**
   * Sign up new user
   */
  async signUp(email: string, password: string, fullName?: string) {
    try {
      const userName = fullName || email.split("@")[0];

      const response = await this.authentication.database.signUp({
        email,
        password,
        connection: "Username-Password-Authentication",
        user_metadata: {
          full_name: userName,
        },
        name: userName,
      });

      if ((response.data as any)._id || (response.data as any).user_id) {
        const userId =
          (response.data as any)._id || (response.data as any).user_id;
        try {
          await this.management.users.update(userId, {
            name: userName,
          });
        } catch (updateError: any) {
          // Ignore update errors during signup
        }
      }

      return response.data;
    } catch (error: any) {
      if (
        error.message?.includes("user already exists") ||
        error.message?.includes("The user already exists")
      ) {
        throw new UnauthorizedException("User already exists");
      }
      throw new UnauthorizedException(error.message || "Failed to sign up");
    }
  }

  /**
   * Get user by access token (using userInfo endpoint)
   * Uses caching to prevent Auth0 rate limiting
   */
  async getUserByToken(accessToken: string): Promise<Auth0User> {
    try {
      const cacheKey = `user_${accessToken.substring(0, 50)}`;

      const cachedUser = this.userCache.get<Auth0User>(cacheKey);
      if (cachedUser) {
        return cachedUser;
      }

      const response = await axios.get(`https://${this.domain}/userinfo`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      let userName = response.data.name;

      if (!userName) {
        try {
          const fullUser = await this.management.users.get(response.data.sub);
          userName =
            fullUser.data.name ||
            fullUser.data.user_metadata?.full_name ||
            fullUser.data.user_metadata?.name ||
            fullUser.data.nickname ||
            fullUser.data.email?.split("@")[0];

          if (userName && userName !== fullUser.data.name) {
            try {
              await this.management.users.update(response.data.sub, {
                name: userName,
              });
            } catch (updateError) {
              // Ignore update errors
            }
          }
        } catch (mgmtError) {
          userName =
            response.data.email?.split("@")[0] || response.data.nickname;
        }
      }

      const user: Auth0User = {
        user_id: response.data.sub,
        email: response.data.email,
        email_verified: response.data.email_verified || false,
        name: userName,
        picture: response.data.picture,
        nickname: response.data.nickname,
      };

      this.userCache.set(cacheKey, user);

      return user;
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new UnauthorizedException(
          "Too many requests to authentication service. Please try again in a few moments.",
        );
      }

      throw new UnauthorizedException("Invalid token");
    }
  }

  /**
   * Get user by ID (using Management API)
   */
  async getUserById(userId: string): Promise<Auth0User> {
    try {
      const response = await this.management.users.get(userId);
      return response.data as Auth0User;
    } catch {
      throw new UnauthorizedException("User not found");
    }
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, newPassword: string) {
    try {
      await this.management.users.update(userId, { password: newPassword });
      return { message: "Password updated successfully" };
    } catch (error: any) {
      throw new UnauthorizedException(
        error.message || "Failed to update password",
      );
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string) {
    try {
      await this.authentication.database.changePassword({
        email,
        connection: "Username-Password-Authentication",
        client_id: this.clientId,
      });
      return { message: "Password reset email sent" };
    } catch (error: any) {
      throw new UnauthorizedException(
        error.message || "Failed to send reset email",
      );
    }
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<any> {
    try {
      // Get JWKS from Auth0
      const jwksClient = require("jwks-rsa");
      const client = jwksClient({
        jwksUri: `https://${this.domain}/.well-known/jwks.json`,
      });

      const decoded = jwt.decode(token, { complete: true });
      if (!decoded || typeof decoded === "string") {
        throw new Error("Invalid token");
      }

      const key = await client.getSigningKey(decoded.header.kid);
      const signingKey = key.getPublicKey();

      const verified = jwt.verify(token, signingKey, {
        audience: this.clientId,
        issuer: `https://${this.domain}/`,
        algorithms: ["RS256"],
      });

      return verified;
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  /**
   * Get authorization URL for social login
   */
  getAuthorizationUrl(connection: "google-oauth2"): string {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.clientId,
      redirect_uri:
        this.configService.get<string>("AUTH0_CALLBACK_URL") ||
        "http://localhost:3001/api/auth/callback",
      scope: "openid profile email",
      connection,
    });

    return `https://${this.domain}/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens (OAuth callback)
   */
  async exchangeCodeForTokens(code: string): Promise<Auth0TokenResponse> {
    try {
      const response = await this.authentication.oauth.authorizationCodeGrant({
        code,
        redirect_uri:
          this.configService.get<string>("AUTH0_CALLBACK_URL") ||
          "http://localhost:3001/api/auth/callback",
      });

      return response.data as Auth0TokenResponse;
    } catch (error: any) {
      throw new UnauthorizedException(
        error.message || "Failed to exchange code for tokens",
      );
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string) {
    try {
      await this.management.users.delete(userId);
      return { message: "User deleted successfully" };
    } catch (error: any) {
      throw new UnauthorizedException(error.message || "Failed to delete user");
    }
  }

  /**
   * Get Management Client (for advanced operations)
   */
  getManagementClient(): ManagementClient {
    return this.management;
  }

  /**
   * Get Authentication Client (for advanced operations)
   */
  getAuthenticationClient(): AuthenticationClient {
    return this.authentication;
  }

  /**
   * Clear cached user info for a specific access token (called during logout)
   */
  clearUserCache(accessToken: string): void {
    const cacheKey = `user_${accessToken.substring(0, 50)}`;
    this.userCache.del(cacheKey);
  }

  /**
   * Clear all cached user info
   */
  clearAllCache(): void {
    this.userCache.flushAll();
  }
}
