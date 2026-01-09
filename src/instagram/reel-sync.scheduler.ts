import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PrismaService } from '../prisma/prisma.service'
import { InstagramService } from './instagram.service'

@Injectable()
export class ReelSyncScheduler {
  private readonly logger = new Logger(ReelSyncScheduler.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly instagramService: InstagramService
  ) {}

  // Runs every 10 minutes
@Cron('*/10 * * * *')
async syncAllReels() {
  this.logger.log('Starting 10-minute reel sync')

  const reels = await this.prisma.reelSubmission.findMany({
    where: {
      igMediaId: { not: '' }
    },
    select: { id: true }
  })

  for (const reel of reels) {
    try {
      await this.instagramService.syncReel(reel.id)
      this.logger.log(`Synced reel ${reel.id}`)
    } catch (e) {
      this.logger.error(`Failed to sync reel ${reel.id}`, e.message)
    }
  }

  this.logger.log(`Finished syncing ${reels.length} reels`)
}

}
