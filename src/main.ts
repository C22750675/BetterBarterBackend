import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips away properties that do not have any decorators
      forbidNonWhitelisted: true, // Throws an error if non-whitelisted values are provided
    }),
  );

  // Add the '0.0.0.0' host for emulator connectivity
  await app.listen(3000, '0.0.0.0');
}
void bootstrap();
