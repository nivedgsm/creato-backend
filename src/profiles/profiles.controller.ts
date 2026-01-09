import {
  Controller,
  Get,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import type { Request } from 'express';
import { Body, Post } from '@nestjs/common';
import { CreateCreatorProfileDto } from './dto/create-creator-profile.dto';
import { CreateBrandProfileDto } from './dto/create-brand-profile.dto';
import { Patch } from '@nestjs/common';
import { UpdateCreatorProfileDto } from './dto/update-creator-profile.dto';
import { UpdateBrandProfileDto } from './dto/update-brand-profile.dto';



@Controller('profiles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('creator/me')
  async getMyCreatorProfile(@Req() req: Request) {
    const user = req.user as { userId: string; role: string };

    if (user.role !== 'CREATOR') {
      throw new ForbiddenException('Only creators can access this profile');
    }

    const profile =
      await this.profilesService.getCreatorProfileByUserId(user.userId);

    return { data: profile };
  }

  @Get('brand/me')
  async getMyBrandProfile(@Req() req: Request) {
    const user = req.user as { userId: string; role: string };

    if (user.role !== 'BRAND') {
      throw new ForbiddenException('Only brands can access this profile');
    }

    const profile =
      await this.profilesService.getBrandProfileByUserId(user.userId);

    return { data: profile };
  }
  @Post('creator')
async createCreatorProfile(
  @Req() req: Request,
  @Body() dto: CreateCreatorProfileDto,
) {
  const user = req.user as { userId: string; role: string };

  if (user.role !== 'CREATOR') {
    throw new ForbiddenException('Only creators can create a creator profile');
  }

  const profile = await this.profilesService.createCreatorProfile(
    user.userId,
    dto,
  );

  return { data: profile };
}

@Post('brand')
async createBrandProfile(
  @Req() req: Request,
  @Body() dto: CreateBrandProfileDto,
) {
  const user = req.user as { userId: string; role: string };

  if (user.role !== 'BRAND') {
    throw new ForbiddenException('Only brands can create a brand profile');
  }

  const profile = await this.profilesService.createBrandProfile(
    user.userId,
    dto,
  );

  return { data: profile };
}
@Patch('creator')
async updateCreatorProfile(
  @Req() req: Request,
  @Body() dto: UpdateCreatorProfileDto,
) {
  const user = req.user as { userId: string; role: string };

  if (user.role !== 'CREATOR') {
    throw new ForbiddenException('Only creators can edit creator profiles');
  }

  const profile = await this.profilesService.updateCreatorProfile(
    user.userId,
    dto,
  );

  return { data: profile };
}
@Patch('brand')
async updateBrandProfile(
  @Req() req: Request,
  @Body() dto: UpdateBrandProfileDto,
) {
  const user = req.user as { userId: string; role: string };

  if (user.role !== 'BRAND') {
    throw new ForbiddenException('Only brands can edit brand profiles');
  }

  const profile = await this.profilesService.updateBrandProfile(
    user.userId,
    dto,
  );

  return { data: profile };
}


}
