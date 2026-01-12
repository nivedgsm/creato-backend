import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { ProfilesModule } from './profiles/profiles.module';
import { AdminModule } from './admin/admin.module';
import { ScheduleModule } from '@nestjs/schedule';
import { InstagramModule } from './instagram/instagram.module';
import { WalletModule } from './wallet/wallet.module'





@Module({
  imports: [
    // Loads .env and makes it available everywhere
    ConfigModule.forRoot({ isGlobal: true }),

    // Global database access
    PrismaModule,

    // Feature modules
    HealthModule,

    UsersModule,
    AuthModule,
      CampaignsModule,
      ProfilesModule,
      AdminModule,
      ScheduleModule.forRoot(),
       InstagramModule,
       WalletModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
