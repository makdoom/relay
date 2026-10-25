import { z } from 'zod';
import type { SafeUserProfile } from '../users/users.schema.js';

export const createDirectConversationSchema = z.object({
  recipientId: z.uuid('Invalid recipient Id format'),
});

export type CreateDirectConversationInput = z.infer<typeof createDirectConversationSchema>;

export interface DirectConversationResponse {
  id: string;
  type: 'direct';
  createdAt: string;
  recipient: SafeUserProfile;
}
