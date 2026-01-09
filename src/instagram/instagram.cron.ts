import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PrismaService } from '../prisma/prisma.service'
import { InstagramService } from './instagram.service'

@Injectable()
export class InstagramCron {
  constructor(
    private readonly prisma: PrismaService,
    private readonly instagramService: InstagramService
  ) {}

  @Cron('*/10 * * * *')
  async syncAll() {
    const reels = await this.prisma.reelSubmission.findMany({
      where: { status: 'TRACKING' }
    })

    for (const reel of reels) {
      try {
        await this.instagramService.syncReel(reel.id)
      } catch (e) {
        console.error('IG sync failed for', reel.id, e.message)
      }
    }
  }
}
