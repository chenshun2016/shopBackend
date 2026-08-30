import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ServeStaticModule } from '@nestjs/serve-static';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { CartModule } from './modules/cart/cart.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { CommentsModule } from './modules/comment/comments.module';
import { RegionsModule } from './modules/regions/regions.module';
import { OrdersModule } from './modules/orders/orders.module';
import { AdminModule } from './modules/admin/admin.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { SellersModule } from './modules/sellers/sellers.module';
import { BrandModule } from './modules/brand/brand.module';
import { UploadModule } from './modules/upload/upload.module';
import { SmsModule } from './modules/sms/sms.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // 静态资源托管:浏览器可直接访问 /uploads/xxx.jpg
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST', '127.0.0.1'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get<string>('DB_USERNAME', 'root'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_DATABASE', 'ecommerce'),
        entities: [__dirname + '/**/*.entity.{ts,js}'],
        synchronize: config.get<string>('DB_SYNCHRONIZE', 'true') === 'true',
        logging:
          config.get<string>('NODE_ENV', 'development') === 'development',
        charset: 'utf8mb4',
        timezone: '+08:00',
      }),
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => ({
        stores: [new Keyv({ store: new KeyvRedis('redis://localhost:6379') })],
        ttl: 60000, // 默认 60 秒
      }),
    }),
    AuthModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    CartModule,
    FavoritesModule,
    CommentsModule,
    RegionsModule,
    OrdersModule,
    AdminModule,
    AddressesModule,
    SellersModule,
    BrandModule,
    UploadModule,
    SmsModule,
  ],
})
export class AppModule {}
