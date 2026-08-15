import { FilePurpose } from '@/generated/prisma/client';
import {
  FILE_PURPOSE_POLICIES,
  isAllowedContentType,
  normalizeContentType,
} from './file-purpose-policy';

const PROFILE_IMAGE_FETCH_TIMEOUT_MS = 10_000;

export interface FetchedProfileImage {
  buffer: Buffer;
  contentType: string;
  size: number;
}

export async function fetchProfileImageFromUrl(pictureUrl: string): Promise<FetchedProfileImage> {
  const parsedUrl = new URL(pictureUrl);

  if (parsedUrl.protocol !== 'https:') {
    throw new Error('Profile image URL must use HTTPS');
  }

  const maxBytes = FILE_PURPOSE_POLICIES[FilePurpose.PROFILE_IMAGE].maxBytes;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROFILE_IMAGE_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(pictureUrl, {
      signal: controller.signal,
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch profile image: HTTP ${response.status}`);
    }

    const contentLengthHeader = response.headers.get('content-length');

    if (contentLengthHeader) {
      const contentLength = Number(contentLengthHeader);

      if (Number.isFinite(contentLength) && contentLength > maxBytes) {
        throw new Error('Profile image exceeds the allowed limit');
      }
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.length === 0) {
      throw new Error('Profile image is empty');
    }

    if (buffer.length > maxBytes) {
      throw new Error('Profile image exceeds the allowed limit');
    }

    const headerContentType = response.headers.get('content-type');
    const contentType = resolveProfileImageContentType(buffer, headerContentType);

    if (!isAllowedContentType(FilePurpose.PROFILE_IMAGE, contentType)) {
      throw new Error('Unsupported profile image content type');
    }

    return {
      buffer,
      contentType,
      size: buffer.length,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function resolveProfileImageContentType(buffer: Buffer, headerContentType: string | null) {
  const normalizedHeader = headerContentType ? normalizeContentType(headerContentType) : undefined;

  if (normalizedHeader && isAllowedContentType(FilePurpose.PROFILE_IMAGE, normalizedHeader)) {
    return normalizedHeader;
  }

  const sniffed = sniffImageContentType(buffer);

  if (!sniffed) {
    throw new Error('Unable to determine profile image content type');
  }

  return sniffed;
}

function sniffImageContentType(buffer: Buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
}
