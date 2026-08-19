import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength, IsPhoneNumber } from 'class-validator';

export class CreateSellerDto {
  @ApiProperty({ description: '商店名称', example: '喜德盛山地车' })
  @MinLength(4)
  @MaxLength(20)
  @IsString()
  shopName: string;

  @ApiProperty({ description: '联系电话', example: '18820128820' })
  @IsString() // 1. 必须是字符串
  @IsPhoneNumber('CN') // 2. 必须是中国大陆手机号格式 (自动校验 11 位)
  contactPhone: string;

  // @ApiProperty({ description: '商家id' })
  // userId: number;
}
