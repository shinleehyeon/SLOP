import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { SentryModule } from '@sentry/nestjs/setup';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { RequestIdHeaderInterceptor } from './common/interceptors/request-id-header.interceptor';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';
import { AppConfigModule } from './config/config.module';
import { AiServiceModule } from './infrastructure/ai-service/ai-service.module';
import { AiServiceAuthModule } from './infrastructure/auth/ai-service-auth.module';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { AppLoggerModule } from './infrastructure/logging/app-logger.module';
import { MeiliSearchModule } from './infrastructure/meilisearch/meilisearch.module';
import { AppRbacModule } from './infrastructure/rbac/app-rbac.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { RequestContextModule } from './infrastructure/request-context/request-context.module';
import { AppThrottleModule } from './infrastructure/throttle/app-throttle.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { createAuthChannelModule } from './modules/auth/channels/create-auth-channel.module';
import { JwtAuthGuard } from './modules/auth/presentation/guards/jwt-auth.guard';
import { ExpressionsModule } from './modules/expressions/expressions.module';
import { FieldsModule } from './modules/fields/fields.module';
import { FilesModule } from './modules/files/files.module';
import { HealthModule } from './modules/health/health.module';
import { LearningModule } from './modules/learning/learning.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { SearchModule } from './modules/search/search.module';
import { ShortsModule } from './modules/shorts/shorts.module';
import { TextSummariesModule } from './modules/text-summaries/text-summaries.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    AppConfigModule,
    AiServiceAuthModule,
    AiServiceModule,
    SentryModule.forRoot(),
    RequestContextModule,
    AppLoggerModule,
    AppThrottleModule,
    AppRbacModule,
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    MeiliSearchModule,
    AuditLogModule,
    HealthModule,
    createAuthChannelModule(),
    FilesModule,
    UsersModule,
    OnboardingModule,
    FieldsModule,
    ShortsModule,
    ExpressionsModule,
    TextSummariesModule,
    LearningModule,
    SearchModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestIdHeaderInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseEnvelopeInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
  ],
})
export class AppModule {}
