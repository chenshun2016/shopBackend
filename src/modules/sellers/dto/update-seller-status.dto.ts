import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { SellerStatus } from '../entities/seller.entity'; // 导入你的枚举

// 更新商家状态独立出来不能和更新接口写在一起是为了权限隔离
export class UpdateSellerStatusDto {
  @ApiProperty({ enum: SellerStatus, description: '商家状态' })
  @IsNotEmpty()
  @IsEnum(SellerStatus)
  status: SellerStatus;
}
