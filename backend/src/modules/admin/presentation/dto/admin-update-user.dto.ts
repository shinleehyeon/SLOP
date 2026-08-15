import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AdminUpdateUserSchema = z
  .object({
    name: z.string().trim().min(1).max(30).optional(),
    role: z.enum(['admin', 'user']).optional(),
    email: z.email().optional(),
    phone: z.string().trim().min(8).max(20).nullable().optional(),
    profileImageId: z.string().nullable().optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.role !== undefined ||
      value.email !== undefined ||
      value.phone !== undefined ||
      value.profileImageId !== undefined,
    {
      message: 'At least one field is required',
    },
  );

export class AdminUpdateUserRequestDto extends createZodDto(AdminUpdateUserSchema) {}
