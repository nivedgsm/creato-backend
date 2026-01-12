import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import axios from 'axios'
import { PrismaService } from '../prisma/prisma.service'
import { processSlabPayout } from './payout.engine'

@Injectable()
export class InstagramService {
  constructor(private readonly prisma: PrismaService) {}

  async syncReel(reelId: string) {
    // 1️⃣ Load reel + creator + IG token + campaign slabs
    const reel = await this.prisma.reelSubmission.findUnique({
      where: { id: reelId },
      include: {
        creator: {
          include: { instagramAccount: true },
        },
        campaign: {
          include: {
            slabs: {
              orderBy: { views: 'asc' },
            },
          },
        },
      },
    })

    if (!reel) {
      throw new NotFoundException('Reel submission not found')
    }

    if (!reel.creator.instagramAccount) {
      throw new BadRequestException(
        'Creator has no Instagram account connected',
      )
    }

    const token = reel.creator.instagramAccount.accessToken
    const mediaId = reel.igMediaId

    if (!mediaId) {
      throw new BadRequestException('Reel has no Instagram media ID')
    }

    // 2️⃣ Validate Reel
    const { data: media } = await axios.get(
      `https://graph.facebook.com/v24.0/${mediaId}`,
      {
        params: {
          fields: 'media_product_type,permalink',
          access_token: token,
        },
      },
    )

    if (media.media_product_type !== 'REELS') {
      throw new BadRequestException('This media is not a Reel')
    }

    // 3️⃣ Fetch approved IG metrics
    const { data: insightsResponse } = await axios.get(
      `https://graph.facebook.com/v24.0/${mediaId}/insights`,
      {
        params: {
          metric:
            'reach,likes,comments,shares,ig_reels_video_view_total_time',
          access_token: token,
        },
      },
    )

    // Convert Meta array → object
    const insights = Object.fromEntries(
      insightsResponse.data.map(m => [m.name, m.values[0]?.value ?? 0]),
    )

    const reach = insights.reach || 0
    const likes = insights.likes || 0
    const comments = insights.comments || 0
    const shares = insights.shares || 0
    const watchTimeMs = insights.ig_reels_video_view_total_time || 0

    // 4️⃣ CREATO business metric → plays
    // Avg reel watch ≈ 4 seconds
    const videoPlays = Math.floor(watchTimeMs / 4000)

    // 5️⃣ Persist metrics (schema-safe)
    await this.prisma.reelSubmission.update({
      where: { id: reelId },
      data: {
        igUrl: media.permalink,
        videoPlays,
        reach,
        likes,
        comments,
      },
    })

    // 6️⃣ 💰 Trigger slab payout engine
    await processSlabPayout(reelId)

    return {
      reelUrl: media.permalink,
      reach,
      likes,
      comments,
      shares,
      watchTimeMs,
      videoPlays,
    }
  }
}
