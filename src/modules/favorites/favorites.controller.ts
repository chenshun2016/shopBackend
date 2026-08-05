import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  UserPayload,
} from '../../common/decorators/current-user.decorator';
import { FavoritesService } from './favorites.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('收藏')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':productId')
  @ApiOperation({ summary: '收藏商品' })
  @ApiParam({ name: 'productId', description: '商品ID', type: Number })
  add(@CurrentUser() user: UserPayload, @Param('productId') productId: string) {
    return this.favoritesService.add(user.userId, +productId);
  }

  @Delete(':productId')
  @ApiOperation({ summary: '取消收藏' })
  @ApiParam({ name: 'productId', description: '商品ID', type: Number })
  remove(
    @CurrentUser() user: UserPayload,
    @Param('productId') productId: string,
  ) {
    return this.favoritesService.remove(user.userId, +productId);
  }

  @Get()
  @ApiOperation({ summary: '我的收藏列表（分页）' })
  findAll(@CurrentUser() user: UserPayload, @Query() query: PaginationDto) {
    return this.favoritesService.getMyFavorites(user.userId, query);
  }
}
