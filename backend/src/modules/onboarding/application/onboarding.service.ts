import { BadRequestException, Injectable } from '@nestjs/common';
import { normalizeFieldName } from '@/common/text/normalize-field-name';
import { AiService } from '@/infrastructure/ai-service/ai-service.service';
import { SearchIndexerService } from '@/infrastructure/meilisearch/search-indexer.service';
import { AUDIT_LOG_ACTIONS } from '@/modules/audit-log/application/audit-log.actions';
import { AuditLogService } from '@/modules/audit-log/application/audit-log.service';
import { OnboardingRepository } from '../infrastructure/onboarding.repository';
import type { SaveOnboardingSettingsRequestDto } from '../presentation/dto/save-onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly onboardingRepository: OnboardingRepository,
    private readonly auditLogService: AuditLogService,
    private readonly aiService: AiService,
    private readonly searchIndexer: SearchIndexerService,
  ) {}

  async getSettings(userId: string) {
    const [profile, fieldChoices] = await this.onboardingRepository.findSettings(userId);

    return {
      profile: profile ? this.serializeProfile(profile) : null,
      fieldChoices: fieldChoices.map((choice) => this.serializeFieldChoice(choice)),
    };
  }

  async saveSettings(userId: string, dto: SaveOnboardingSettingsRequestDto) {
    const fieldChoices = this.normalizeFieldChoices(dto.fieldChoices);
    const completedAt = new Date();

    const saved = await this.onboardingRepository.saveSettings({
      userId,
      tone: dto.tone,
      displayFormat: dto.displayFormat,
      shortsStyle: dto.shortsStyle,
      completedAt,
      fieldChoices,
    });

    await this.auditLogService.record({
      action: AUDIT_LOG_ACTIONS.onboardingSaved,
      actorId: userId,
      targetType: 'onboarding_profile',
      targetId: saved.profile.id,
      metadata: {
        tone: saved.profile.tone,
        displayFormat: saved.profile.displayFormat,
        shortsStyle: saved.profile.shortsStyle,
        fieldChoiceCount: saved.fieldChoices.length,
      },
    });

    const settings = {
      profile: this.serializeProfile(saved.profile),
      fieldChoices: saved.fieldChoices.map((choice) => this.serializeFieldChoice(choice)),
    };

    this.searchIndexer.indexAccountById(userId);

    await this.aiService.syncOnboarding({
      userId,
      onboarding: settings,
    });

    return settings;
  }

  private normalizeFieldChoices(fieldChoices: SaveOnboardingSettingsRequestDto['fieldChoices']) {
    const seen = new Set<string>();
    const normalized = [];

    for (const choice of fieldChoices) {
      const fieldName = normalizeFieldName(choice.fieldName);

      if (!fieldName) {
        throw new BadRequestException('fieldName must not be empty');
      }

      if (seen.has(fieldName)) {
        throw new BadRequestException(`Duplicate fieldName: ${fieldName}`);
      }

      seen.add(fieldName);
      normalized.push({
        fieldName,
        difficulty: choice.difficulty,
      });
    }

    return normalized;
  }

  private serializeProfile(profile: {
    id: string;
    userId: string;
    tone: string;
    displayFormat: string;
    shortsStyle: string;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: profile.id,
      userId: profile.userId,
      tone: profile.tone,
      displayFormat: profile.displayFormat,
      shortsStyle: profile.shortsStyle,
      completedAt: profile.completedAt?.toISOString() ?? null,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }

  private serializeFieldChoice(choice: {
    id: string;
    userId: string;
    fieldId: string;
    difficulty: string;
    createdAt: Date;
    field: {
      name: string;
    };
  }) {
    return {
      id: choice.id,
      userId: choice.userId,
      fieldId: choice.fieldId,
      fieldName: choice.field.name,
      difficulty: choice.difficulty,
      createdAt: choice.createdAt.toISOString(),
    };
  }
}
