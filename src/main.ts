// Arquivo: src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ensureCsvFileExists } from './utils/CSV';
import { CSV_FILE_USER, CSV_HEADERS_USER } from './users/csv-user.repository';
import { CSV_FILE_GROUP, CSV_HEADERS_GROUP } from './group/group.repository';
import { CSV_FILE_CHAT, CSV_HEADERS_CHAT } from './chat/chat.repository';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const csvFilesToCheck = [
    { CSV_FILE: CSV_FILE_USER, CSV_HEADERS: CSV_HEADERS_USER },
    { CSV_FILE: CSV_FILE_GROUP, CSV_HEADERS: CSV_HEADERS_GROUP },
    { CSV_FILE: CSV_FILE_CHAT, CSV_HEADERS: CSV_HEADERS_CHAT },
  ];

  await Promise.all(csvFilesToCheck.map(ensureCsvFileExists));

  const app = await NestFactory.create(AppModule);
  app.enableCors();

  app.useGlobalPipes(new ValidationPipe());

  // Logs de depuração para o caminho estático:
  const uploadsPath = join(__dirname, '..', '..', 'uploads');
  console.log('Static serving: __dirname is', __dirname); // Caminho do diretório atual do main.js
  console.log('Static serving: Calculated uploads path is', uploadsPath); // Caminho que será servido

  app.use('/uploads', express.static(uploadsPath));

  const config = new DocumentBuilder()
    .setTitle('ZAP ZAP 2')
    .setDescription('bora passar')
    .setVersion('2.9.9')
    .addBearerAuth()
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`esta rodando em http://localhost:${3000}/api`);
}
bootstrap();