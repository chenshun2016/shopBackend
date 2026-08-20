import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';

export enum BrandStatus {
  PENDING = 0, // 待审核
  APPROVED = 1, // 已上架
  REJECTED = 2, // 已驳回
  OFFLINE = 3, // 已下架
}

@Entity('brand')
@Index(['status', 'deletedAt']) // 复合索引，优化前台查询
export class Brand {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nameEn: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logoUrl: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  website: string;

  // 状态字段
  @Column({ type: 'tinyint', default: BrandStatus.PENDING })
  status: BrandStatus;

  @Column({ type: 'varchar', length: 200, nullable: true })
  auditRemark: string;

  @Column({ type: 'datetime', nullable: true })
  auditTime: Date;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  auditorId: number;

  // 操作人追踪
  @Column({ type: 'bigint', unsigned: true })
  createdBy: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  updatedBy: number;

  // 时间戳
  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deletedAt: Date;

  // 多对多关联分类（需要你已经有 Category 实体）
  @ManyToMany(() => Category, (category) => category.brands)
  @JoinTable({
    name: 'brand_category_relation',
    joinColumn: { name: 'brand_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categories: Category[];
}
