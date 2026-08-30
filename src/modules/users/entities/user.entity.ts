import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Address } from 'src/modules/addresses/entities/address.entity';

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @ApiProperty({ description: '用户ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '用户名' })
  @Column({ length: 50, unique: true })
  username: string;

  @ApiProperty({ description: '邮箱', nullable: true })
  @Column({ length: 100, unique: true, nullable: true })
  email: string;

  @ApiProperty({
    description: '手机号',
    example: '13800138000',
    nullable: true,
  })
  @Column({ length: 20, unique: true, nullable: true })
  phone: string;

  @OneToMany(() => Address, (address) => address.user)
  addresses: Address[]; // 这里必须是 Address[] 类型，不能是 any

  @Column({ name: 'password_hash', length: 255, select: false, nullable: true })
  passwordHash: string;

  @ApiProperty({ description: '角色', enum: UserRole })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn()
  updatedAt: Date;
}
