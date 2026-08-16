import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RegionsService } from './regions.service';

@ApiTags('区域（公开）')
@Controller('regions')
export class RegionController {
  constructor(private readonly regionsService: RegionsService) {}

  @Get()
  @ApiOperation({ summary: '查看区域（不带 parentCode 返回省级，带则返回其下级）' })
  findAll(@Query('parentCode') parentCode?: string) {
    return this.regionsService.findByParentCode(parentCode);
  }
}
