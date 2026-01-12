import { Controller, Get, Post, UseGuards, Req, Body } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { WalletService } from './wallet.service'
import type { AuthRequest } from '../auth/auth-request.interface'

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get()
  getWallet(@Req() req: AuthRequest) {
    return this.walletService.getWallet(req.user.userId)
  }

  @Get('transactions')
  getTransactions(@Req() req: AuthRequest) {
    return this.walletService.getTransactions(req.user.userId)
  }

  @Post('withdraw')
  requestWithdraw(
    @Req() req: AuthRequest,
    @Body('amount') amount: number,
  ) {
    return this.walletService.requestWithdrawal(req.user.userId, amount)
  }
}
