import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppModule } from './app.module';
import { setupDocumentation } from './document';
import { AllExceptionFilter } from './common/filter';
import { ResponseInterceptor } from './common/interceptor';

const configService: ConfigService = new ConfigService();
const logger = new Logger('----- APP -----');

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter({
            logger: true,
            trustProxy: true,
        }),
    );

    const apiPath = configService.getOrThrow('API_PATH');

    app.setGlobalPrefix(apiPath);
    app.enableCors();
    app.useGlobalFilters(new AllExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
        }),
    );

    const docPath = configService.getOrThrow('DOC_PATH');
    setupDocumentation(app, docPath);

    const port = +configService.getOrThrow('PORT');
    await app.listen(port, '0.0.0.0');

    logger.log(`Docs: http://0.0.0.0:${port}/${apiPath}`);
    logger.log(`API:  http://0.0.0.0:${port}/${docPath}`);
    logger.verbose('Running ...');
}
bootstrap();
