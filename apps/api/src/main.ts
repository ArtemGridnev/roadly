import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';
import type {
  CorsOptions,
  CorsOptionsDelegate,
} from '@nestjs/common/interfaces/external/cors-options.interface';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import type { Request } from 'express';

const dashboardOrigin = process.env.DASHBOARD_URL ?? 'http://localhost:5173';

const corsOptionsDelegate: CorsOptionsDelegate<Request> = (req, callback) => {
  const isWidgetRoute = req.url.startsWith('/widget');
  // widget auth is header-based (no cookies), so any origin is safe here
  const options: CorsOptions = isWidgetRoute
    ? { origin: true }
    : { origin: dashboardOrigin, credentials: true };
  callback(null, options);
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(corsOptionsDelegate);
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Roadly API')
    .setDescription('Roadly API endpoints')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
