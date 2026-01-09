import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateCreatorProfileDto } from './dto/create-creator-profile.dto';
import { CreateBrandProfileDto } from './dto/create-brand-profile.dto';
import { NotFoundException } from '@nestjs/common';
import { UpdateCreatorProfileDto } from './dto/update-creator-profile.dto';
import { UpdateBrandProfileDto } from './dto/update-brand-profile.dto';



@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async getCreatorProfileByUserId(userId: string) {
    return this.prisma.creatorProfile.findUnique({
      where: { userId },
    });
  }

  async getBrandProfileByUserId(userId: string) {
    return this.prisma.brandProfile.findUnique({
      where: { userId },
    });
  }

  async createCreatorProfile(
  userId: string,
  dto: CreateCreatorProfileDto,
) {
  const existing = await this.prisma.creatorProfile.findUnique({
    where: { userId },
  });

  if (existing) {
    throw new ConflictException('Creator profile already exists');
  }

  return this.prisma.creatorProfile.create({
    data: {
      userId,
      displayName: dto.displayName,
      username: dto.username,
      bio: dto.bio,
      category: dto.category,
      primaryPlatform: dto.primaryPlatform,
      followersCount: dto.followersCount,
      country: dto.country,
      language: dto.language,
    },
  });
}

async createBrandProfile(
  userId: string,
  dto: CreateBrandProfileDto,
) {
  const existing = await this.prisma.brandProfile.findUnique({
    where: { userId },
  });

  if (existing) {
    throw new ConflictException('Brand profile already exists');
  }

  return this.prisma.brandProfile.create({
    data: {
      userId,
      brandName: dto.brandName,
      description: dto.description,
      industry: dto.industry,
      companySize: dto.companySize,
      contactEmail: dto.contactEmail,
      country: dto.country,
      websiteUrl: dto.websiteUrl,
    },
  });
}
async updateCreatorProfile(
  userId: string,
  dto: UpdateCreatorProfileDto,
) {
  const existing = await this.prisma.creatorProfile.findUnique({
    where: { userId },
  });

  if (!existing) {
    throw new NotFoundException('Creator profile not found');
  }

  return this.prisma.creatorProfile.update({
    where: { userId },
    data: {
      ...dto,
    },
  });
}
async updateBrandProfile(
  userId: string,
  dto: UpdateBrandProfileDto,
) {
  const existing = await this.prisma.brandProfile.findUnique({
    where: { userId },
  });

  if (!existing) {
    throw new NotFoundException('Brand profile not found');
  }

  return this.prisma.brandProfile.update({
    where: { userId },
    data: {
      ...dto,
    },
  });
}


}
