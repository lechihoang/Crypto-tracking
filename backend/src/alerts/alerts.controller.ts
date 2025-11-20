import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UsePipes,
  ValidationPipe,
  Logger,
  UnauthorizedException,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AlertsService } from "./alerts.service";
import { AuthService } from "../auth/auth.service";
import { AuthToken } from "../auth/decorators/auth-token.decorator";
import { CreateAlertDto } from "./dto/create-alert.dto";
import { UpdateAlertDto } from "./dto/update-alert.dto";

@Controller("alerts")
export class AlertsController {
  private readonly logger = new Logger(AlertsController.name);

  constructor(
    private alertsService: AlertsService,
    private authService: AuthService,
  ) {}

  private async getUserFromToken(token: string) {
    if (!token) {
      this.logger.error("No authentication token provided");
      throw new UnauthorizedException("Authentication token is required");
    }

    try {
      const user = await this.authService.getUser(token);
      if (!user) {
        this.logger.error("User not found from token");
        throw new UnauthorizedException("User not found or invalid token");
      }
      return user;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to get user from token: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async createAlert(
    @AuthToken() token: string,
    @Body() createAlertDto: CreateAlertDto,
  ) {
    try {
      const user = await this.getUserFromToken(token);
      return await this.alertsService.createAlert(user.id, createAlertDto);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to create alert: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @Get()
  async getUserAlerts(@AuthToken() token: string) {
    try {
      const user = await this.getUserFromToken(token);
      return await this.alertsService.getUserAlerts(user.id);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to get user alerts: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @Get("triggered")
  async getTriggeredAlerts(@AuthToken() token: string) {
    try {
      const user = await this.getUserFromToken(token);
      const alerts = await this.alertsService.getTriggeredAlerts(user.id);
      return alerts;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to get triggered alerts: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAlert(@AuthToken() token: string, @Param("id") alertId: string) {
    try {
      if (!alertId) {
        this.logger.error("Alert ID is required for deletion");
        throw new BadRequestException("Alert ID is required");
      }
      const user = await this.getUserFromToken(token);
      await this.alertsService.deleteAlert(user.id, alertId);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to delete alert ${alertId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @Patch(":id/toggle")
  async toggleAlert(@AuthToken() token: string, @Param("id") alertId: string) {
    try {
      if (!alertId) {
        this.logger.error("Alert ID is required for toggle");
        throw new BadRequestException("Alert ID is required");
      }
      const user = await this.getUserFromToken(token);
      await this.alertsService.toggleAlert(user.id, alertId);
      return { message: "Alert toggled successfully" };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to toggle alert ${alertId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @Patch(":id")
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async updateAlert(
    @AuthToken() token: string,
    @Param("id") alertId: string,
    @Body() updateAlertDto: UpdateAlertDto,
  ) {
    try {
      if (!alertId) {
        this.logger.error("Alert ID is required for update");
        throw new BadRequestException("Alert ID is required");
      }
      const user = await this.getUserFromToken(token);
      return await this.alertsService.updateAlert(user.id, alertId, updateAlertDto);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to update alert ${alertId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
