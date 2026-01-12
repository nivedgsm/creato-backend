import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'
import { processSlabPayout } from '../instagram/payout.engine'
import { processClearingAndFraud } from '../instagram/clearing.engine'

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/dev')
export class AdminDevController {
  constructor(private prisma: PrismaService) {}

  // 1️⃣ Force reel video plays → triggers slabs
  @Post('reel/:id/views')
  async setViews(
    @Param('id') id: string,
    @Body('views') views: number,
  ) {
    if (!Number.isFinite(views) || views < 0) {
      throw new BadRequestException('Invalid views')
    }

    const reel = await this.prisma.reelSubmission.update({
      where: { id },
      data: {
        videoPlays: views,   // 🔥 correct field
      },
    })

    await processSlabPayout(id)

    return reel
  }

  // 2️⃣ Fast-forward 30 days for all pending slab tx of this reel
  @Post('reel/:id/fastforward')
  async fastForward(@Param('id') id: string) {
    const txs = await this.prisma.walletTransaction.findMany({
      where: {
        reelId: id,
        status: 'PENDING',
        type: 'SLAB_EARNED',
      },
    })

    for (const tx of txs) {
      await this.prisma.walletTransaction.update({
        where: { id: tx.id },
        data: {
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35),
        },
      })
    }

    await processClearingAndFraud()
    return { success: true }
  }

  // 3️⃣ Force fraud → drop video plays → triggers reversal
  @Post('reel/:id/fraud')
  async fraud(@Param('id') id: string) {
    await this.prisma.reelSubmission.update({
      where: { id },
      data: {
        videoPlays: 0,   // 🔥 correct field
      },
    })

    await processClearingAndFraud()
    return { fraud: true }
  }

  // 4️⃣ Credit wallet manually
  @Post('wallet/:userId/credit')
  async credit(
    @Param('userId') userId: string,
    @Body('amount') amount: number,
  ) {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Invalid amount')
    }

    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    })

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId },
      })
    }

    return this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: { increment: amount },
      },
    })
  }
}
