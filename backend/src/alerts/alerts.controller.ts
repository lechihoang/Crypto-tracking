import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Headers,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { AlertsService } from "./alerts.service";
import { AuthService } from "../auth/auth.service";
import { CreateAlertDto } from "./dto/create-alert.dto";

@Controller("alerts")
export class AlertsController {
  constructor(
    private alertsService: AlertsService,
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

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async createAlert(
    @Headers("authorization") authHeader: string,
    @Body() createAlertDto: CreateAlertDto,
  ) {
    const user = await this.getUserFromToken(authHeader);
    return this.alertsService.createAlert(user.id, createAlertDto);
  }

  @Get()
  async getUserAlerts(@Headers("authorization") authHeader: string) {
    const user = await this.getUserFromToken(authHeader);
    return this.alertsService.getUserAlerts(user.id);
  }

  @Get("triggered")
  async getTriggeredAlerts(@Headers("authorization") authHeader: string) {
    const user = await this.getUserFromToken(authHeader);
    const alerts = await this.alertsService.getTriggeredAlerts(user.id);
    console.log(
      "[AlertsController] Returning triggered alerts:",
      JSON.stringify(alerts, null, 2),
    );
    return alerts;
  }

  @Delete(":id")
  async deleteAlert(
    @Headers("authorization") authHeader: string,
    @Param("id") alertId: string,
  ) {
    const user = await this.getUserFromToken(authHeader);
    await this.alertsService.deleteAlert(user.id, alertId);
    return { message: "Alert deleted successfully" };
  }

  @Patch(":id/toggle")
  async toggleAlert(
    @Headers("authorization") authHeader: string,
    @Param("id") alertId: string,
  ) {
    const user = await this.getUserFromToken(authHeader);
    await this.alertsService.toggleAlert(user.id, alertId);
    return { message: "Alert toggled successfully" };
  }
}
