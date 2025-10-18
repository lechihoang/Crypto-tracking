import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { SupabaseService } from "./supabase.service";
import {
  SignUpDto,
  SignInDto,
  ResetPasswordDto,
  UpdatePasswordDto,
  ChangePasswordDto,
} from "./dto/auth.dto";

@Injectable()
export class AuthService {
  constructor(private supabaseService: SupabaseService) {}

  async signUp(signUpDto: SignUpDto) {
    const { email, password, fullName } = signUpDto;
    const supabase = this.supabaseService.getAnonClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        throw new ConflictException("User already exists");
      }
      throw new UnauthorizedException(error.message);
    }

    return {
      user: data.user,
      message: "Please check your email to confirm your account",
    };
  }

  async signIn(signInDto: SignInDto) {
    const { email, password } = signInDto;
    const supabase = this.supabaseService.getAnonClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email } = resetPasswordDto;
    const supabase = this.supabaseService.getAnonClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/auth/reset-password`,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return {
      message: "Password reset email sent",
    };
  }

  async updatePassword(updatePasswordDto: UpdatePasswordDto) {
    const { password, accessToken } = updatePasswordDto;
    const supabase = this.supabaseService.getAnonClient();

    // Set session first
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: "", // You may need to store refresh token
    });

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return {
      message: "Password updated successfully",
    };
  }

  async changePassword(
    changePasswordDto: ChangePasswordDto,
    accessToken: string,
  ) {
    const { currentPassword, newPassword } = changePasswordDto;
    const supabase = this.supabaseService.getAnonClient();

    // First, verify the current password by attempting to sign in
    const { data: user } = await supabase.auth.getUser(accessToken);
    if (!user?.user?.email) {
      throw new UnauthorizedException("Invalid token");
    }

    // Verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.user.email,
      password: currentPassword,
    });

    if (signInError) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      throw new UnauthorizedException(updateError.message);
    }

    return {
      message: "Password changed successfully",
    };
  }

  async getUser(accessToken: string) {
    const supabase = this.supabaseService.getAnonClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      throw new UnauthorizedException("Invalid token");
    }

    return user;
  }

  getSupabaseAdmin() {
    return this.supabaseService.getAdminClient();
  }
}
