import { Cron } from '@nestjs/schedule'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { addDays, isAfter } from 'date-fns'

@Injectable()
export class WalletScheduler {
  constructor(private prisma: PrismaService) {}

  @Cron('0 0 * * *') // every day
  async releasePending() {
    const txs = await this.prisma.walletTransaction.findMany({
      where: {
        type: 'SLAB_EARNED',
        status: 'PENDING',
      },
    })

    for (const tx of txs) {
      if (isAfter(new Date(), addDays(tx.createdAt, 30))) {
        await this.prisma.$transaction([
          this.prisma.wallet.update({
            where: { id: tx.walletId },
            data: {
              pending: { decrement: tx.amount },
              balance: { increment: tx.amount },
            },
          }),
          this.prisma.walletTransaction.update({
            where: { id: tx.id },
            data: { status: 'CLEARED' },
          }),
        ])
      }
    }
  }
}
