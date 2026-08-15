import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { z } from 'zod';
import { normalizeFieldName } from '@/common/text/normalize-field-name';
import type { Tone } from '@/generated/prisma/client';
import {
  getOpenRouterErrorMessage,
  isOpenRouterNonRetryableError,
} from '@/infrastructure/openrouter/openrouter.errors';
import { OpenRouterService } from '@/infrastructure/openrouter/openrouter.service';
import { AUDIT_LOG_ACTIONS } from '@/modules/audit-log/application/audit-log.actions';
import { AuditLogService } from '@/modules/audit-log/application/audit-log.service';
import { FieldsRepository } from '../infrastructure/fields.repository';
import type {
  GenerateFieldTermsRequestDto,
  SaveFieldChoiceRequestDto,
} from '../presentation/dto/fields.dto';
import { FieldTermItemSchema, parseFieldTermsJson } from './field-term.schema';
import { buildFieldTermUserPrompt, FIELD_TERM_SYSTEM_PROMPT } from './field-term-prompt';

@Injectable()
export class FieldsService {
  private readonly logger = new Logger(FieldsService.name);

  constructor(
    private readonly fieldsRepository: FieldsRepository,
    private readonly openRouterService: OpenRouterService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async generateTerms(userId: string, dto: GenerateFieldTermsRequestDto) {
    const fieldName = this.resolveFieldName(dto.fieldName);
    const field = await this.fieldsRepository.upsertField({
      name: fieldName,
      createdById: userId,
    });

    const cached = await this.fieldsRepository.findTermCache(field.id, dto.tone);

    if (cached) {
      const terms = z.array(FieldTermItemSchema).length(2).parse(cached.terms);

      return {
        field: field.name,
        terms,
      };
    }

    const generated = await this.generateTermsWithRetry(field.name, dto.tone);

    await this.fieldsRepository.createTermCache({
      fieldId: field.id,
      tone: dto.tone,
      terms: generated.terms,
    });

    return generated;
  }

  async saveChoice(userId: string, dto: SaveFieldChoiceRequestDto) {
    const fieldName = this.resolveFieldName(dto.fieldName);
    const field = await this.fieldsRepository.upsertField({
      name: fieldName,
      createdById: userId,
    });

    const choice = await this.fieldsRepository.upsertUserFieldChoice({
      userId,
      fieldId: field.id,
      difficulty: dto.difficulty,
    });

    await this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.fieldChoiceSaved,
      actorId: userId,
      targetType: 'user_field_choice',
      targetId: choice.id,
      metadata: {
        fieldId: field.id,
        fieldName: field.name,
        difficulty: choice.difficulty,
      },
    });

    return {
      id: choice.id,
      userId: choice.userId,
      fieldId: choice.fieldId,
      difficulty: choice.difficulty,
      createdAt: choice.createdAt.toISOString(),
    };
  }

  private resolveFieldName(fieldName: string) {
    const normalized = normalizeFieldName(fieldName);

    if (!normalized) {
      throw new BadRequestException('fieldName must not be empty');
    }

    return normalized;
  }

  private async generateTermsWithRetry(fieldName: string, tone: Tone) {
    let lastError: unknown;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const raw = await this.openRouterService.chatJson(
          FIELD_TERM_SYSTEM_PROMPT,
          buildFieldTermUserPrompt(fieldName, tone),
        );

        const parsed = parseFieldTermsJson(raw);

        return {
          field: parsed.field,
          terms: parsed.terms,
        };
      } catch (error) {
        if (isOpenRouterNonRetryableError(error)) {
          throw new ServiceUnavailableException(getOpenRouterErrorMessage(error));
        }

        lastError = error;
        this.logger.warn(
          { attempt: attempt + 1, fieldName, tone, error },
          'Failed to generate or parse field terms',
        );
      }
    }

    this.logger.error({ fieldName, tone, error: lastError }, 'Field term generation failed');

    if (isOpenRouterNonRetryableError(lastError)) {
      throw new ServiceUnavailableException(getOpenRouterErrorMessage(lastError));
    }

    throw new InternalServerErrorException(getOpenRouterErrorMessage(lastError));
  }
}
