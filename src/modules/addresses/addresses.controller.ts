import { Controller, Get, Put, Body, UseGuards, Post, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  UserPayload,
} from '../../common/decorators/current-user.decorator';
import { AddressesService } from './addresses.service';
import { UpdateAddressDto } from './dto/update-address.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { BatchDeleteAddressDto } from './dto/batch-delete-address.dto';

@ApiTags('用户地址')
@Controller('address')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class AddressController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @ApiOperation({ summary: '新增地址' })
  createAddress(@CurrentUser() user: UserPayload, @Body() dto: CreateAddressDto){
    return this.addressesService.createAddress(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: '获取用户地址' })
  getAddresses(@CurrentUser() user: UserPayload) {
    return this.addressesService.findById(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取用户地址详情' })
  getUserAddressDetail(@CurrentUser() user: UserPayload, @Query('id') id: string){
    return this.addressesService.getAddressDetail(user.userId, dto);
  }

  @Put()
  @ApiOperation({ summary: '修改地址' })
  update(@CurrentUser() user: UserPayload, @Body() dto: UpdateAddressDto) {
    return this.addressesService.update(user.userId, dto);
  }

  @Delete()
  @ApiOperation({ summary: '删除地址' })
  delete(@CurrentUser() user: UserPayload, @Query('id') id: string) {
    return this.addressesService.delete(user.id, id);
  }

  @Delete('batch')
  @ApiOperation({ summary: '批量删除地址' })
  batchDelete(@CurrentUser() user: UserPayload, @Body() dto: BatchDeleteAddressDto){
    return this.addressesService.batchDelete(user.id, dto);
  }
}
