import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PrismaService } from '../prisma/prisma.service'
import { InstagramService } from './instagram.service'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'

@Controller('instagram')
export class InstagramController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly instagramService: InstagramService,
  ) {}

  // Connect Instagram account
  @UseGuards(JwtAuthGuard)
  @Post('connect')
  async connect(@Req() req, @Body() body) {
    const { igUserId, username, accessToken } = body

    return this.prisma.instagramAccount.upsert({
      where: { id: igUserId },
      update: { accessToken, username },
      create: {
        id: igUserId,
        username,
        accessToken,
        userId: req.user.userId,
      },
    })
  }

  // 🔥 Manually trigger Meta sync for a reel
  @UseGuards(JwtAuthGuard)
  @Post('sync/:reelId')
  async sync(@Param('reelId') reelId: string) {
    await this.instagramService.syncReel(reelId)
    return { success: true }
  }

  // 🧪 DEV ONLY — force video plays + run payout
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('debug-set-plays')
  async debugSetPlays(
    @Body() body: { reelId: string; videoPlays: number },
  ) {
    const { reelId, videoPlays } = body

    await this.prisma.reelSubmission.update({
      where: { id: reelId },
      data: { videoPlays },
    })

    await this.instagramService.syncReel(reelId)

    return { success: true }
  }
}
