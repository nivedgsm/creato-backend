import {
  IsString,
  IsOptional,
  IsBoolean,
  IsIn,
  IsNumber,
  IsUrl,
} from 'class-validator';

export class CreateBrandCampaignDto {
  // ===============================
  // Core campaign info
  // ===============================

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  requirements?: string;

  // ===============================
  // Budget & payout
  // ===============================

  /**
   * Human-readable budget (e.g. "₹50,000 – ₹1,00,000")
   * Optional display field
   */
  @IsOptional()
  @IsString()
  budget?: string;

  /**
   * Numeric payout model
   */
  @IsOptional()
  @IsNumber()
  payoutPer100kViews?: number;

  @IsOptional()
  @IsNumber()
  totalBudget?: number;

  // ===============================
  // Brand assets
  // ===============================

  @IsOptional()
  @IsUrl()
  googleDriveLink?: string;

  // ===============================
  // Participation rules
  // ===============================

  @IsOptional()
  @IsBoolean()
  requiresCreatorApproval?: boolean;

  @IsOptional()
  @IsIn(['OPEN', 'VERIFIED_ONLY'])
  applicationRequirement?: 'OPEN' | 'VERIFIED_ONLY';

  @IsOptional()
  @IsIn(['OPEN', 'APPROVAL_REQUIRED'])
  participationType?: 'OPEN' | 'APPROVAL_REQUIRED';
}
