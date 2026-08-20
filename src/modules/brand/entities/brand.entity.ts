import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToMany,
  JoinTable,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Category } from '../../categories/entities/category.entity';

export enum BrandStatus {
  PENDING = 0, // 待审核
  APPROVED = 1, // 已上架
  REJECTED = 2, // 已驳回
  OFFLINE = 3, // 已下架
}

@Entity('brand')
export class Brand {
  @ApiProperty({ description: '品牌ID（主键，自增）', example: 1 })
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
    comment: '品牌ID，主键自增',
  })
  id: number;

  // ==================== 基本信息 ====================

  @ApiProperty({
    description: '品牌名称（中英文均可，全局唯一）',
    example: '华为',
  })
  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    comment: '品牌名称，全局唯一，用于前台展示和搜索',
  })
  name: string;

  @ApiProperty({
    description: '品牌层级',
    example: '0',
  })
  @Column({
    type: 'int',
    default: 0,
    comment: '层级深度，根节点为0',
  })
  level: number;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '路径枚举，如 /1/2/，用于快速查询所有子孙',
  })
  path: string;

  @ApiProperty({
    description: '品牌英文名（便于国际化展示）',
    required: false,
    example: 'Huawei',
  })
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: '品牌英文名称，用于多语言场景',
  })
  nameEn: string;

  @ApiProperty({
    description: '品牌Logo图片地址（CDN链接）',
    required: false,
    example: 'https://cdn.example.com/huawei.png',
  })
  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '品牌Logo的CDN存储地址，用于前台展示',
  })
  logoUrl: string;

  @ApiProperty({
    description: '品牌简介/品牌故事',
    required: false,
    example: '全球领先的ICT基础设施和智能终端提供商',
  })
  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '品牌简介，用于品牌详情页展示',
  })
  description: string;

  @ApiProperty({
    description: '品牌官网地址',
    required: false,
    example: 'https://www.huawei.com',
  })
  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
    comment: '品牌官方网站链接',
  })
  website: string;

  // ==================== 状态与审核 ====================

  @ApiProperty({
    description: '品牌状态：0-待审核，1-已上架，2-已驳回，3-已下架',
    enum: BrandStatus,
    default: BrandStatus.PENDING,
    example: BrandStatus.APPROVED,
  })
  @Column({
    type: 'tinyint',
    default: BrandStatus.PENDING,
    comment: '品牌审核状态：0待审核/1已上架/2已驳回/3已下架',
  })
  status: BrandStatus;

  @ApiProperty({
    description: '审核备注（驳回原因填写于此）',
    required: false,
    example: '商标注册证不清晰，请重新上传',
  })
  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
    comment: '审核备注：审核通过时可为空，驳回时必填驳回原因',
  })
  auditRemark: string;

  @ApiProperty({
    description: '审核时间',
    required: false,
    example: '2026-08-20 14:30:00',
  })
  @Column({
    type: 'datetime',
    nullable: true,
    comment: '审核操作时间，审核通过或驳回时自动记录',
  })
  auditTime: Date;

  @ApiProperty({
    description: '审核人ID（关联管理员表）',
    required: false,
    example: 10001,
  })
  @Column({
    type: 'bigint',
    unsigned: true,
    nullable: true,
    comment: '审核人ID，关联管理员表，用于追溯谁审核的',
  })
  auditorId: number;

  // ==================== 操作人追踪 ====================

  @ApiProperty({ description: '创建人ID（关联管理员表）', example: 10001 })
  @Column({
    type: 'bigint',
    unsigned: true,
    comment: '品牌创建人ID，记录是谁添加的品牌（运营/管理员）',
  })
  createdBy: number;

  @ApiProperty({
    description: '最后更新人ID（关联管理员表）',
    required: false,
    example: 10002,
  })
  @Column({
    type: 'bigint',
    unsigned: true,
    nullable: true,
    comment: '品牌最后更新人ID，记录是谁最后一次修改了品牌信息',
  })
  updatedBy: number;

  // ==================== 时间戳 ====================

  @ApiProperty({ description: '创建时间', example: '2026-08-20 10:00:00' })
  @CreateDateColumn({
    type: 'datetime',
    comment: '品牌创建时间，自动记录',
  })
  createdAt: Date;

  @ApiProperty({ description: '最后更新时间', example: '2026-08-20 15:30:00' })
  @UpdateDateColumn({
    type: 'datetime',
    comment: '品牌最后更新时间，每次更新自动修改',
  })
  updatedAt: Date;

  @ApiProperty({
    description: '软删除时间（NULL表示未删除）',
    required: false,
    example: '2026-08-20 18:00:00',
  })
  @DeleteDateColumn({
    type: 'datetime',
    nullable: true,
    comment: '软删除时间：非NULL表示已删除，用于保留历史数据不物理删除',
  })
  deletedAt: Date;

  // ==================== 多对多关联 ====================

  @ApiProperty({
    description: '关联的分类列表（多对多，一个品牌可属于多个分类）',
    type: () => Category,
    isArray: true,
    required: false,
  })
  @ManyToMany(() => Category, (category) => category.brands)
  @JoinTable({
    name: 'brand_category_relation',
    joinColumn: {
      name: 'brand_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'category_id',
      referencedColumnName: 'id',
    },
  })
  categories: Category[];

  @ApiProperty({
    description: '父品牌ID（NULL表示顶级品牌）',
    required: false,
    example: 1,
  })
  @Column({
    type: 'bigint',
    unsigned: true,
    nullable: true,
    default: 0, // ✅ 默认值为 0
    comment: '父品牌ID，NULL表示根节点，用于实现品牌树形层级',
  })
  parentId: number;

  // 可选：关联自身（方便查询时加载父/子）
  @ManyToOne(() => Brand, (brand) => brand.children)
  @JoinColumn({ name: 'parentId' })
  parent: Brand;

  @OneToMany(() => Brand, (brand) => brand.parent)
  children: Brand[];
}
