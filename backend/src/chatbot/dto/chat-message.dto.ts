import { z } from "zod";

export const SendMessageDto = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(1000, "Message too long"),
  sessionId: z.string().optional(),
});

export type SendMessageDto = z.infer<typeof SendMessageDto>;

export interface ChatResponse {
  message: string;
  sessionId: string;
  timestamp: string;
}
