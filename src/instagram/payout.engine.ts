import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

/**
 * Called after every reel sync
 * Unlocks newly hit slabs
 * Credits creator wallet.pending
 */
export async function processSlabPayout(reelId: string) {
  const reel = await prisma.reelSubmission.findUnique({
    where: { id: reelId },
    include: {
      campaign: {
        include: {
          slabs: { orderBy: { views: 'asc' } },
        },
      },
      creator: {
        include: { wallet: true },
      },
    },
  })

  if (!reel || !reel.creator.wallet) return

  const wallet = reel.creator.wallet
  const slabs = reel.campaign.slabs
  const views = reel.videoPlays
  const alreadyEarned = reel.earnings

  let unlocked = 0

  for (const slab of slabs) {
    if (views >= slab.views && slab.payout > alreadyEarned) {
      unlocked += slab.payout
    }
  }

  if (unlocked === 0) return

  await prisma.$transaction(async tx => {
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        reelId: reel.id,
        amount: unlocked,
        type: 'SLAB_EARNED',
        status: 'PENDING',
      },
    })

    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        pending: { increment: unlocked },
      },
    })

    await tx.reelSubmission.update({
      where: { id: reel.id },
      data: {
        earnings: { increment: unlocked },
      },
    })
  })
}
