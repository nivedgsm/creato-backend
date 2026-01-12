import { PrismaClient } from '@prisma/client'
import { addDays, isAfter } from 'date-fns'
import axios from 'axios'

const prisma = new PrismaClient()

export async function processClearingAndFraud() {
  const pendingTxs = await prisma.walletTransaction.findMany({
    where: {
      type: 'SLAB_EARNED',
      status: 'PENDING',
    },
    include: {
      reel: {
        include: {
          creator: {
            include: {
              instagramAccount: true,
            },
          },
          campaign: {
            include: {
              slabs: true,
            },
          },
        },
      },
      wallet: true,
    },
  })

  for (const tx of pendingTxs) {
    const unlockAt = addDays(tx.createdAt, 30)

    // ⏳ Still locked
    if (!isAfter(new Date(), unlockAt)) continue

    const reel = tx.reel
    if (!reel || !reel.creator.instagramAccount) {
      await reverse(tx, 'Reel missing')
      continue
    }

    // 🔍 Re-validate reel existence
    try {
      const { data } = await axios.get(
        `https://graph.facebook.com/v24.0/${reel.igMediaId}`,
        {
          params: {
            fields: 'media_product_type',
            access_token: reel.creator.instagramAccount.accessToken,
          },
        },
      )

      if (data.media_product_type !== 'REELS') {
        await reverse(tx, 'Reel deleted')
        continue
      }
    } catch {
      await reverse(tx, 'Reel unreachable')
      continue
    }

    // 🔎 Find slab that created this tx
    const slab = reel.campaign.slabs.find(
      s => s.payout === tx.amount,
    )

    if (!slab) {
      await reverse(tx, 'Slab missing')
      continue
    }

    // 🔥 Instagram-correct validation
    if (reel.videoPlays < slab.views) {
      await reverse(tx, 'Views dropped')
      continue
    }

    // ✅ CLEAR MONEY
    await prisma.$transaction(async t => {
      await t.wallet.update({
        where: { id: tx.walletId },
        data: {
          pending: { decrement: tx.amount },
          balance: { increment: tx.amount },
        },
      })

      await t.walletTransaction.update({
        where: { id: tx.id },
        data: { status: 'CLEARED' },
      })
    })
  }
}

async function reverse(tx, reason: string) {
  await prisma.$transaction(async t => {
    await t.wallet.update({
      where: { id: tx.walletId },
      data: {
        pending: { decrement: tx.amount },
      },
    })

    await t.walletTransaction.update({
      where: { id: tx.id },
      data: { status: 'REVERSED' },
    })
  })

  console.log('Reversed payout', tx.id, reason)
}
