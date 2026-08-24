import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
// import { Product } from '../products/entities/product.entity';
import { ProductsService } from '../products/products.service';
import {
  PaginationDto,
  PaginatedResult,
} from '../../common/dto/pagination.dto';
import { logOperation } from 'src/common/logger/file-logger';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    private readonly productsService: ProductsService,
  ) {}

  // 添加评论
  async add(
    userId: number,
    productId: number,
    remarks: string,
  ): Promise<Comment> {
    try {
      const comment = await this.addInternal(userId, productId, remarks);
      logOperation({
        module: 'comment',
        operation: 'add',
        operatorId: userId,
        targetId: comment.id,
        targetName: remarks.slice(0, 50), // 日志只保留评论前50字，防止日志行过长
        success: true,
        message: `productId=${productId}`,
      });
      return comment;
    } catch (error) {
      logOperation({
        module: 'comment',
        operation: 'add',
        operatorId: userId,
        success: false,
        message: `productId=${productId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
      throw error;
    }
  }

  private async addInternal(
    userId: number,
    productId: number,
    remarks: string,
  ): Promise<Comment> {
    const product = await this.productsService.findOne(productId);
    if (!product.isActive) {
      throw new BadRequestException('商品已下架');
    }
    const existing = await this.commentRepo.findOne({
      where: { userId, productId },
    });
    if (existing) {
      return existing;
    }
    const comment = this.commentRepo.create({ userId, productId, remarks });
    return this.commentRepo.save(comment);
  }

  // 取消评论
  async remove(userId: number, productId: number): Promise<void> {
    try {
      await this.removeInternal(userId, productId);
      logOperation({
        module: 'comment',
        operation: 'delete',
        operatorId: userId,
        success: true,
        message: `productId=${productId}`,
      });
    } catch (error) {
      logOperation({
        module: 'comment',
        operation: 'delete',
        operatorId: userId,
        success: false,
        message: `productId=${productId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
      throw error;
    }
  }

  private async removeInternal(
    userId: number,
    productId: number,
  ): Promise<void> {
    await this.productsService.findOne(productId);
    await this.commentRepo.delete({ userId, productId });
  }

  // 获取个人评论列表
  async getMyComments(
    userId: number,
    { page = 1, limit = 10 }: PaginationDto,
  ): Promise<PaginatedResult<Comment>> {
    const qb = this.commentRepo
      .createQueryBuilder('c')
      .innerJoinAndSelect('c.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .where('c.userId = :userId', { userId })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .orderBy('c.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [comments, total] = await qb.getManyAndCount();
    return { list: comments, total, page, limit };
  }
}
