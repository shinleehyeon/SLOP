import { Injectable } from '@nestjs/common';
import { OAuthProvider } from '@/generated/prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';

interface OAuthAccountInput {
  provider: OAuthProvider;
  providerAccountId: string;
  email?: string | null;
}

interface CreateOAuthUserInput extends OAuthAccountInput {
  email: string;
  name: string;
}

@Injectable()
export class UserOAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOAuthAccountsByUserId(userId: string) {
    return this.prisma.oAuthAccount.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  deleteOAuthAccount(userId: string, provider: OAuthProvider) {
    return this.prisma.oAuthAccount.deleteMany({
      where: {
        userId,
        provider,
      },
    });
  }

  findByOAuthAccount(provider: OAuthProvider, providerAccountId: string) {
    return this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
      include: {
        user: true,
      },
    });
  }

  createOAuthAccount(userId: string, input: OAuthAccountInput) {
    return this.prisma.oAuthAccount.create({
      data: {
        provider: input.provider,
        providerAccountId: input.providerAccountId,
        email: input.email,
        userId,
      },
    });
  }

  createOAuthUser(input: CreateOAuthUserInput) {
    return this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash: null,
        emailVerifiedAt: new Date(),
        oauthAccounts: {
          create: {
            provider: input.provider,
            providerAccountId: input.providerAccountId,
            email: input.email,
          },
        },
      },
    });
  }

  async findOrCreateOAuthUser(input: CreateOAuthUserInput) {
    const oauthAccount = await this.findByOAuthAccount(input.provider, input.providerAccountId);

    if (oauthAccount) {
      return oauthAccount.user;
    }

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: input.email,
      },
    });

    if (existingUser) {
      await this.createOAuthAccount(existingUser.id, input);

      return existingUser;
    }

    return this.createOAuthUser(input);
  }
}
