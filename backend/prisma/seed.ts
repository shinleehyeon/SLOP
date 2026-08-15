import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import { PrismaClient, UserRole } from '../src/generated/prisma/client';

const PASSWORD_SALT_ROUNDS = 12;
const DEFAULT_PASSWORD = 'Password123!';

const seedUsers = [
  {
    email: 'admin@sunrinthon.dev',
    name: '관리자',
    role: UserRole.ADMIN,
  },
  {
    email: 'user@sunrinthon.dev',
    name: '일반 사용자',
    role: UserRole.USER,
  },
  {
    email: 'demo@sunrinthon.dev',
    name: '데모 사용자',
    role: UserRole.USER,
  },
] as const;

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL;

  if (!url) {
    throw new Error('DATABASE_URL or DATABASE_DIRECT_URL is required.');
  }

  return url;
}

const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, PASSWORD_SALT_ROUNDS);

  for (const user of seedUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        passwordHash,
        emailVerifiedAt: new Date(),
      },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    });
  }

  console.log('Seed completed.');
  console.log(`Default password for all seed users: ${DEFAULT_PASSWORD}`);
  console.log('Users:');
  for (const user of seedUsers) {
    console.log(`- ${user.email} (${user.role})`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
