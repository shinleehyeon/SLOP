import { Injectable } from '@nestjs/common';
import { ExpressionsRepository } from '../infrastructure/expressions.repository';
import { expressionNormalizedKey, expressionTitle } from './expression-key';

type FieldChoice = {
  fieldId: string;
  fieldName: string;
};

type Citation = {
  url: string;
  title: string | null;
};

@Injectable()
export class ExpressionsService {
  constructor(private readonly expressionsRepository: ExpressionsRepository) {}

  recordFromTextSummary(input: {
    userId: string;
    originalText: string;
    content: string;
    citations: Citation[];
    fieldChoices: FieldChoice[];
  }) {
    const firstCitation = input.citations[0] ?? null;

    return this.expressionsRepository.recordDrag({
      userId: input.userId,
      normalizedKey: expressionNormalizedKey(input.originalText),
      title: expressionTitle(input.originalText),
      definition: input.content,
      sourceTitle: firstCitation?.title ?? null,
      sourceUrl: firstCitation?.url ?? null,
      fieldId: resolveFieldId(input.fieldChoices, input.originalText),
      originalText: input.originalText,
      content: input.content,
    });
  }
}

function resolveFieldId(choices: FieldChoice[], text: string): string | null {
  if (choices.length === 0) {
    return null;
  }

  const lower = text.toLowerCase();
  const matched = choices.find((choice) => lower.includes(choice.fieldName.toLowerCase()));
  return matched?.fieldId ?? choices[0]?.fieldId ?? null;
}
