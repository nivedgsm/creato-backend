import { Module } from '@nestjs/common'
import { InstagramService } from './instagram.service'
import { InstagramController } from './instagram.controller'
import { InstagramCron } from './instagram.cron'
import { PrismaService } from '../prisma/prisma.service'
import { ReelSyncScheduler } from './reel-sync.scheduler'

@Module({
  controllers: [InstagramController],
  providers: [
    InstagramService,
    InstagramCron,
    PrismaService,
    ReelSyncScheduler
  ]
})
export class InstagramModule {}
