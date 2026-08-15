import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const DebugErrorTriggerHelpSchema = z.object({
  kinds: z.array(z.string()),
  usage: z.string(),
});

export class DebugErrorTriggerHelpDto extends createZodDto(DebugErrorTriggerHelpSchema) {}
