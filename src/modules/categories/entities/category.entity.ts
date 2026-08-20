import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Brand } from '../../brand/entities/brand.entity';

@Entity('categories')
export class Category {
  @ApiProperty({ description: '分类ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '分类名称' })
  @Column({ length: 50, unique: true })
  name: string;

  @ApiProperty({ description: '分类描述', required: false })
  @Column({ length: 500, nullable: true })
  description: string;

  @ApiProperty({ description: '父分类ID', required: false })
  @Column({ name: 'parent_id', nullable: true })
  parentId: number;

  @ManyToOne(() => Category, (category) => category.children, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parent_id' })
  parent: Category;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn()
  updatedAt: Date;

  // 多对多关联分类（需要你已经有 Category 实体）
  @ManyToMany(() => Brand, (brand) => brand.categories)
  // @JoinTable({ // 一张表写即可？
  //   name: 'brand_category_relation',
  //   joinColumn: { name: 'category_id', referencedColumnName: 'id' },
  //   inverseJoinColumn: { name: 'brand_id', referencedColumnName: 'id' },
  // })
  brands: Brand[];
}
