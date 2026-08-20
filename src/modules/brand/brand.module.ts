import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brand } from './entities/brand.entity';
import { Category } from '../categories/entities/category.entity';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Brand, Category])],
  controllers: [BrandController],
  providers: [BrandService],
  exports: [BrandService],
})
export class BrandModule {}
