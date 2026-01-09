import { Injectable } from '@nestjs/common';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // -----------------------------
  // DASHBOARD
  // -----------------------------
  async getDashboardStats() {
    const [
      totalUsers,
      creators,
      brands,
      activeCampaigns,
      pendingCampaigns,
      closedCampaigns,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'CREATOR' } }),
      this.prisma.user.count({ where: { role: 'BRAND' } }),
      this.prisma.campaign.count({ where: { status: 'ACTIVE' } }),
      this.prisma.campaign.count({ where: { status: 'DRAFT' } }),
      this.prisma.campaign.count({ where: { status: 'CLOSED' } }),
    ]);

    return {
      users: totalUsers,
      creators,
      brands,
      campaigns: {
        active: activeCampaigns,
        pending: pendingCampaigns,
        closed: closedCampaigns,
      },
    };
  }

  // -----------------------------
  // AUDIT LOGS
  // -----------------------------
  async getAuditLogs() {
    return this.prisma.adminAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        admin: {
          select: { id: true, email: true },
        },
        campaign: {
          select: { id: true, title: true },
        },
      },
    });
  }

  // -----------------------------
  // USERS LIST
  // -----------------------------
  async getAllUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        isActive: true, // ✅ IMPORTANT
      },
    });
  }

  // -----------------------------
  // USER DETAILS
  // -----------------------------
  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        isActive: true,
        brandProfile: {
          select: {
            brandName: true,
            industry: true,
            websiteUrl: true,
            verified: true,
            createdAt: true,
          },
        },
        creatorProfile: {
          select: {
            displayName: true,
            category: true,
            primaryPlatform: true,
            followersCount: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const response: any = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        isActive: user.isActive, // ✅ single source of truth
      },
      profile: null,
      meta: {
        canBeDisabled: user.role !== 'ADMIN',
        canBeVerified: false,
        canBeSuspended: false,
      },
    };

    if (user.role === 'BRAND' && user.brandProfile) {
      response.profile = {
        type: 'BRAND',
        brandName: user.brandProfile.brandName,
        industry: user.brandProfile.industry,
        websiteUrl: user.brandProfile.websiteUrl,
        verified: user.brandProfile.verified,
        createdAt: user.brandProfile.createdAt,
      };
      response.meta.canBeVerified = true;
    }

    if (user.role === 'CREATOR' && user.creatorProfile) {
      response.profile = {
        type: 'CREATOR',
        displayName: user.creatorProfile.displayName,
        category: user.creatorProfile.category,
        primaryPlatform: user.creatorProfile.primaryPlatform,
        followersCount: user.creatorProfile.followersCount,
        createdAt: user.creatorProfile.createdAt,
      };
      response.meta.canBeSuspended = true;
    }

    return response;
  }

  // -----------------------------
  // DISABLE USER
  // -----------------------------
  async disableUser(adminId: string, targetUserId: string) {
    if (adminId === targetUserId) {
      throw new BadRequestException('Admins cannot disable themselves');
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: targetUserId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.role === 'ADMIN') {
        throw new ForbiddenException('Cannot disable admin users');
      }

      if (!user.isActive) {
        throw new BadRequestException('User is already disabled');
      }

      await tx.user.update({
        where: { id: user.id },
        data: { isActive: false },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: 'USER_DISABLED',
          targetUserId: user.id,
        },
      });

      return { success: true };
    });
  }

  // -----------------------------
  // ENABLE USER
  // -----------------------------
  async enableUser(adminId: string, targetUserId: string) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: targetUserId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.role === 'ADMIN') {
        throw new ForbiddenException('Admin users cannot be enabled/disabled');
      }

      if (user.isActive) {
        throw new BadRequestException('User is already active');
      }

      await tx.user.update({
        where: { id: user.id },
        data: { isActive: true },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: 'USER_ENABLED',
          targetUserId: user.id,
        },
      });

      return { success: true };
    });
  }
}
