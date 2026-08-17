// src/modules/address/dto/create-address.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsPhoneNumber,
  IsOptional,
  IsEnum,
  IsNumber,
  MaxLength,
  MinLength,
  IsIn,
  IsObject,
} from 'class-validator';
import { AddressLabel, AddressType } from '../entities/address.entities';

export class CreateAddressDto {
  @ApiProperty({ description: '收货人姓名', maxLength: 20, example: '张三' })
  @IsString()
  @MinLength(1, { message: '收货人姓名不能为空' })
  @MaxLength(20, { message: '收货人姓名不能超过20个字符' })
  consignee: string;

  @ApiProperty({ description: '手机号', example: '13800138000' })
  @IsPhoneNumber('CN', { message: '请输入有效的手机号' })
  mobile: string;

  @ApiProperty({
    description: '备用手机号',
    required: false,
    example: '13900139000',
  })
  @IsOptional()
  @IsPhoneNumber('CN', { message: '请输入有效的备用手机号' })
  phoneBackup?: string;

  @ApiProperty({ description: '省份ID', required: false })
  @IsOptional()
  @IsNumber()
  provinceId?: number;

  @ApiProperty({ description: '省份名称', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  provinceName?: string;

  @ApiProperty({ description: '城市ID', required: false })
  @IsOptional()
  @IsNumber()
  cityId?: number;

  @ApiProperty({ description: '城市名称', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  cityName?: string;

  @ApiProperty({ description: '区县ID', required: false })
  @IsOptional()
  @IsNumber()
  districtId?: number;

  @ApiProperty({ description: '区县名称', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  districtName?: string;

  @ApiProperty({
    description: '详细地址',
    maxLength: 200,
    example: '中关村大街1号A座101室',
  })
  @IsString()
  @MinLength(1, { message: '详细地址不能为空' })
  @MaxLength(200, { message: '详细地址不能超过200个字符' })
  addressDetail: string;

  @ApiProperty({ description: '邮政编码', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  postalCode?: string;

  @ApiProperty({ description: '纬度', required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ description: '经度', required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({
    description: '地址标签',
    enum: AddressLabel,
    default: AddressLabel.OTHER,
  })
  @IsEnum(AddressLabel)
  @IsOptional()
  label?: AddressLabel;

  @ApiProperty({
    description: '地址类型',
    enum: AddressType,
    default: AddressType.DOMESTIC,
  })
  @IsEnum(AddressType)
  @IsOptional()
  type?: AddressType;

  @ApiProperty({ description: '是否设为默认地址', default: false })
  @IsOptional()
  @IsIn([0, 1])
  isDefault?: number;

  @ApiProperty({ description: '地址别名', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  alias?: string;

  @ApiProperty({ description: '扩展信息', required: false })
  @IsOptional()
  @IsObject()
  extra?: Record<string, any>;
}
