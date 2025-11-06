import {
  Controller,
  Get,
  Patch,
  Body,
  Headers,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { AuthService } from "../auth/auth.service";

@Controller("user")
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    private userService: UserService,
    private authService: AuthService,
  ) {}

  private async getUserFromToken(authHeader: string) {
    if (!authHeader) {
      throw new UnauthorizedException("Authorization header required");
    }

    const token = authHeader.replace("Bearer ", "");
    const user = await this.authService.getUser(token);
    return user;
  }

  // ============ User Endpoints ============

  @Get()
  async getUser(@Headers("authorization") authHeader: string) {
    const authUser = await this.getUserFromToken(authHeader);
    this.logger.log(`Getting user preferences for: ${authUser.id}`);
    const user = await this.userService.getUser(authUser.id);
    this.logger.log(
      `User preferences loaded: emailNotifications=${user.emailNotifications}`,
    );
    return user;
  }

  @Patch("display-name")
  async updateDisplayName(
    @Headers("authorization") authHeader: string,
    @Body() body: { displayName: string },
  ) {
    const authUser = await this.getUserFromToken(authHeader);
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
  async updateEmailNotifications(
    @Headers("authorization") authHeader: string,
    @Body() body: { enabled: boolean },
  ) {
    const authUser = await this.getUserFromToken(authHeader);
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
