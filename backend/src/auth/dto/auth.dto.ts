import { IsEmail, IsString, MinLength, IsOptional } from "class-validator";
import { IsStrongPassword } from "../../common/decorators";

export class SignUpDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsStrongPassword()
  password: string;

  @IsOptional()
  @IsString()
  fullName?: string;
}

export class SignInDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  password: string;
}

export class ResetPasswordDto {
  @IsEmail()
  email: string;
}

export class UpdatePasswordDto {
  @IsString()
  @IsStrongPassword()
  password: string;

  @IsString()
  @MinLength(1)
  accessToken: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword: string;

  @IsString()
  @IsStrongPassword()
  newPassword: string;
}
