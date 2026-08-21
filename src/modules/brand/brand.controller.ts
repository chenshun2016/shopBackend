import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BrandService } from './brand.service';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CreateBrandDto } from './dto/create-brand.dto';
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
    @Body() CreateBrandDto: CreateBrandDto,
    @CurrentUser() user: UserPayload,
  ) {
    console.log(CreateBrandDto, 'CreateBrandDto222');
    return this.brandService.createBrand(CreateBrandDto, user.userId);
  }
}
