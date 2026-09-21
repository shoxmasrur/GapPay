import {
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
} from 'class-validator';

export class UserUpdateDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  fullName?: string;

  @IsOptional()
  @IsPhoneNumber('UZ')
  @IsNotEmpty()
  phone?: string;

  @IsOptional()
  @IsUrl()
  avatar?: string;
}
