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
  private audience: string;
  private userCache: NodeCache;

  constructor(private configService: ConfigService) {
    this.domain = this.configService.get<string>("AUTH0_DOMAIN") || "";
    this.clientId = this.configService.get<string>("AUTH0_CLIENT_ID") || "";
    this.clientSecret =
      this.configService.get<string>("AUTH0_CLIENT_SECRET") || "";
    this.audience =
      this.configService.get<string>("AUTH0_AUDIENCE") ||
      `https://${this.domain}/api/v2/`;

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
      console.log("Attempting sign in:", {
        email,
        passwordLength: password?.length,
        realm: "Username-Password-Authentication"
      });

      const response = await this.authentication.oauth.passwordGrant({
        username: email,
        password,
        realm: "Username-Password-Authentication",
        scope: "openid profile email",
        // Don't include audience for password grant
        // audience: this.audience,
      });

      console.log("Sign in successful, response:", {
        hasAccessToken: !!response.data.access_token,
        hasIdToken: !!response.data.id_token,
        tokenType: response.data.token_type,
        expiresIn: response.data.expires_in,
        accessTokenPreview: response.data.access_token?.substring(0, 50) + '...',
      });

      return response.data as Auth0TokenResponse;
    } catch (error: any) {
      // Log detailed error for debugging
      console.error("Auth0 sign in error:", {
        email,
        passwordLength: password?.length,
        message: error.message,
        response: error.response?.data,
        statusCode: error.response?.status,
        error: error,
      });

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
      console.log("Signing up user:", { email, passwordLength: password?.length });

      const userName = fullName || email.split("@")[0];

      const response = await this.authentication.database.signUp({
        email,
        password,
        connection: "Username-Password-Authentication",
        user_metadata: {
          full_name: userName,
        },
        // Set name directly in the user profile
        name: userName,
      });

      console.log("Sign up response:", response.data);

      // If we have user_id, update the user profile to ensure name is set
      if ((response.data as any)._id || (response.data as any).user_id) {
        const userId = (response.data as any)._id || (response.data as any).user_id;
        try {
          await this.management.users.update(userId, {
            name: userName,
          });
          console.log("Updated user name in profile:", userName);
        } catch (updateError: any) {
          // Log but don't fail signup if update fails
          console.warn("Failed to update user name:", updateError.message);
        }
      }

      return response.data;
    } catch (error: any) {
      console.error("Sign up error:", error);
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
      // Create a cache key from the token (use first 50 chars as identifier)
      const cacheKey = `user_${accessToken.substring(0, 50)}`;

      // Check cache first
      const cachedUser = this.userCache.get<Auth0User>(cacheKey);
      if (cachedUser) {
        console.log("✓ User info retrieved from cache (avoiding Auth0 API call)");
        return cachedUser;
      }

      console.log("Cache miss - getting user info from Auth0 userInfo endpoint...");

      // Use Auth0's userInfo endpoint to get user details
      // This works with both opaque tokens (encrypted) and JWTs
      const response = await axios.get(`https://${this.domain}/userinfo`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log("UserInfo response:", {
        hasSub: !!response.data.sub,
        hasEmail: !!response.data.email,
        hasName: !!response.data.name,
        sub: response.data.sub,
      });

      let userName = response.data.name;

      // If name is not set, try to get from Management API
      if (!userName) {
        console.log("Name not found in userInfo, fetching from Management API...");
        try {
          const fullUser = await this.management.users.get(response.data.sub);
          userName = fullUser.data.name ||
                     fullUser.data.user_metadata?.full_name ||
                     fullUser.data.user_metadata?.name ||
                     fullUser.data.nickname ||
                     fullUser.data.email?.split("@")[0];

          console.log("Got name from Management API:", userName);

          // Update user profile if we found a name in user_metadata but not in main profile
          if (userName && userName !== fullUser.data.name) {
            try {
              await this.management.users.update(response.data.sub, {
                name: userName,
              });
              console.log("Updated user name in profile");
            } catch (updateError) {
              console.warn("Failed to update user name:", updateError);
            }
          }
        } catch (mgmtError) {
          console.warn("Failed to get user from Management API:", mgmtError);
          // Fallback to email username
          userName = response.data.email?.split("@")[0] || response.data.nickname;
        }
      }

      // Map Auth0 userInfo response to Auth0User format
      const user: Auth0User = {
        user_id: response.data.sub,
        email: response.data.email,
        email_verified: response.data.email_verified || false,
        name: userName,
        picture: response.data.picture,
        nickname: response.data.nickname,
      };

      // Store in cache for future requests
      this.userCache.set(cacheKey, user);
      console.log("✓ User info cached for 5 minutes");

      return user;
    } catch (error: any) {
      console.error("getUserByToken error:", {
        message: error.message,
        response: error.response?.data,
        statusCode: error.response?.status,
      });

      // Provide better error messages for rate limiting
      if (error.response?.status === 429) {
        throw new UnauthorizedException(
          "Too many requests to authentication service. Please try again in a few moments."
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
    } catch (error: any) {
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
    } catch (error: any) {
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
      throw new UnauthorizedException(
        error.message || "Failed to delete user",
      );
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
    const deleted = this.userCache.del(cacheKey);
    if (deleted) {
      console.log("✓ User cache cleared for token on logout");
    }
  }

  /**
   * Clear all cached user info (useful for debugging or full cache reset)
   */
  clearAllCache(): void {
    this.userCache.flushAll();
    console.log("✓ All user cache cleared");
  }
}
