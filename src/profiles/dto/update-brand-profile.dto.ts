import {
  IsEmail,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateBrandProfileDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  companySize?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  country?: string;
}
