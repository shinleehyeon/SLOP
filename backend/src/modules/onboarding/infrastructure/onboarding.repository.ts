import { Injectable } from '@nestjs/common';
import type { Difficulty, DisplayFormat, ShortsStyle, Tone } from '@/generated/prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';

interface UpsertOnboardingProfileInput {
  userId: string;
  tone: Tone;
  displayFormat: DisplayFormat;
  shortsStyle: ShortsStyle;
  completedAt: Date;
}

interface SaveFieldChoiceInput {
  fieldName: string;
  difficulty: Difficulty;
}

interface SaveSettingsInput extends UpsertOnboardingProfileInput {
  fieldChoices: SaveFieldChoiceInput[];
}

@Injectable()
export class OnboardingRepository {
  constructor(private readonly prisma: PrismaService) {}

  findSettings(userId: string) {
    return Promise.all([
      this.prisma.onboardingProfile.findUnique({
        where: {
          userId,
        },
      }),
      this.prisma.userFieldChoice.findMany({
        where: {
          userId,
        },
        include: {
          field: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
    ]);
  }

  saveSettings(input: SaveSettingsInput) {
    return this.prisma.$transaction(async (tx) => {
      const profile = await tx.onboardingProfile.upsert({
        where: {
          userId: input.userId,
        },
        create: {
          userId: input.userId,
          tone: input.tone,
          displayFormat: input.displayFormat,
          shortsStyle: input.shortsStyle,
          completedAt: input.completedAt,
        },
        update: {
          tone: input.tone,
          displayFormat: input.displayFormat,
          shortsStyle: input.shortsStyle,
          completedAt: input.completedAt,
        },
      });

      const fieldIds: string[] = [];
      const fieldChoices = [];

      for (const choice of input.fieldChoices) {
        const field = await tx.field.upsert({
          where: {
            name: choice.fieldName,
          },
          create: {
            name: choice.fieldName,
            createdById: input.userId,
          },
          update: {},
        });

        const userFieldChoice = await tx.userFieldChoice.upsert({
          where: {
            userId_fieldId: {
              userId: input.userId,
              fieldId: field.id,
            },
          },
          create: {
            userId: input.userId,
            fieldId: field.id,
            difficulty: choice.difficulty,
          },
          update: {
            difficulty: choice.difficulty,
          },
        });

        fieldIds.push(field.id);
        fieldChoices.push({
          ...userFieldChoice,
          field,
        });
      }

      await tx.userFieldChoice.deleteMany({
        where: {
          userId: input.userId,
          ...(fieldIds.length > 0 ? { fieldId: { notIn: fieldIds } } : {}),
        },
      });

      return {
        profile,
        fieldChoices,
      };
    });
  }
}
