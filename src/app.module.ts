import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from './users/users.module.js';
import { ItemsModule } from './items/items.module.js';
import { CirclesModule } from './circles/circles.module.js';
import { TradesModule } from './trades/trades.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UploadsModule } from './uploads/uploads.module.js';
import { ReputationModule } from './reputation/reputation.module.js';
import { ReputationSimulatorService } from './reputation/reputation-simulator.service.js';
import reputationConfig from './config/reputation.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [reputationConfig], // Tells NestJS to load the algorithmic parameters
      isGlobal: true, // Makes ConfigService available across all modules
      envFilePath: '.env', // Loads secrets from the environment file
    }),

    // Setup TypeORM with PostgreSQL using ConfigService
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      // The useFactory function will be called to create the configuration object
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
      }),
      // This tells NestJS to inject the ConfigService into our useFactory function
      inject: [ConfigService],
    }),

    // Feature modules
    UsersModule,
    ItemsModule,
    CirclesModule,
    TradesModule,
    AuthModule,
    UploadsModule,
    ReputationModule,
  ],
  controllers: [],
  providers: [ReputationSimulatorService],
})
export class AppModule {}
