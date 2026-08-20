import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BrandService } from './brand.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('分类')
@Controller('categories')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}
}
