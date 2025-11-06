import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AlertsController } from "./alerts.controller";
import { AlertsService } from "./alerts.service";
import { EmailService } from "./email.service";
import { AlertsSchedulerService } from "./alerts-scheduler.service";
import { PriceAlert, PriceAlertSchema } from "../schemas";
import { AuthModule } from "../auth/auth.module";
import { UserModule } from "../user/user.module";
import { CryptoModule } from "../crypto/crypto.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PriceAlert.name, schema: PriceAlertSchema },
    ]),
    AuthModule,
    UserModule,
    CryptoModule,
  ],
  controllers: [AlertsController],
  providers: [AlertsService, EmailService, AlertsSchedulerService],
  exports: [AlertsService],
})
export class AlertsModule {}
