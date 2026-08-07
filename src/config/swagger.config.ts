import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const isSwaggerEnabled =
    process.env.SWAGGER_ENABLED === 'true' &&
    process.env.NODE_ENV !== 'production';
  if (!isSwaggerEnabled) {
    console.log('Swagger is disabled. Set SWAGGER_ENABLED=true to enable.');
    return;
  }

  const config = new DocumentBuilder()
    .setTitle('Joke API')
    .setDescription('The Joke API description')
    .setVersion('1.0')
    .addTag('joke')

    .build();

  // 3. Create and mount the document
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
}
