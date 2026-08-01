import { Module } from '@nestjs/common';
import { AdminProductsController } from './admin-products.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminCategoriesController } from './admin-categories.controller';
import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [ProductsModule, OrdersModule, CategoriesModule],
  controllers: [
    AdminProductsController,
    AdminOrdersController,
    AdminCategoriesController,
  ],
})
export class AdminModule {}
