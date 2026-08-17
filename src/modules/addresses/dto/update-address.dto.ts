// src/modules/address/dto/update-address.dto.ts
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateAddressDto } from './create-address.dto';
import { IsOptional, IsNumber, IsIn } from 'class-validator';

// ✅ 继承 CreateAddressDto，所有字段变为可选
export class UpdateAddressDto extends PartialType(CreateAddressDto) {
  @ApiProperty({ description: '地址ID', required: true })
  @IsNumber()
  id: number;

  // 可以重写某些字段，添加更新特有的验证
  @ApiProperty({ description: '是否设为默认地址', required: false })
  @IsOptional()
  @IsIn([0, 1])
  isDefault?: number;

  // 可以添加更新特有的字段，比如版本号（乐观锁）
  @ApiProperty({ description: '版本号（乐观锁）', required: false })
  @IsOptional()
  @IsNumber()
  version?: number;
}
