import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { Region } from './modules/regions/entities/region.entity';
import * as fs from 'fs';

interface RegionNode {
  code: string;
  name: string;
  children?: RegionNode[];
}

// 数据来源：modood/Administrative-divisions-of-China（本地下载）
// 可用命令行参数覆盖：npx ts-node src/seed-regions.ts /path/to/pcas-code.json
const DEFAULT_FILE =
  '/Users/chenshun/Downloads/Administrative-divisions-of-China-2.7.0/dist/pcas-code.json';

async function seedRegions(filePath: string) {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const repo = dataSource.getRepository(Region);

  // 幂等：清空旧数据再导入
  await repo.clear();

  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as RegionNode[];
  const regions: Partial<Region>[] = [];

  // 递归收集。level < 3 时才继续下沉，即只导入省市区 3 层（跳过街道/乡镇）；
  // 想连街道一起导入，把条件改成 level < 4 即可
  const walk = (
    items: RegionNode[],
    parentCode: string | null,
    level: number,
  ) => {
    for (const item of items) {
      regions.push({ code: item.code, name: item.name, level, parentCode });
      if (item.children && level < 3) {
        walk(item.children, item.code, level + 1);
      }
    }
  };
  walk(raw, null, 1);

  // 分批写入，避免一次性 save 太多
  const BATCH_SIZE = 500;
  for (let i = 0; i < regions.length; i += BATCH_SIZE) {
    await repo.save(regions.slice(i, i + BATCH_SIZE));
    console.log(
      `已写入 ${Math.min(i + BATCH_SIZE, regions.length)} / ${regions.length}`,
    );
  }

  const counts = await repo
    .createQueryBuilder('r')
    .select('r.level', 'level')
    .addSelect('COUNT(*)', 'count')
    .groupBy('r.level')
    .getRawMany<{ level: number; count: string }>();
  console.log(`✅ 导入完成，共 ${regions.length} 条`);
  for (const row of counts) {
    console.log(`  level ${row.level}: ${row.count} 条`);
  }

  await app.close();
}

const filePath = process.argv[2] || DEFAULT_FILE;
seedRegions(filePath).catch((err) => {
  console.error('导入失败:', err);
  process.exit(1);
});
