import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { Auth0Service } from "./auth0.service";
import { UserService } from "../user/user.service";
import {
  SignUpDto,
  SignInDto,
  ResetPasswordDto,
  UpdatePasswordDto,
  ChangePasswordDto,
} from "./dto/auth.dto";

@Injectable()
export class AuthService {
  constructor(
    private auth0Service: Auth0Service,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    const { email, password, fullName } = signUpDto;

    try {
      const user = await this.auth0Service.signUp(email, password, fullName);
      const userId = (user as any)._id || (user as any).user_id;

      // Save user email to database for future use (e.g., price alerts)
      if (userId && email) {
        await this.userService.upsertUser(userId, email, fullName);
      }

      return {
        user: {
          id: userId,
          email: (user as any).email,
          user_metadata: { full_name: fullName },
        },
        message: "Please check your email to confirm your account",
      };
    } catch (error: any) {
      if (error.message?.includes("already exists")) {
        throw new ConflictException("User already exists");
      }
      throw new UnauthorizedException(error.message || "Failed to sign up");
    }
  }

  async signIn(signInDto: SignInDto) {
    const { email, password } = signInDto;

    try {
      console.log("Step 1: Signing in with password...");
      const tokens = await this.auth0Service.signInWithPassword(
        email,
        password,
      );
      console.log("Step 1 successful, tokens received");

      // Get user info from access token
      console.log("Step 2: Getting user by token...");
      const user = await this.auth0Service.getUserByToken(
        tokens.access_token,
      );
      console.log("Step 2 successful, user:", {
        id: user.user_id,
        email: user.email,
      });

      // Save/update user email in database for future use (e.g., price alerts)
      if (user.user_id && user.email) {
        await this.userService.upsertUser(user.user_id, user.email, user.name);
      }

      const result = {
        user: {
          id: user.user_id,
          email: user.email,
          name: user.name,
          picture: user.picture,
        },
        session: {
          access_token: tokens.access_token,
          id_token: tokens.id_token,
          token_type: tokens.token_type,
          expires_in: tokens.expires_in,
        },
      };

      console.log("Returning result with user and session");
      return result;
    } catch (error: any) {
      console.error("SignIn error:", error.message || error);
      throw new UnauthorizedException("Invalid credentials");
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email } = resetPasswordDto;

    try {
      return await this.auth0Service.sendPasswordResetEmail(email);
    } catch (error: any) {
      throw new UnauthorizedException(
        error.message || "Failed to send password reset email",
      );
    }
  }

  async updatePassword(updatePasswordDto: UpdatePasswordDto) {
    const { password, accessToken } = updatePasswordDto;

    try {
      // Verify token and get user
      const user = await this.auth0Service.getUserByToken(accessToken);

      // Update password
      await this.auth0Service.updatePassword(user.user_id, password);

      return {
        message: "Password updated successfully",
      };
    } catch (error: any) {
      throw new UnauthorizedException(
        error.message || "Invalid or expired reset link",
      );
    }
  }

  async changePassword(
    changePasswordDto: ChangePasswordDto,
    accessToken: string,
  ) {
    const { currentPassword, newPassword } = changePasswordDto;

    try {
      // Get user from token
      const user = await this.auth0Service.getUserByToken(accessToken);

      if (!user?.email) {
        throw new UnauthorizedException("Invalid token");
      }

      // Verify current password by attempting to sign in
      try {
        await this.auth0Service.signInWithPassword(
          user.email,
          currentPassword,
        );
      } catch {
        throw new UnauthorizedException("Current password is incorrect");
      }

      // Update to new password
      await this.auth0Service.updatePassword(user.user_id, newPassword);

      return {
        message: "Password changed successfully",
      };
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(
        error.message || "Failed to change password",
      );
    }
  }

  async getUser(accessToken: string) {
    try {
      const user = await this.auth0Service.getUserByToken(accessToken);

      return {
        id: user.user_id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        email_verified: user.email_verified,
      };
    } catch (error: any) {
      throw new UnauthorizedException("Invalid token");
    }
  }

  async logout(accessToken: string) {
    try {
      // Clear the cached user info for this token
      this.auth0Service.clearUserCache(accessToken);

      return {
        message: "Logged out successfully",
      };
    } catch (error: any) {
      // Even if there's an error, we still want to indicate success
      // because logout should always succeed from the client's perspective
      return {
        message: "Logged out successfully",
      };
    }
  }

  getAuth0Management() {
    return this.auth0Service.getManagementClient();
  }

  getAuth0Authentication() {
    return this.auth0Service.getAuthenticationClient();
  }
}
