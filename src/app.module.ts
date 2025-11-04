import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { ItemsModule } from './items/items.module';
import { CirclesModule } from './circles/circles.module';
import { TradesModule } from './trades/trades.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available everywhere
      envFilePath: '.env', // Specifies the .env file to load
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
        entities: [__dirname + '/**/*.entity{.ts,.js}'],

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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
