import {
  Controller,
  Get,
  Patch,
  Body,
  Logger,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { AuthService } from "../auth/auth.service";
import { AuthToken } from "../auth/decorators/auth-token.decorator";

@Controller("user")
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    private userService: UserService,
    private authService: AuthService,
  ) {}

  private async getUserFromToken(token: string) {
    if (!token) {
      throw new UnauthorizedException("Authentication token is required");
    }
    const user = await this.authService.getUser(token);
    if (!user) {
      throw new UnauthorizedException("Invalid or expired token");
    }
    return user;
  }


  @Get()
  async getUser(@AuthToken() token: string) {
    const authUser = await this.getUserFromToken(token);
    this.logger.log(`Getting user preferences for: ${authUser.id}`);
    const user = await this.userService.getUser(authUser.id);
    this.logger.log(
      `User preferences loaded: emailNotifications=${user.emailNotifications}`,
    );
    return user;
  }

  @Patch("display-name")
  @HttpCode(HttpStatus.OK)
  async updateDisplayName(
    @AuthToken() token: string,
    @Body() body: { displayName: string },
  ) {
    const authUser = await this.getUserFromToken(token);
    const user = await this.userService.updateDisplayName(
      authUser.id,
      body.displayName,
    );
    return {
      message: "Display name updated",
      user,
    };
  }

  @Patch("email-notifications")
  @HttpCode(HttpStatus.OK)
  async updateEmailNotifications(
    @AuthToken() token: string,
    @Body() body: { enabled: boolean },
  ) {
    const authUser = await this.getUserFromToken(token);
    this.logger.log(
      `Updating email notifications for ${authUser.id}: ${body.enabled}`,
    );
    const user = await this.userService.updateEmailNotifications(
      authUser.id,
      body.enabled,
    );
    this.logger.log(
      `Email notifications updated successfully: ${user.emailNotifications}`,
    );
    return {
      message: "Email notification preference updated",
      user,
    };
  }
}
