import { Injectable } from '@nestjs/common';
import {
  buildFiltersWhere,
  buildOrderBy,
  buildTextQueryWhere,
  combineWhere,
  containsWhereAny,
  type ResolvedListQuery,
  stringContainsFilter,
} from '@/common/list-query';
import { UserRole } from '@/generated/prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import type { ListUsersFilters } from '../presentation/dto/list-users-query.dto';

interface CreateUserInput {
  email: string;
  phone?: string | null;
  name: string;
  role?: UserRole;
  passwordHash?: string | null;
  emailVerifiedAt?: Date | null;
  phoneVerifiedAt?: Date | null;
}

interface UpdateUserProfileInput {
  name?: string | null;
  profileImageId?: string | null;
}

interface UpdateAdminUserInput {
  name?: string;
  role?: UserRole;
  email?: string;
  phone?: string | null;
  profileImageId?: string | null;
  emailVerifiedAt?: Date | null;
  phoneVerifiedAt?: Date | null;
}

interface FindManyInput {
  listQuery: ResolvedListQuery<ListUsersFilters>;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        profileImage: true,
      },
    });
  }

  findByIdWithOAuthAccounts(id: string) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        profileImage: true,
        oauthAccounts: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  countByRole(role: UserRole) {
    return this.prisma.user.count({
      where: {
        role,
      },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  findByPhone(phone: string) {
    return this.prisma.user.findUnique({
      where: {
        phone,
      },
    });
  }

  async findMany(input: FindManyInput) {
    const { listQuery } = input;
    const where = combineWhere(
      buildTextQueryWhere(listQuery.query, (query) =>
        containsWhereAny([['name'], ['email']], query),
      ),
      buildFiltersWhere(listQuery.filters, listQuery.filterMatch, {
        name: stringContainsFilter('name'),
        email: stringContainsFilter('email'),
        role: (value) => defaultRoleFilter(value),
      }),
    );

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: listQuery.offset,
        take: listQuery.limit,
        orderBy: buildOrderBy(listQuery.sort),
        include: {
          profileImage: true,
          oauthAccounts: {
            select: {
              provider: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      total,
    };
  }

  create(input: CreateUserInput) {
    return this.prisma.user.create({
      data: {
        email: input.email,
        phone: input.phone,
        name: input.name,
        role: input.role ?? UserRole.USER,
        passwordHash: input.passwordHash,
        emailVerifiedAt: input.emailVerifiedAt,
        phoneVerifiedAt: input.phoneVerifiedAt,
      },
    });
  }

  markEmailVerified(userId: string) {
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        emailVerifiedAt: new Date(),
      },
    });
  }

  markPhoneVerified(userId: string) {
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        phoneVerifiedAt: new Date(),
      },
    });
  }

  deleteById(id: string) {
    return this.prisma.user.delete({
      where: {
        id,
      },
    });
  }

  updateProfileImage(userId: string, profileImageId: string) {
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        profileImageId,
      },
    });
  }

  updatePassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        passwordHash,
      },
    });
  }

  updateProfile(userId: string, input: UpdateUserProfileInput) {
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name: input.name,
        profileImageId: input.profileImageId,
      },
      include: {
        profileImage: true,
      },
    });
  }

  updateAdmin(userId: string, input: UpdateAdminUserInput) {
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name: input.name,
        role: input.role,
        email: input.email,
        phone: input.phone,
        profileImageId: input.profileImageId,
        emailVerifiedAt: input.emailVerifiedAt,
        phoneVerifiedAt: input.phoneVerifiedAt,
      },
      include: {
        profileImage: true,
        oauthAccounts: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }
}

function defaultRoleFilter(value: unknown) {
  if (Array.isArray(value)) {
    return {
      role: {
        in: value.map((role) => role as UserRole),
      },
    };
  }

  return { role: value as UserRole };
}
