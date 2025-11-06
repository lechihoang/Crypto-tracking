import { Module, forwardRef } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { Auth0Service } from "./auth0.service";
import { UserModule } from "../user/user.module";

@Module({
  imports: [forwardRef(() => UserModule)],
  providers: [AuthService, Auth0Service],
  controllers: [AuthController],
  exports: [AuthService, Auth0Service],
})
export class AuthModule {}
