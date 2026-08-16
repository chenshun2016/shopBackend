import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';
import { Exclude, Expose } from 'class-transformer';

@Entity('comments')
@Unique('uk_user_product', ['userId', 'productId'])
export class Comment {
  @ApiProperty({ description: '评论ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '用户ID' })
  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  @Exclude()
  user: User;

  @ApiProperty({ description: '商品ID' })
  @Column({ name: 'product_id' })
  productId: number;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ApiProperty({ description: '评论时间' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: '评论内容' })
  @Column({ name: 'remarks' })
  remarks: string;

  // ✅ 虚拟字段：把 username 提升到顶层
  @Expose()
  get username(): string {
    return this.user?.username;
  }
}
