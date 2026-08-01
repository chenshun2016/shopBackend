import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './modules/users/users.service';
import { CategoriesService } from './modules/categories/categories.service';
import { ProductsService } from './modules/products/products.service';
import { UserRole } from './modules/users/entities/user.entity';
import type { CreateCategoryDto } from './modules/categories/dto/create-category.dto';
import * as bcrypt from 'bcrypt';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const usersService = app.get(UsersService);
  const categoriesService = app.get(CategoriesService);
  const productsService = app.get(ProductsService);

  // 1. Create admin user
  try {
    const adminPassword = await bcrypt.hash('admin123', 10);
    await usersService.create({
      username: 'admin',
      email: 'admin@shop.com',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
    });
    console.log('✅ Admin user created (admin / admin123)');
  } catch {
    console.log('ℹ️  Admin user already exists');
  }

  // 2. Create test user
  try {
    const userPassword = await bcrypt.hash('123456', 10);
    await usersService.create({
      username: 'testuser',
      email: 'test@shop.com',
      passwordHash: userPassword,
      role: UserRole.CUSTOMER,
    });
    console.log('✅ Test user created (testuser / 123456)');
  } catch {
    console.log('ℹ️  Test user already exists');
  }

  // 3. Create categories
  const categories: CreateCategoryDto[] = [
    { name: '电子产品', description: '手机、电脑、数码配件' },
    { name: '服装鞋帽', description: '男装、女装、童装、鞋类' },
    { name: '食品饮料', description: '零食、饮品、生鲜' },
    { name: '家居生活', description: '家具、厨具、日用品' },
    { name: '图书音像', description: '书籍、音乐、影视' },
  ];

  const createdCategories: Array<{ id: number; name: string }> = [];
  for (const cat of categories) {
    try {
      const created = await categoriesService.create(cat);
      createdCategories.push(created);
      console.log(`✅ Category created: ${cat.name}`);
    } catch {
      console.log(`ℹ️  Category already exists: ${cat.name}`);
    }
  }

  // Fetch existing categories if none were created
  const allCategories =
    createdCategories.length > 0
      ? createdCategories
      : await categoriesService.findAll();

  // 4. Create sample products
  if (allCategories.length > 0) {
    const products: Array<{
      name: string;
      description: string;
      price: number;
      stock: number;
      categoryId: number;
      imageUrl: string;
    }> = [
      {
        name: 'iPhone 15 Pro',
        description: 'Apple A17 Pro 芯片，钛金属设计，4800万像素主摄',
        price: 8999,
        stock: 100,
        categoryId: allCategories[0]?.id || 1,
        imageUrl: 'https://via.placeholder.com/400x400?text=iPhone15',
      },
      {
        name: 'MacBook Air M3',
        description: '13.6英寸 Liquid Retina 显示屏，M3芯片，18小时续航',
        price: 10999,
        stock: 50,
        categoryId: allCategories[0]?.id || 1,
        imageUrl: 'https://via.placeholder.com/400x400?text=MacBookAir',
      },
      {
        name: '无线蓝牙耳机',
        description: '主动降噪，续航30小时，IPX5防水',
        price: 299,
        stock: 200,
        categoryId: allCategories[0]?.id || 1,
        imageUrl: 'https://via.placeholder.com/400x400?text=Headphones',
      },
      {
        name: '纯棉T恤',
        description: '100%纯棉，透气舒适，多色可选',
        price: 99,
        stock: 500,
        categoryId: allCategories[1]?.id || 2,
        imageUrl: 'https://via.placeholder.com/400x400?text=TShirt',
      },
      {
        name: '休闲运动鞋',
        description: '轻便缓震，适合日常穿着和轻度运动',
        price: 299,
        stock: 300,
        categoryId: allCategories[1]?.id || 2,
        imageUrl: 'https://via.placeholder.com/400x400?text=Shoes',
      },
      {
        name: '有机绿茶',
        description: '高山种植，清香回甘，250g装',
        price: 68,
        stock: 1000,
        categoryId: allCategories[2]?.id || 3,
        imageUrl: 'https://via.placeholder.com/400x400?text=GreenTea',
      },
    ];

    for (const p of products) {
      try {
        // Check if product already exists by name
        await productsService.create(p);
        console.log(`✅ Product created: ${p.name}`);
      } catch {
        console.log(`ℹ️  Product already exists (or error): ${p.name}`);
      }
    }
  }

  await app.close();
  console.log('\n🎉 Seed completed!');
}

void seed().catch((err: Error) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
