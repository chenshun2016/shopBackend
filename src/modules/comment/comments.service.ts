import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { Product } from '../products/entities/product.entity';
import { ProductsService } from '../products/products.service';
import {
  PaginationDto,
  PaginatedResult,
} from '../../common/dto/pagination.dto';

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
    const favorite = this.commentRepo.create({ userId, productId, remarks });
    return this.commentRepo.save(favorite);
  }

  // 取消评论
  async remove(userId: number, productId: number): Promise<void> {
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
    const list = comments.map((f) => f.product);
    return { list, total, page, limit };
  }
}
