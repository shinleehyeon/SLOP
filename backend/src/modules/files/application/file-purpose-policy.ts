import { FilePurpose } from '@/generated/prisma/client';

interface FilePurposePolicy {
  maxBytes: number;
  matchesContentType: (contentType: string) => boolean;
}

const PROFILE_IMAGE_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const GENERAL_MAX_BYTES = 50 * 1024 * 1024;

const BLOCKED_GENERAL_CONTENT_TYPES = new Set([
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/vnd.microsoft.portable-executable',
  'application/x-executable',
]);

export function normalizeContentType(contentType: string) {
  return contentType.split(';')[0].trim().toLowerCase();
}

function matchesProfileImageContentType(contentType: string) {
  return PROFILE_IMAGE_CONTENT_TYPES.has(contentType);
}

function matchesGeneralContentType(contentType: string) {
  if (!contentType) {
    return true;
  }

  return !BLOCKED_GENERAL_CONTENT_TYPES.has(contentType);
}

export const FILE_PURPOSE_POLICIES: Record<FilePurpose, FilePurposePolicy> = {
  [FilePurpose.PROFILE_IMAGE]: {
    maxBytes: PROFILE_IMAGE_MAX_BYTES,
    matchesContentType: matchesProfileImageContentType,
  },
  [FilePurpose.GENERAL]: {
    maxBytes: GENERAL_MAX_BYTES,
    matchesContentType: matchesGeneralContentType,
  },
};

export const FILE_PURPOSE_VALUES = Object.keys(FILE_PURPOSE_POLICIES) as [
  FilePurpose,
  ...FilePurpose[],
];

export function isAllowedContentType(purpose: FilePurpose, contentType: string) {
  const policy = FILE_PURPOSE_POLICIES[purpose];

  if (!policy) {
    return false;
  }

  return policy.matchesContentType(normalizeContentType(contentType));
}
