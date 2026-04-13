import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from './notifications/notifications.module';
import { Notification } from './notifications/notification.entity';
import { TemplateNotification } from './templates/template.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST') ?? config.get('POSTGRES_HOST') ?? 'localhost',
        port: parseInt(config.get('DB_PORT') ?? config.get('POSTGRES_PORT') ?? '5432'),
        username: config.get('POSTGRES_USER') ?? 'sante_ci',
        password: config.get('POSTGRES_PASSWORD') ?? 'sante_ci_dev',
        database: config.get('DB_NAME') ?? 'sante_notification',
        entities: [Notification, TemplateNotification],
        synchronize: config.get('NODE_ENV') === 'development',
        logging: false,
      }),
    }),
    NotificationsModule,
  ],
})
export class AppModule {}
