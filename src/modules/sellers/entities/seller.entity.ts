import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
// seller.entity.ts（主表）

export enum SellerStatus {
  PENDING = 0, // 待审核（入驻申请提交，等待运营审核）
  REJECTED = 1, // 已驳回（审核不通过，需重新提交资料）
  ACTIVE = 2, // 营业中（正常营业，商品可展示和售卖）
  FROZEN = 3, // 已冻结（违规/欠费等原因，暂时限制营业）
  CLOSED = 4, // 已关闭（主动关店或长期不经营）
}
@Entity('seller')
export class Seller {
  @ApiProperty({ description: '主键自动产生' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '商家id' })
  @Column({ name: 'user_id' })
  userId: number;

  @ApiProperty({ description: '店铺名' })
  @Column({ name: 'shop_name' })
  shopName: string;

  @ApiPropertyOptional({ description: '店铺logo' })
  @Column({ name: 'shop_logo', nullable: true })
  shopLogo: string;

  @ApiProperty({ description: '联系电话' })
  @Column({ name: 'contact_phone', nullable: true })
  contactPhone: string;

  @ApiPropertyOptional({ description: '商家状态', enum: SellerStatus })
  @Column({ type: 'tinyint', default: 2 })
  status: number;

  @ApiPropertyOptional({ description: '平均分' })
  @Column({ name: 'avg_rating', type: 'decimal', default: 0 })
  avgRating: number;

  @ApiPropertyOptional({ description: '销售总额' })
  @Column({ name: 'total_sales', default: 0 })
  totalSales: number;

  @ApiPropertyOptional({ description: '创建日期' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiPropertyOptional({ description: '更新日期' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: '逻辑删除标记：0-未删除，1-已删除',
    example: 0,
    default: 0,
  })
  @Exclude() // 序列化时自动排除，不返回给前端
  @Column({
    name: 'is_deleted',
    type: 'tinyint',
    nullable: false,
    default: 0,
    comment: '逻辑删除标记：0-未删除，1-已删除',
  })
  isDeleted: number;
}
