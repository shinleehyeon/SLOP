import { Injectable } from '@nestjs/common';
import type { Difficulty, Prisma, Tone } from '@/generated/prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';

interface UpsertFieldInput {
  name: string;
  createdById: string;
}

interface CreateTermCacheInput {
  fieldId: string;
  tone: Tone;
  terms: Prisma.InputJsonValue;
}

interface UpsertUserFieldChoiceInput {
  userId: string;
  fieldId: string;
  difficulty: Difficulty;
}

@Injectable()
export class FieldsRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsertField(input: UpsertFieldInput) {
    return this.prisma.field.upsert({
      where: {
        name: input.name,
      },
      create: {
        name: input.name,
        createdById: input.createdById,
      },
      update: {},
    });
  }

  findTermCache(fieldId: string, tone: Tone) {
    return this.prisma.fieldTermCache.findUnique({
      where: {
        fieldId_tone: {
          fieldId,
          tone,
        },
      },
    });
  }

  createTermCache(input: CreateTermCacheInput) {
    return this.prisma.fieldTermCache.create({
      data: {
        fieldId: input.fieldId,
        tone: input.tone,
        terms: input.terms,
      },
    });
  }

  upsertUserFieldChoice(input: UpsertUserFieldChoiceInput) {
    return this.prisma.userFieldChoice.upsert({
      where: {
        userId_fieldId: {
          userId: input.userId,
          fieldId: input.fieldId,
        },
      },
      create: {
        userId: input.userId,
        fieldId: input.fieldId,
        difficulty: input.difficulty,
      },
      update: {
        difficulty: input.difficulty,
      },
    });
  }
}
