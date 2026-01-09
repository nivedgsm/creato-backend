import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Param
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PrismaService } from '../prisma/prisma.service'
import { InstagramService } from './instagram.service'

@Controller('instagram')
@UseGuards(JwtAuthGuard)
export class InstagramController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly instagramService: InstagramService
  ) {}

  // Connect Instagram account
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
        userId: req.user.id
      }
    })
  }

  // 🔥 Manually trigger Meta sync for a reel
  @Post('sync/:reelId')
  async sync(@Param('reelId') reelId: string) {
    await this.instagramService.syncReel(reelId)
    return { success: true }
  }
}
