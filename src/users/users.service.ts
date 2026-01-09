import { Injectable, ConflictException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

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
  });

  if (existingUser) {
    throw new ConflictException('Email already registered');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  return this.prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: role ?? 'CREATOR',
    },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
}

async getAllUsers() {
  return this.prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
}

async findByEmail(email: string) {
  return this.prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      role: true, // ✅ REQUIRED
    },
  });
}
async findById(id: string) {
  return this.prisma.user.findUnique({
    where: { id },
  });
}
async getCreatorStats(creatorId: string) {
  const [applicationsSent, collaborations, activeCampaigns] =
    await Promise.all([
      // Total applications sent by creator
      this.prisma.campaignApplication.count({
        where: { creatorId },
      }),

      // Approved applications (collaborations)
      this.prisma.campaignApplication.count({
        where: {
          creatorId,
          status: 'APPROVED',
        },
      }),

      // Approved + active campaigns
      this.prisma.campaignApplication.count({
        where: {
          creatorId,
          status: 'APPROVED',
          campaign: {
            status: 'ACTIVE',
          },
        },
      }),
    ]);

  return {
    applicationsSent,
    collaborations,
    activeCampaigns,
  };
}


}
