import { createClient } from "@supabase/supabase-js";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class SupabaseService {
  private supabase;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<string>("SUPABASE_URL") || "",
      this.configService.get<string>("SUPABASE_SERVICE_ROLE_KEY") || "",
    );
  }

  getClient() {
    return this.supabase;
  }

  getServiceClient() {
    return this.supabase;
  }

  // Admin client with service role key (full access)
  getAdminClient() {
    return this.supabase;
  }

  // Create a client with anon key for user operations
  getAnonClient() {
    return createClient(
      this.configService.get<string>("SUPABASE_URL") || "",
      this.configService.get<string>("SUPABASE_ANON_KEY") || "",
    );
  }
}
