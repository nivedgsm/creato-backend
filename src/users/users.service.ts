import {
  Injectable,
  ConflictException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import * as bcrypt from 'bcrypt'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(
    email: string,
    password: string,
    role?: 'CREATOR' | 'BRAND',
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new ConflictException('Email already registered')
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user + wallet atomically
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role ?? 'CREATOR',
        wallet: {
          create: {}, // 👈 auto-create wallet
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    return user
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
      },
    })
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    })
  }

  async getCreatorStats(creatorId: string) {
    const [applicationsSent, collaborations, activeCampaigns] =
      await Promise.all([
        this.prisma.campaignApplication.count({
          where: { creatorId },
        }),
        this.prisma.campaignApplication.count({
          where: {
            creatorId,
            status: 'APPROVED',
          },
        }),
        this.prisma.campaignApplication.count({
          where: {
            creatorId,
            status: 'APPROVED',
            campaign: {
              status: 'ACTIVE',
            },
          },
        }),
      ])

    return {
      applicationsSent,
      collaborations,
      activeCampaigns,
    }
  }
}
