import { Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RegionsService } from './regions.service';

@ApiTags('区域（公开）')
export class RegionController {
  constructor(private readonly RegionsService: RegionsService) {}

  @Get()
  @ApiOperation({ summary: '查看区域' })
  findAll(@Query('parentCode') parentCode: number = 0) {
    return this.RegionsService.findByParentCode(parentCode);
  }
}
