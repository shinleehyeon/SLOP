import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  formatOpenRouterErrorForLog,
  getOpenRouterErrorMessage,
  isOpenRouterNonRetryableError,
} from '@/infrastructure/openrouter/openrouter.errors';
import { OPENROUTER_PERPLEXITY_MODEL } from '@/infrastructure/openrouter/openrouter.models';
import { OpenRouterService } from '@/infrastructure/openrouter/openrouter.service';
import { AUDIT_LOG_ACTIONS } from '@/modules/audit-log/application/audit-log.actions';
import { AuditLogService } from '@/modules/audit-log/application/audit-log.service';
import { ExpressionsService } from '@/modules/expressions/application/expressions.service';
import { OnboardingService } from '@/modules/onboarding/application/onboarding.service';
import type { CreateTextSummaryRequestDto } from '../presentation/dto/text-summary.dto';
import { assertSummaryMatchesDisplayFormat } from './text-summary-format';
import { buildTextSummaryUserPrompt, TEXT_SUMMARY_SYSTEM_PROMPT } from './text-summary-prompt';

@Injectable()
export class TextSummariesService {
  private readonly logger = new Logger(TextSummariesService.name);

  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly openRouterService: OpenRouterService,
    private readonly expressionsService: ExpressionsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(userId: string, dto: CreateTextSummaryRequestDto) {
    const settings = await this.onboardingService.getSettings(userId);

    if (!settings.profile) {
      throw new BadRequestException('온보딩을 먼저 완료해 주세요');
    }

    const fieldChoices = settings.fieldChoices.map((choice) => ({
      fieldId: choice.fieldId,
      fieldName: choice.fieldName,
      difficulty: choice.difficulty,
    }));

    const appliedProfile = {
      tone: settings.profile.tone,
      displayFormat: settings.profile.displayFormat,
      shortsStyle: settings.profile.shortsStyle,
      fieldChoices: fieldChoices.map((choice) => ({
        fieldName: choice.fieldName,
        difficulty: choice.difficulty,
      })),
    };

    const originalText = dto.text.trim();
    const context = dto.context?.trim() || null;

    const llmResult = await this.generateWithRetry({
      text: originalText,
      context,
      profile: {
        tone: appliedProfile.tone,
        displayFormat: appliedProfile.displayFormat,
        shortsStyle: appliedProfile.shortsStyle,
        fieldChoices: appliedProfile.fieldChoices,
      },
    });

    const expression = await this.expressionsService.recordFromTextSummary({
      userId,
      originalText,
      content: llmResult.content,
      citations: llmResult.citations,
      fieldChoices: fieldChoices.map((choice) => ({
        fieldId: choice.fieldId,
        fieldName: choice.fieldName,
      })),
    });

    await this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.textSummaryCreated,
      actorId: userId,
      targetType: 'text_summary',
      targetId: expression.id,
      metadata: {
        originalLength: originalText.length,
        citationCount: llmResult.citations.length,
        expressionId: expression.id,
        tone: appliedProfile.tone,
        displayFormat: appliedProfile.displayFormat,
      },
    });

    await this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.expressionDragged,
      actorId: userId,
      targetType: 'expression',
      targetId: expression.id,
      metadata: {
        dragCount: expression.dragCount,
      },
    });

    return {
      originalText,
      content: llmResult.content,
      citations: llmResult.citations,
      expressionId: expression.id,
      appliedProfile,
    };
  }

  private async generateWithRetry(input: {
    text: string;
    context: string | null;
    profile: {
      tone: string;
      displayFormat: string;
      shortsStyle: string;
      fieldChoices: Array<{ fieldName: string; difficulty: string }>;
    };
  }) {
    let lastError: unknown;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const result = await this.openRouterService.chatWithCitations(
          TEXT_SUMMARY_SYSTEM_PROMPT,
          buildTextSummaryUserPrompt(input),
          { model: OPENROUTER_PERPLEXITY_MODEL },
        );

        assertSummaryMatchesDisplayFormat(result.content, input.profile.displayFormat);
        return result;
      } catch (error) {
        const detail = formatOpenRouterErrorForLog(error);

        if (isOpenRouterNonRetryableError(error)) {
          this.logger.error(`Text summary non-retryable failure: ${detail}`);
          throw new ServiceUnavailableException(getOpenRouterErrorMessage(error));
        }

        lastError = error;
        this.logger.warn(`Failed to generate text summary (attempt ${attempt + 1}): ${detail}`);
      }
    }

    this.logger.error(`Text summary generation failed: ${formatOpenRouterErrorForLog(lastError)}`);

    if (isOpenRouterNonRetryableError(lastError)) {
      throw new ServiceUnavailableException(getOpenRouterErrorMessage(lastError));
    }

    throw new InternalServerErrorException(getOpenRouterErrorMessage(lastError));
  }
}
