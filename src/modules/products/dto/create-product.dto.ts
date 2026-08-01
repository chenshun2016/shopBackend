import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ description: '商品名称', example: '无线鼠标' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({
    description: '商品描述',
    example: '静音无线鼠标，2.4G连接，续航持久',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '价格', example: 99.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: '库存', default: 0, example: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({
    description: '主图URL',
    example: 'https://example.com/image.jpg',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ description: '分类ID', example: 1 })
  @IsInt()
  categoryId: number;
}
