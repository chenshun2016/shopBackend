import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  MaxLength,
  MinLength,
  IsPhoneNumber,
  IsOptional,
  IsInt,
} from 'class-validator';

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

  // 客户端可能携带 userId，这里放行；真正入库的 userId 以 JWT 登录用户为准（controller 里覆盖）
  @ApiProperty({ description: '商家id（可选，以登录用户为准）' })
  @IsOptional()
  @IsInt()
  userId?: number;
}
