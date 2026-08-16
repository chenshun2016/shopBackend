import { Entity, PrimaryColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('regions')
export class Region {
  @ApiProperty({ description: '行政区划代码（省2位/市4位/区6位）' })
  @PrimaryColumn({ length: 12 })
  code: string;

  @ApiProperty({ description: '名称' })
  @Column({ length: 50 })
  name: string;

  @ApiProperty({ description: '层级：1省 2市 3区 4街道' })
  @Column({ type: 'tinyint' })
  level: number;

  @ApiProperty({ description: '上级代码，省级为 null', required: false })
  @Column({ type: 'varchar', length: 12, name: 'parent_code', nullable: true })
  parentCode: string | null;
}
