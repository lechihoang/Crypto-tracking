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
} from "@nestjs/common";
import { Response } from "express";
import { AuthService } from "./auth.service";
import { Auth0Service } from "./auth0.service";
import { UserService } from "../user/user.service";
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
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Post("signin")
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async signIn(@Body() signInDto: SignInDto) {
    const result = await this.authService.signIn(signInDto);
    console.log("SignIn result:", {
      hasUser: !!result.user,
      hasSession: !!result.session,
      hasAccessToken: !!result.session?.access_token,
      accessTokenLength: result.session?.access_token?.length,
    });

    const response = {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        picture: result.user.picture,
      },
      access_token: result.session.access_token,
      id_token: result.session.id_token,
      expires_in: result.session.expires_in,
    };

    console.log("Sending response:", {
      hasAccessToken: !!response.access_token,
      accessTokenLength: response.access_token?.length,
    });

    return response;
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
  async getProfile(@Headers("authorization") authHeader: string) {
    if (!authHeader) {
      throw new UnauthorizedException("Authorization header required");
    }

    const token = authHeader.replace("Bearer ", "");
    return this.authService.getUser(token);
  }

  @Post("logout")
  async logout(@Headers("authorization") authHeader: string) {
    if (!authHeader) {
      // Even without token, return success for logout
      return { message: "Logged out successfully" };
    }

    const token = authHeader.replace("Bearer ", "");
    return this.authService.logout(token);
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

      // Redirect to frontend with tokens
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const params = new URLSearchParams({
        access_token: tokens.access_token,
        id_token: tokens.id_token,
        user_id: user.user_id,
        email: user.email,
        name: user.name || "",
        picture: user.picture || "",
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
