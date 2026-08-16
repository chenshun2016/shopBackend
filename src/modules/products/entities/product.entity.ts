import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Category } from '../../categories/entities/category.entity';
import { Comment } from '../../comment/entities/comment.entity';

@Entity('products')
@Index('ft_name_desc', ['name', 'description'], { fulltext: true })
export class Product {
  @ApiProperty({ description: '商品ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '商品名称' })
  @Column({ length: 200 })
  name: string;

  @ApiProperty({ description: '商品描述', required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ description: '价格' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ApiProperty({ description: '库存' })
  @Column({ default: 0 })
  stock: number;

  @ApiProperty({ description: '主图URL', required: false })
  @Column({ length: 500, nullable: true })
  imageUrl: string;

  @ApiProperty({ description: '所属分类ID' })
  @Column()
  categoryId: number;

  @ManyToOne(() => Category, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => Comment, (comment) => comment.product)
  comments: Comment[];

  @ApiProperty({ description: '是否上架' })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn()
  updatedAt: Date;
}
