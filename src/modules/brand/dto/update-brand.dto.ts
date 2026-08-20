import { PartialType } from '@nestjs/swagger';
import {
  IsOptional,
  IsArray,
  IsNumber,
  IsString,
  MaxLength,
  IsUrl,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateBrandDto } from './create-brand.dto';

/**
 * 更新品牌 DTO
 * 仅待审核/已驳回状态的品牌可编辑
 */
export class UpdateBrandDto extends PartialType(CreateBrandDto) {
  @ApiProperty({
    description: '品牌名称',
    example: '华为技术有限公司',
    maxLength: 100,
    required: false,
  })
  @IsString({ message: '品牌名称必须为字符串' })
  @MaxLength(100, { message: '品牌名称不能超过100个字符' })
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: '品牌英文名称',
    example: 'Huawei Technologies',
    maxLength: 100,
    required: false,
  })
  @IsString({ message: '品牌英文名必须为字符串' })
  @MaxLength(100, { message: '品牌英文名不能超过100个字符' })
  @IsOptional()
  nameEn?: string;

  @ApiProperty({
    description: '品牌Logo图片地址',
    example: 'https://cdn.example.com/huawei-new.png',
    required: false,
  })
  @IsUrl({}, { message: 'Logo地址必须是有效的URL格式' })
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({
    description: '品牌简介',
    example: '全球领先的ICT（信息与通信）基础设施提供商',
    maxLength: 500,
    required: false,
  })
  @IsString({ message: '品牌简介必须为字符串' })
  @MaxLength(500, { message: '品牌简介不能超过500个字符' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: '品牌官网地址',
    example: 'https://www.huawei.com/cn',
    required: false,
  })
  @IsUrl({}, { message: '官网地址必须是有效的URL格式' })
  @IsOptional()
  website?: string;

  @ApiProperty({
    description: '关联的分类ID列表（更新时会替换原有关联）',
    example: [1, 3, 5],
    type: [Number],
    required: false,
  })
  @IsArray({ message: '分类ID列表必须为数组' })
  @ArrayMinSize(1, { message: '至少选择一个分类' })
  @IsNumber({}, { each: true, message: '分类ID必须为数字' })
  @IsOptional()
  @Type(() => Number)
  categoryIds?: number[];
}
