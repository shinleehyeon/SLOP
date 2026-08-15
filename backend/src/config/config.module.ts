import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './configuration';
import { envValidationSchema } from './env.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      expandVariables: true,
      isGlobal: true,
      load: [configuration],
      validate: (env) => {
        const { error, value } = envValidationSchema.validate(env, {
          abortEarly: false,
          allowUnknown: true,
        });

        if (error) {
          // Nest/Sentry ExceptionHandler often logs only "Error" (no message). Write details before exit.
          const details = error.details.map((detail) => detail.message).join('; ');
          const message = `Config validation error: ${details}`;
          process.stderr.write(`${message}\n`);
          process.exit(1);
        }

        return value;
      },
    }),
  ],
})
export class AppConfigModule {}
