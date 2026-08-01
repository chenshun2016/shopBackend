import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ description: '收货地址', example: '北京市朝阳区XX路100号' })
  @IsString()
  @MaxLength(500)
  shippingAddress: string;

  @ApiPropertyOptional({ description: '备注', example: '请尽快发货' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}
