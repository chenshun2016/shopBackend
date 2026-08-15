import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  UserPayload,
} from '../../common/decorators/current-user.decorator';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('评论')
@Controller('comments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post(':productId')
  @ApiOperation({ summary: '评论商品' })
  @ApiParam({ name: 'productId', description: '商品ID', type: Number })
  add(
    @CurrentUser() user: UserPayload,
    @Param('productId') productId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.add(user.userId, +productId, dto.remarks);
  }

  @Delete(':productId')
  @ApiOperation({ summary: '取消评论' })
  @ApiParam({ name: 'productId', description: '商品ID', type: Number })
  remove(
    @CurrentUser() user: UserPayload,
    @Param('productId') productId: string,
  ) {
    return this.commentsService.remove(user.userId, +productId);
  }

  @Get()
  @ApiOperation({ summary: '我的评论列表（分页）' })
  findAll(@CurrentUser() user: UserPayload, @Query() query: PaginationDto) {
    return this.commentsService.getMyComments(user.userId, query);
  }
}
