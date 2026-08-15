import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateUserSchema = z
  .object({
    name: z.string().trim().min(1).max(30).nullish(),
    profileImageId: z.string().nullish(),
  })
  .refine((value) => value.name !== undefined || value.profileImageId !== undefined, {
    message: '최소 하나의 필드는 필수입니다.',
  });

export class UpdateUserRequestDto extends createZodDto(UpdateUserSchema) {}
