import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandCampaignDto } from './dto/create-brand-campaign.dto';
import { CreateCampaignSlabDto }  from './dto/create-campaign-slab.dto'

/* ======================================================
   PRISMA QUERY SHAPES (ROLE-SCOPED, SINGLE SOURCE)
====================================================== */

// 👤 CREATOR — minimal + myApplication only
const CREATOR_CAMPAIGN_INCLUDE = {
  slabs: true,   // ✅ keep this simple
  applications: {
    select: {
      status: true,
    },
  },
} satisfies Prisma.CampaignInclude



// 🏢 BRAND — full campaign + applications + creator email
const BRAND_CAMPAIGN_INCLUDE: Prisma.CampaignInclude = {
  slabs: true, // 🔥 include performance slabs
  applications: {
    include: {
      creator: {
        select: {
          email: true,
        },
      },
    },
    orderBy: [
      {
        createdAt: 'desc',
      },
    ],
  },
};


// 🛡 ADMIN — full financial + asset visibility
// 🛡 ADMIN — full financial + asset visibility
const ADMIN_CAMPAIGN_SELECT = {
  id: true,
  title: true,
  description: true,
  requirements: true,

  status: true,
  brandId: true,
  createdAt: true,

  requiresAdminApproval: true,
  requiresCreatorApproval: true,
  applicationRequirement: true,
  participationType: true,

  // 💰 Finance
  totalBudget: true,
  platformFee: true,
  creatorPool: true,

  // 🔗 Brand assets
  googleDriveLink: true,
  megaLink: true,
  youtubeLink: true,
  instagramLink: true,
  otherLinks: true,

  // 💰 Slabs
  slabs: true,

  brand: {
    select: {
      id: true,
      email: true,
    },
  },

  _count: {
    select: {
      applications: true,
    },
  },
}




type CampaignWithMyApplication =
  Prisma.CampaignGetPayload<{
    include: typeof CREATOR_CAMPAIGN_INCLUDE;
  }>;

/* ======================================================
   SERVICE
====================================================== */

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  /* ===============================
     BRAND: Create campaign
  =============================== */


async createCampaign(
  brandId: string,
  dto: CreateBrandCampaignDto,
) {
  if (!dto.totalBudget || dto.totalBudget <= 0) {
    throw new BadRequestException('Invalid total budget')
  }

  const PLATFORM_FEE_PERCENT = 20

  const totalBudget = dto.totalBudget
  const platformFee = Math.round(
    (totalBudget * PLATFORM_FEE_PERCENT) / 100,
  )
  const creatorPool = totalBudget - platformFee

  return this.prisma.campaign.create({
    data: {
      title: dto.title,
      description: dto.description,
      brandId,

      requirements: dto.requirements,
      budget: dto.budget,

      // 💰 CREATO payout engine
      totalBudget,
      platformFee,
      creatorPool,

      googleDriveLink: dto.googleDriveLink,
      megaLink: dto.megaLink,
      youtubeLink: dto.youtubeLink,
      instagramLink: dto.instagramLink,
      otherLinks: dto.otherLinks,

      requiresCreatorApproval:
        dto.requiresCreatorApproval ?? false,

      applicationRequirement:
        dto.applicationRequirement ?? 'OPEN',

      participationType:
        dto.participationType ?? 'APPROVAL_REQUIRED',

      requiresAdminApproval: true,
      status: 'DRAFT',
    },
  })
}



