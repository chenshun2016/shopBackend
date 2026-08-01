import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: '分类名称', example: '电子产品' })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({
    description: '分类描述',
    example: '手机、电脑、数码配件',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: '父分类ID', example: 1 })
  @IsOptional()
  @IsInt()
  parentId?: number;
}
