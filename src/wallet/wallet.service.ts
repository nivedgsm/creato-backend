import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    })

    if (!wallet) {
      throw new NotFoundException('Wallet not found')
    }

    return wallet
  }

  async getTransactions(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    })

    if (!wallet) {
      throw new NotFoundException('Wallet not found')
    }

    return this.prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
    })
  }

  async requestWithdrawal(userId: string, amount: number) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    })

    if (!wallet) {
      throw new NotFoundException('Wallet not found')
    }

    if (amount <= 0) {
      throw new BadRequestException('Invalid amount')
    }

    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient balance')
    }

    return this.prisma.$transaction(async tx => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: amount },
        },
      })

     await tx.walletTransaction.create({
  data: {
    walletId: wallet.id,
    amount,
    type: 'WITHDRAWAL',
    status: 'PENDING',
  },
})


      return { success: true }
    })
  }
}
