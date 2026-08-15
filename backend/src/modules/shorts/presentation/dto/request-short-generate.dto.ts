import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ShortGenerationStatusSchema = z.enum([
  'GENERATING',
  'COMPLETED',
  'DISPATCH_FAILED',
  'FAILED',
]);

export const RequestShortGenerateSchema = z
  .object({
    content: z.string().trim().max(10_000).optional().nullable(),
    links: z.array(z.string().trim().url().max(2048)).max(20).default([]),
    attachments: z.array(z.string().min(1)).max(20).default([]),
    requestedSiteUrl: z.string().trim().url().max(2048).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    const hasContent = Boolean(value.content?.trim());
    const hasLinks = value.links.length > 0;
    const hasAttachments = value.attachments.length > 0;

    if (!hasContent && !hasLinks && !hasAttachments) {
      ctx.addIssue({
        code: 'custom',
        message: 'At least one of content, links, or attachments is required',
        path: ['content'],
      });
    }

    if (new Set(value.attachments).size !== value.attachments.length) {
      ctx.addIssue({
        code: 'custom',
        message: 'Duplicate fileId in attachments',
        path: ['attachments'],
      });
    }
  });

export class RequestShortGenerateDto extends createZodDto(RequestShortGenerateSchema) {}

export const ShortGenerationResponseSchema = z.object({
  id: z.string(),
  status: ShortGenerationStatusSchema,
  requestedSiteUrl: z.string().nullable(),
  content: z.string().nullable(),
  links: z.array(z.string()),
  attachmentFileIds: z.array(z.string()),
  seriesId: z.string().nullable(),
  aiJobId: z.string().nullable(),
  errorMessage: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class ShortGenerationResponseDto extends createZodDto(ShortGenerationResponseSchema) {}

export const ShortGenerationListResponseSchema = z.object({
  items: z.array(ShortGenerationResponseSchema),
});

export class ShortGenerationListResponseDto extends createZodDto(
  ShortGenerationListResponseSchema,
) {}

export const ListShortGenerationsQuerySchema = z.object({
  status: ShortGenerationStatusSchema.optional(),
});

export class ListShortGenerationsQueryDto extends createZodDto(ListShortGenerationsQuerySchema) {}
