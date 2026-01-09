import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import axios from 'axios'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class InstagramService {
  constructor(private readonly prisma: PrismaService) {}

  async syncReel(reelId: string) {
    // 1️⃣ Load reel + creator + Instagram token
    const reel = await this.prisma.reelSubmission.findUnique({
      where: { id: reelId },
      include: {
        creator: {
          include: {
            instagramAccount: true
          }
        }
      }
    })

    if (!reel) {
      throw new NotFoundException('Reel submission not found')
    }

    if (!reel.creator.instagramAccount) {
      throw new BadRequestException('Creator has no Instagram account connected')
    }

    const token = reel.creator.instagramAccount.accessToken
    const mediaId = reel.igMediaId

    // 2️⃣ Verify media is a Reel
    const { data: media } = await axios.get(
      `https://graph.facebook.com/v24.0/${mediaId}`,
      {
        params: {
          fields: 'media_type,media_product_type,permalink',
          access_token: token
        }
      }
    )

    if (media.media_product_type !== 'REELS') {
      throw new BadRequestException('This media is not a Reel')
    }

    // 3️⃣ Fetch ONLY Meta-approved Reel metrics (v24)
    const { data: insightsResponse } = await axios.get(
      `https://graph.facebook.com/v24.0/${mediaId}/insights`,
      {
        params: {
          metric:
            'reach,likes,comments,shares,total_interactions,ig_reels_video_view_total_time',
          access_token: token
        }
      }
    )

    // Convert Meta response to { metricName: value }
    const insights = Object.fromEntries(
      insightsResponse.data.map(m => [m.name, m.values[0]?.value ?? 0])
    )

    const reach = insights.reach || 0
    const likes = insights.likes || 0
    const comments = insights.comments || 0
    const shares = insights.shares || 0
    const totalInteractions = insights.total_interactions || 0
    const watchTimeMs = insights.ig_reels_video_view_total_time || 0

    // 4️⃣ Derive CREATO business metrics
    // (Average view ≈ 4 seconds → estimate plays from watch time)
    const estimatedPlays = Math.floor(watchTimeMs / 4000)

    // 5️⃣ Store in CREATO database
   await this.prisma.reelSubmission.update({
  where: { id: reelId },
  data: {
    views: estimatedPlays,
    videoPlays: estimatedPlays,
    reach,
    likes,
    comments,
    lastSyncedAt: new Date()
  }
})

    return {
      reelUrl: media.permalink,
      reach,
      likes,
      comments,
      shares,
      totalInteractions,
      watchTimeMs,
      estimatedPlays
    }
  }
}
