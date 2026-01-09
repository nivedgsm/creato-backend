import {
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateCreatorProfileDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  primaryPlatform?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  followersCount?: number;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  language?: string;
}
