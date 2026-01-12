import { IsInt, Min } from 'class-validator'

export class CreateCampaignSlabDto {
  @IsInt()
  @Min(1)
  views: number

  @IsInt()
  @Min(1)
  payout: number
}
