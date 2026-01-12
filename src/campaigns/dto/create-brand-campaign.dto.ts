import {
  IsString,
  IsOptional,
  IsBoolean,
  IsIn,
  IsNumber,
  IsUrl,
  Min,
  Max,
} from 'class-validator'

export class CreateBrandCampaignDto {
  // ===============================
  // Core campaign info
  // ===============================

  @IsString()
  title: string

  @IsString()
  description: string

  @IsOptional()
  @IsString()
  requirements?: string

  // ===============================
  // Budget & payout engine
  // ===============================

  @IsOptional()
  @IsString()
  budget?: string // e.g. "₹5L total"

  @IsNumber()
  @Min(1000)
  totalBudget: number // e.g. 500000



  // ===============================
  // Brand assets
  // ===============================

  @IsOptional()
  @IsUrl()
  googleDriveLink?: string

  @IsOptional()
  @IsUrl()
  megaLink?: string

  @IsOptional()
  @IsUrl()
  youtubeLink?: string

  @IsOptional()
  @IsUrl()
  instagramLink?: string

  @IsOptional()
  @IsString()
  otherLinks?: string

  // ===============================
  // Participation rules
  // ===============================

  @IsOptional()
  @IsBoolean()
  requiresCreatorApproval?: boolean

  @IsOptional()
  @IsIn(['OPEN', 'VERIFIED_ONLY'])
  applicationRequirement?: 'OPEN' | 'VERIFIED_ONLY'

  @IsOptional()
  @IsIn(['OPEN', 'APPROVAL_REQUIRED'])
  participationType?: 'OPEN' | 'APPROVAL_REQUIRED'
}
