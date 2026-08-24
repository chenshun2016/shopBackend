import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BrandService } from './brand.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import {
  CurrentUser,
  UserPayload,
} from 'src/common/decorators/current-user.decorator';

@ApiTags('品牌')
@Controller('brands')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Post('create')
  @ApiOperation({ summary: '创建品牌' })
  createBrand(
    @Body() createBrandDto: CreateBrandDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.brandService.createBrand(createBrandDto, user.userId);
  }

  @Post('update')
  @ApiOperation({ summary: '更新品牌' })
  updateBrand(
    @Body() updateBrandDto: UpdateBrandDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.brandService.updateBrand(updateBrandDto, user.userId);
  }

  @Get('getListByParentId')
  @ApiOperation({ summary: '通过parentId查询品牌，不传parentId默认为0' })
  getBrands(@Query('parentId') parentId: number) {
    return this.brandService.getBrandAll(parentId);
  }

  @Get('brandsTree')
  @ApiOperation({ summary: '查树形结构' })
  getBrandsTree() {
    return this.brandService.getBrandsTree();
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: '删除品牌' })
  delBrand(@Param('id', ParseIntPipe) id: number) {
    console.log(id, 'idsss');
    return this.brandService.deleteBrands(id);
  }
}
