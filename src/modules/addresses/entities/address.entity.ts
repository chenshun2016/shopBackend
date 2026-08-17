// src/modules/address/entities/address.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import {
  IsString,
  IsPhoneNumber,
  IsOptional,
  IsEnum,
  IsNumber,
  MaxLength,
  MinLength,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AddressLabel {
  HOME = 'home',
  COMPANY = 'company',
  SCHOOL = 'school',
  OTHER = 'other',
}

export enum AddressType {
  DOMESTIC = 'domestic',
  OVERSEAS = 'overseas',
}

@Entity('user_address')
@Index(['userId', 'isDefault'])
@Index(['userId', 'deletedAt'])
export class Address {
  @ApiProperty({ description: '地址ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '是否默认' })
  @Column({
    type: 'tinyint',
    default: 0,
    comment: '是否默认地址：0-否 1-是',
  })
  @IsOptional()
  @IsIn([0, 1]) // 验证：只能是 0 或 1
  isDefault: number;

  @ApiProperty({ description: '用户ID' })
  @Column()
  @Index()
  userId: number;

  @ManyToOne(() => User, (user) => user.addresses, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ description: '收货人姓名', maxLength: 20 })
  @Column({ type: 'varchar', length: 20 })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  consignee: string;

  @ApiProperty({ description: '手机号' })
  @Column({ type: 'varchar', length: 20 })
  @IsPhoneNumber('CN') // 支持国际号码验证
  mobile: string;

  @ApiProperty({ description: '备用手机号', required: false })
  @Column({ type: 'varchar', length: 20, nullable: true })
  @IsOptional()
  @IsPhoneNumber('CN')
  phoneBackup?: string;

  @ApiProperty({ description: '省份ID', required: false })
  @Column({ type: 'int', nullable: true })
  @IsOptional()
  @IsNumber()
  provinceId?: number;

  @ApiProperty({ description: '省份名称', required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  @MaxLength(50)
  provinceName?: string;

  @ApiProperty({ description: '城市ID', required: false })
  @Column({ type: 'int', nullable: true })
  @IsOptional()
  @IsNumber()
  cityId?: number;

  @ApiProperty({ description: '城市名称', required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  @MaxLength(50)
  cityName?: string;

  @ApiProperty({ description: '区县ID', required: false })
  @Column({ type: 'int', nullable: true })
  @IsOptional()
  @IsNumber()
  districtId?: number;

  @ApiProperty({ description: '区县名称', required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  @MaxLength(50)
  districtName?: string;

  @ApiProperty({ description: '详细地址', maxLength: 200 })
  @Column({ type: 'varchar', length: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  addressDetail: string;

  @ApiProperty({ description: '邮政编码', required: false })
  @Column({ type: 'varchar', length: 10, nullable: true })
  @IsOptional()
  @MaxLength(10)
  postalCode?: string;

  @ApiProperty({ description: '纬度', required: false })
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
    transformer: {
      // 双向兜底：NaN/null/undefined 一律转 null，否则 mysql2 对 decimal 列输出字面量 NaN 导致 SQL 报错
      to: (value?: number) =>
        value == null || Number.isNaN(value) ? null : value,
      from: (value: string | null) =>
        value == null ? null : parseFloat(value),
    },
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ description: '经度', required: false })
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
    transformer: {
      to: (value?: number) =>
        value == null || Number.isNaN(value) ? null : value,
      from: (value: string | null) =>
        value == null ? null : parseFloat(value),
    },
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({
    description: '地址标签',
    enum: AddressLabel,
    default: AddressLabel.OTHER,
  })
  @Column({
    type: 'enum',
    enum: AddressLabel,
    default: AddressLabel.OTHER,
  })
  @IsEnum(AddressLabel)
  label: AddressLabel;

  @ApiProperty({
    description: '地址类型',
    enum: AddressType,
    default: AddressType.DOMESTIC,
  })
  @Column({
    type: 'enum',
    enum: AddressType,
    default: AddressType.DOMESTIC,
  })
  @IsEnum(AddressType)
  type: AddressType;

  @ApiProperty({ description: '地址别名', required: false })
  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  @MaxLength(50)
  alias?: string;

  @ApiProperty({ description: '扩展信息', required: false })
  @Column({ type: 'json', nullable: true })
  @IsOptional()
  extra?: Record<string, any>;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ type: 'datetime' })
  createTime: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ type: 'datetime' })
  updateTime: Date;

  @ApiProperty({ description: '删除时间（软删除）', required: false })
  @Column({ type: 'datetime', nullable: true })
  deletedAt?: Date;

  // 生命周期钩子：插入前验证
  @BeforeInsert()
  @BeforeUpdate()
  validateDefaultAddress() {
    // 如果设置为默认地址，确保没有其他字段冲突
    if (this.isDefault === 1) {
      // 注意：这里只是示例，实际的唯一性控制需要在Service层或数据库唯一索引实现
    }
  }

  // 业务方法：获取完整地址
  getFullAddress(): string {
    const parts = [
      this.provinceName,
      this.cityName,
      this.districtName,
      this.addressDetail,
    ].filter(Boolean);
    return parts.join('');
  }

  // 业务方法：判断是否为完整地址
  isComplete(): boolean {
    return !!(this.consignee && this.mobile && this.addressDetail);
  }

  // 业务方法：脱敏手机号
  getMaskedMobile(): string {
    if (!this.mobile || this.mobile.length < 11) return this.mobile;
    return this.mobile.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }
}
