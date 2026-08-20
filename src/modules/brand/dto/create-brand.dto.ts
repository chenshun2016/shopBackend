import {
  IsString,
  IsOptional,
  IsUrl,
  MaxLength,
  IsArray,
  IsNumber,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * 创建品牌 DTO
 * 运营/管理员提交品牌申请时使用
 */
export class CreateBrandDto {
  @ApiProperty({
    description: '品牌名称（中英文均可，全局唯一）',
    example: '华为',
    maxLength: 100,
  })
  @IsString({ message: '品牌名称必须为字符串' })
  @MaxLength(100, { message: '品牌名称不能超过100个字符' })
  name: string;

  @ApiProperty({
    description: '品牌英文名称（用于国际化展示）',
    example: 'Huawei',
    maxLength: 100,
    required: false,
  })
  @IsString({ message: '品牌英文名必须为字符串' })
  @MaxLength(100, { message: '品牌英文名不能超过100个字符' })
  @IsOptional()
  nameEn?: string;

  @ApiProperty({
    description: '品牌Logo图片地址（CDN链接）',
    example: 'https://cdn.example.com/huawei.png',
    required: false,
  })
  @IsUrl({}, { message: 'Logo地址必须是有效的URL格式' })
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({
    description: '品牌简介/品牌故事',
    example: '全球领先的ICT基础设施和智能终端提供商',
    maxLength: 500,
    required: false,
  })
  @IsString({ message: '品牌简介必须为字符串' })
  @MaxLength(500, { message: '品牌简介不能超过500个字符' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: '品牌官网地址',
    example: 'https://www.huawei.com',
    required: false,
  })
  @IsUrl({}, { message: '官网地址必须是有效的URL格式' })
  @IsOptional()
  website?: string;

  @ApiProperty({
    description: '关联的分类ID列表（可选，创建后可补充）',
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
