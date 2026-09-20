import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from './config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

export class App {
  static async main() {
    const app = await NestFactory.create(AppModule);

    const url = '/api/v1'

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    app.use(cookieParser());

    app.setGlobalPrefix(url);

    const config = new DocumentBuilder()
      .setTitle('Gap Platform API')
      .setDescription('Gap Platform backend API')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup(`${url}/docs`, app, document);

    await app.listen(env.PORT, () => console.log(`Server running on port`, env.PORT));
  }
}