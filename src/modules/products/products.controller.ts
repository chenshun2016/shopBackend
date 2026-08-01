import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { QueryProductDto } from './dto/query-product.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('商品（公开）')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: '商品列表（分页+搜索+分类筛选+价格区间+排序）' })
  findAll(@Query() query: QueryProductDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: '商品详情' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }
}
