import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateBrandCampaignDto } from './dto/create-brand-campaign.dto';
import type { AuthRequest } from '../auth/auth-request.interface';

@Controller('campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CampaignsController {
  constructor(
    private readonly campaignsService: CampaignsService,
  ) {}

  // =====================================================
  // UNIVERSAL (Creator / Brand / Admin)
  // =====================================================

  /**
   * One endpoint powering:
   * - Creator marketplace
   * - Brand campaigns
   * - Admin moderation view
   */
  @Get()
  async getCampaigns(@Req() req: AuthRequest) {
    return this.campaignsService.getCampaignsForUser({
      userId: req.user.userId,
      role: req.user.role,
    });
  }

  // =====================================================
  // ADMIN
  // =====================================================

  @Get('admin')
  @Roles('ADMIN')
  async getAdminCampaigns(
    @Query('status') status?: 'DRAFT' | 'ACTIVE' | 'CLOSED',
  ) {
    if (status) {
      return this.campaignsService.getCampaignsForAdminByStatus(
        status,
      );
    }
    return this.campaignsService.getCampaignsForUser({
      userId: '',
      role: 'ADMIN',
    });
  }

  @Get('admin/pending')
  @Roles('ADMIN')
  async getPendingCampaigns() {
    return this.campaignsService.getPendingCampaignsForAdmin();
  }

  @Get('admin/:id')
  @Roles('ADMIN')
  async getAdminCampaignById(@Param('id') campaignId: string) {
    return this.campaignsService.getCampaignByIdForAdmin(
      campaignId,
    );
  }

  @Post('admin/:id/approve')
  @Roles('ADMIN')
  async approveCampaign(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ) {
    return this.campaignsService.approveCampaign(
      id,
      req.user.userId,
    );
  }

  @Post('admin/:id/cancel')
  @Roles('ADMIN')
  async cancelCampaign(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ) {
    return this.campaignsService.cancelCampaign(
      id,
      req.user.userId,
    );
  }

  // =====================================================
  // BRAND
  // =====================================================

  @Post()
  @Roles('BRAND')
  async createCampaign(
    @Body() dto: CreateBrandCampaignDto,
    @Req() req: AuthRequest,
  ) {
    return this.campaignsService.createCampaign(
      req.user.userId,
      dto,
    );
  }

  /**
   * Brand campaign list (uses same engine as /campaigns)
   */
  @Get('my')
  @Roles('BRAND')
  getMyCampaigns(@Req() req: AuthRequest) {
    return this.campaignsService.getCampaignsForUser({
      userId: req.user.userId,
      role: 'BRAND',
    });
  }

  // =====================================================
  // CREATOR
  // =====================================================

  @Post(':id/apply')
  @Roles('CREATOR')
  async applyToCampaign(
    @Param('id') campaignId: string,
    @Req() req: AuthRequest,
  ) {
    return this.campaignsService.applyToCampaign(
      campaignId,
      req.user.userId,
    );
  }

  // =====================================================
  // BRAND — Application moderation
  // =====================================================

  @Post('applications/:id/approve')
  @Roles('BRAND')
  async approveApplication(
    @Param('id') applicationId: string,
    @Req() req: AuthRequest,
  ) {
    return this.campaignsService.approveApplication(
      applicationId,
      req.user.userId,
    );
  }

  @Post('applications/:id/reject')
  @Roles('BRAND')
  async rejectApplication(
    @Param('id') applicationId: string,
    @Req() req: AuthRequest,
  ) {
    return this.campaignsService.rejectApplication(
      applicationId,
      req.user.userId,
    );
  }



  @Get('brand/:id')
@Roles('BRAND')
getBrandCampaignById(
  @Param('id') id: string,
  @Req() req: AuthRequest,
) {
  return this.campaignsService.getCampaignByIdForBrand(
    id,
    req.user.userId,
  );
}


}
