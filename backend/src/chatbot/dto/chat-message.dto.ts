import { IsString, IsOptional, MinLength, MaxLength } from "class-validator";

export class SendMessageDto {
  @IsString()
  @MinLength(1, { message: "Message cannot be empty" })
  @MaxLength(1000, { message: "Message too long" })
  message: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
}

export interface ChatResponse {
  message: string;
  sessionId: string;
  timestamp: string;
}