async addSlabs(
  brandId: string,
  campaignId: string,
  slabs: CreateCampaignSlabDto[],
) {
  const campaign = await this.prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { slabs: true },
  })

  if (!campaign) throw new NotFoundException('Campaign not found')
  if (campaign.brandId !== brandId)
    throw new ForbiddenException('Not your campaign')
  if (campaign.status !== 'DRAFT')
    throw new BadRequestException(
      'Cannot edit slabs after campaign is published',
    )

  if (!slabs.length) throw new BadRequestException('No slabs provided')

  // Existing slabs
  const existingViews = campaign.slabs.map(s => s.views)
  const existingPayout = campaign.slabs.reduce((s, v) => s + v.payout, 0)
  const highestExisting = Math.max(0, ...existingViews)

  // Sort new slabs
  const sorted = [...slabs].sort((a, b) => a.views - b.views)

  // Validate ascending order
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0 && sorted[i].views <= highestExisting) {
      throw new BadRequestException(
        `First slab must be > ${highestExisting} views`,
      )
    }

    if (i > 0 && sorted[i].views <= sorted[i - 1].views) {
      throw new BadRequestException('Slabs must be strictly increasing')
    }
  }

  // Validate pool
  const newPayout = sorted.reduce((s, v) => s + v.payout, 0)
  if (existingPayout + newPayout > campaign.creatorPool) {
    throw new BadRequestException(
      `Total payout exceeds creator pool of ₹${campaign.creatorPool}`,
    )
  }

  return this.prisma.campaignSlab.createMany({
    data: sorted.map(s => ({
      campaignId,
      views: s.views,
      payout: s.payout,
    })),
  })
}



  /* ===============================
     ROLE-BASED CAMPAIGN LISTING
  =============================== */
  async getCampaignsForUser(user: {
    userId: string;
    role: 'ADMIN' | 'BRAND' | 'CREATOR';
  }) {
    switch (user.role) {
      case 'CREATOR':
        return this.getCreatorCampaigns(user.userId);
      case 'BRAND':
        return this.getBrandCampaigns(user.userId);
      case 'ADMIN':
        return this.getAdminCampaigns();
      default:
        return [];
    }
  }

  /* ===============================
     CREATOR
  =============================== */
 private async getCreatorCampaigns(creatorId: string) {
  const campaigns: CampaignWithMyApplication[] =
    await this.prisma.campaign.findMany({
      where: { status: 'ACTIVE' },
      include: {
        slabs: true,   // 🔥 THIS was missing
        applications: {
          select: {
            status: true,
          },
          where: { creatorId },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

  return campaigns.map((campaign) => ({
    ...campaign,
    myApplication:
      campaign.applications.length > 0
        ? { status: campaign.applications[0].status }
        : undefined,
    applications: undefined, // 🔒 hide others
  }))
}


  /* ===============================
     BRAND
  =============================== */
  private async getBrandCampaigns(brandId: string) {
    return this.prisma.campaign.findMany({
      where: { brandId },
      include: BRAND_CAMPAIGN_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  /* ===============================
     ADMIN
  =============================== */
  private async getAdminCampaigns() {
    return this.prisma.campaign.findMany({
      select: ADMIN_CAMPAIGN_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCampaignByIdForAdmin(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: ADMIN_CAMPAIGN_SELECT,
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  async getCampaignsForAdminByStatus(
    status: 'DRAFT' | 'ACTIVE' | 'CLOSED',
  ) {
    return this.prisma.campaign.findMany({
      where: { status },
      select: ADMIN_CAMPAIGN_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingCampaignsForAdmin() {
    return this.prisma.campaign.findMany({
      where: { status: 'DRAFT' },
      select: ADMIN_CAMPAIGN_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  /* ===============================
     CREATOR: Apply to campaign
  =============================== */
async applyToCampaign(campaignId: string, creatorId: string) {
  if (!creatorId) {
    throw new UnauthorizedException('Invalid token');
  }

  const campaign = await this.prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    throw new NotFoundException('Campaign not found');
  }

  if (campaign.status !== 'ACTIVE') {
    throw new BadRequestException(
      'You can only apply to active campaigns',
    );
  }

  const creator = await this.prisma.user.findUnique({
    where: { id: creatorId },
    include: { creatorProfile: true },
  });

  if (!creator || creator.role !== 'CREATOR') {
    throw new ForbiddenException('Only creators can apply');
  }

  if (!creator.isActive) {
    throw new ForbiddenException('Account is disabled');
  }

  if (!creator.creatorProfile) {
    throw new BadRequestException(
      'Creator profile required',
    );
  }

  // 🔒 Eligibility check
  if (
    campaign.applicationRequirement === 'VERIFIED_ONLY' &&
    !creator.creatorProfile.isVerified
  ) {
    throw new ForbiddenException(
      'Only verified creators can apply',
    );
  }

  try {
    // 🔥 OPEN campaigns auto-approve creators
    const status =
      campaign.participationType === 'OPEN'
        ? 'APPROVED'
        : 'PENDING';

    return await this.prisma.campaignApplication.create({
      data: {
        campaignId,
        creatorId,
        status,
      },
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new ConflictException(
        'You have already applied',
      );
    }
    throw error;
  }
}

  /* ===============================
     ADMIN: Status updates
  =============================== */
  async approveCampaign(campaignId: string, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign || campaign.status !== 'DRAFT') {
        throw new BadRequestException(
          'Only draft campaigns can be approved',
        );
      }

      const updated = await tx.campaign.update({
        where: { id: campaignId },
        data: { status: 'ACTIVE' },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: 'CAMPAIGN_APPROVED',
          campaignId,
          previousStatus: campaign.status,
          newStatus: updated.status,
        },
      });

      return updated;
    });
  }

  async cancelCampaign(campaignId: string, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign || campaign.status === 'CLOSED') {
        throw new BadRequestException(
          'Campaign already cancelled',
        );
      }

      const updated = await tx.campaign.update({
        where: { id: campaignId },
        data: { status: 'CLOSED' },
      });

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: 'CAMPAIGN_CANCELLED',
          campaignId,
          previousStatus: campaign.status,
          newStatus: updated.status,
        },
      });

      return updated;
    });
  }

  /* ===============================
     BRAND: Application moderation
  =============================== */
  async approveApplication(applicationId: string, brandId: string) {
    return this.prisma.$transaction(async (tx) => {
      const application =
        await tx.campaignApplication.findUnique({
          where: { id: applicationId },
          include: { campaign: true },
        });

      if (!application) {
        throw new NotFoundException('Application not found');
      }

      if (application.campaign.brandId !== brandId) {
        throw new ForbiddenException(
          'You do not own this campaign',
        );
      }

      if (application.status !== 'PENDING') {
        throw new BadRequestException(
          'Application already processed',
        );
      }

      return tx.campaignApplication.update({
        where: { id: applicationId },
        data: { status: 'APPROVED' },
      });
    });
  }

  async rejectApplication(applicationId: string, brandId: string) {
    return this.prisma.$transaction(async (tx) => {
      const application =
        await tx.campaignApplication.findUnique({
          where: { id: applicationId },
          include: { campaign: true },
        });

      if (!application) {
        throw new NotFoundException('Application not found');
      }

      if (application.campaign.brandId !== brandId) {
        throw new ForbiddenException(
          'You do not own this campaign',
        );
      }

      if (application.status !== 'PENDING') {
        throw new BadRequestException(
          'Application already processed',
        );
      }

      return tx.campaignApplication.update({
        where: { id: applicationId },
        data: { status: 'REJECTED' },
      });
    });
  }



  /* ===============================
   BRAND: Single campaign
=============================== */
async getCampaignByIdForBrand(
  campaignId: string,
  brandId: string,
) {
  const campaign = await this.prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      // 💰 Performance slabs
      slabs: {
        orderBy: {
          views: 'asc', // ensure proper slab ladder
        },
      },

      // 👥 Applications + creator identity
      applications: {
        include: {
          creator: {
            select: {
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })

  if (!campaign) {
    throw new NotFoundException('Campaign not found')
  }

  if (campaign.brandId !== brandId) {
    throw new ForbiddenException('Access denied')
  }

  return campaign
}


}
