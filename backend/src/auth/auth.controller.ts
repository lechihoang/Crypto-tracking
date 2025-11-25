import {
  Controller,
  Post,
  Body,
  Get,
  Headers,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
  Query,
  Res,
  Inject,
  forwardRef,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";
import { AuthService } from "./auth.service";
import { Auth0Service } from "./auth0.service";
import { UserService } from "../user/user.service";
import { AuthToken } from "./decorators/auth-token.decorator";
import {
  SignUpDto,
  SignInDto,
  ResetPasswordDto,
  UpdatePasswordDto,
  ChangePasswordDto,
} from "./dto/auth.dto";

@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private auth0Service: Auth0Service,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
  ) {}

  @Post("signup")
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Post("signin")
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signIn(signInDto);

    this.setAuthCookies(
      res,
      result.session.access_token,
      result.session.id_token,
    );

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        picture: result.user.picture,
      },
    };
  }

  @Post("reset-password")
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post("update-password")
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async updatePassword(@Body() updatePasswordDto: UpdatePasswordDto) {
    return this.authService.updatePassword(updatePasswordDto);
  }

  @Post("change-password")
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Headers("authorization") authHeader: string,
  ) {
    if (!authHeader) {
      throw new UnauthorizedException("Authorization header required");
    }

    const token = authHeader.replace("Bearer ", "");
    return this.authService.changePassword(changePasswordDto, token);
  }

  @Get("me")
  async getProfile(@AuthToken() token: string) {
    return this.authService.getUser(token);
  }

  @Post("logout")
  async logout(@Res({ passthrough: true }) res: Response) {
    // Clear cookies
    this.clearAuthCookies(res);
    return { message: "Logged out successfully" };
  }

  // Helper method to set auth cookies
  private setAuthCookies(res: Response, accessToken: string, idToken?: string) {
    // Set access token cookie
    res.cookie("auth_token", accessToken, {
      httpOnly: true,
      secure: true, // Always use HTTPS
      sameSite: "none", // Allow cross-domain
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/",
    });

    // Set ID token cookie if provided
    if (idToken) {
      res.cookie("id_token", idToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 24 * 60 * 60 * 1000,
        path: "/",
      });
    }
  }

  // Helper method to clear auth cookies
  private clearAuthCookies(res: Response) {
    // Must match the same options used when setting cookies
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "none" as const,
      path: "/",
    };
    
    res.clearCookie("auth_token", cookieOptions);
    res.clearCookie("id_token", cookieOptions);
  }

  // Social Login Endpoints
  @Get("google")
  async googleLogin(@Res() res: Response) {
    const authUrl = this.auth0Service.getAuthorizationUrl("google-oauth2");
    return res.redirect(authUrl);
  }

  @Get("callback")
  async authCallback(
    @Query("code") code: string,
    @Query("error") error: string,
    @Res() res: Response,
  ) {
    if (error) {
      // Redirect to frontend with error
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      return res.redirect(
        `${frontendUrl}/auth/callback?error=${encodeURIComponent(error)}`,
      );
    }

    if (!code) {
      throw new UnauthorizedException("Authorization code missing");
    }

    try {
      // Exchange code for tokens
      const tokens = await this.auth0Service.exchangeCodeForTokens(code);

      // Get user info
      const user = await this.auth0Service.getUserByToken(tokens.access_token);

      // Save/update user email in database for future use (e.g., price alerts)
      if (user.user_id && user.email) {
        await this.userService.upsertUser(user.user_id, user.email, user.name);
      }

      // Set HttpOnly cookies for tokens
      this.setAuthCookies(res, tokens.access_token, tokens.id_token);

      // Redirect to frontend with user info only (tokens are in cookies)
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const params = new URLSearchParams({
        user_id: user.user_id,
        email: user.email,
        name: user.name || "",
        picture: user.picture || "",
        success: "true",
      });

      return res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
    } catch (err: any) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      return res.redirect(
        `${frontendUrl}/auth/callback?error=${encodeURIComponent(err.message || "Authentication failed")}`,
      );
    }
  }
}
