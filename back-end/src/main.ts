import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { configureApp } from './configure-app';

process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection', reason);
});
process.on('uncaughtException', (err) => {
  console.error('uncaughtException', err?.stack ?? err);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  const config = new DocumentBuilder()
    .setTitle('Habit')
    .setDescription('The habits API description')
    .setVersion('1.0')
    .build();
  if (process.env.NODE_ENV !== 'production') {
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, documentFactory);
  }

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
void bootstrap();
