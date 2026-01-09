import { IsBoolean, IsOptional, IsIn } from 'class-validator';

export class CreateCampaignDto {
  title: string;
  description: string;

  @IsOptional()
  @IsBoolean()
  requiresAdminApproval?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresCreatorApproval?: boolean;

  // 🔴 NEW — optional, non-breaking
  @IsOptional()
  @IsIn(['OPEN', 'APPROVAL_REQUIRED'])
  participationType?: 'OPEN' | 'APPROVAL_REQUIRED';
}
