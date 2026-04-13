import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('AuthService');
  const app = await NestFactory.create(AppModule);

  // Sécurité
  app.use(helmet());
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  });

  // Validation globale des DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Préfixe API
  app.setGlobalPrefix('api/v1');

  // Documentation Swagger
  const config = new DocumentBuilder()
    .setTitle('SANTÉ-CI — Auth Service')
    .setDescription('Service d\'authentification et gestion des accès')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3009;
  await app.listen(port);
  logger.log(`Auth Service démarré sur le port ${port}`);
  logger.log(`Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
