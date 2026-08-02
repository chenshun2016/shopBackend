import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsIn,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryProductDto extends PaginationDto {
  @ApiPropertyOptional({ description: '关键词搜索', example: '手机' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: '分类ID', example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  categoryId?: number;

  @ApiPropertyOptional({ description: '最低价格', example: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({ description: '最高价格', example: 1000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({
    description: '排序字段',
    enum: ['price', 'createdAt', 'name'],
    example: 'createdAt',
  })
  @Transform(({ value }: { value: unknown }) =>
    value === '' ? undefined : value,
  )
  @IsString()
  @IsIn(['price', 'createdAt', 'name'])
  @IsOptional()
  sortBy?: 'price' | 'createdAt' | 'name' = 'createdAt';

  @ApiPropertyOptional({
    description: '排序方向',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @Transform(({ value }: { value: unknown }) =>
    value === '' ? undefined : value,
  )
  @IsString()
  @IsIn(['asc', 'desc'])
  @IsOptional()
  order?: 'asc' | 'desc' = 'desc';
}
