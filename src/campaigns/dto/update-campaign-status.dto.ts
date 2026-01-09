import { IsEnum } from 'class-validator';

enum CampaignStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export class UpdateCampaignStatusDto {
  @IsEnum(CampaignStatus)
  status: CampaignStatus;
}
