import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'; // 注意用 Optional
import {
  IsString,
  MaxLength,
  MinLength,
  IsPhoneNumber,
  IsOptional,
} from 'class-validator';

export class UpdateSellerDto {
  @ApiPropertyOptional({ description: '商店名称', example: '喜德盛山地车' }) // Optional
  @MinLength(4)
  @MaxLength(20)
  @IsString()
  @IsOptional() // 加上这个，更新时不传就不会校验报错
  shopName?: string;

  @ApiPropertyOptional({ description: '联系电话', example: '18820128820' })
  @IsString()
  @IsPhoneNumber('CN')
  @IsOptional()
  contactPhone?: string;
}
