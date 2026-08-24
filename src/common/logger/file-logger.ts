import * as fs from 'fs';
import * as path from 'path';

/**
 * 文件型审计日志（集中实现，唯一入口）
 * 品牌新增/删除操作日志，按天写入项目根目录 logs/brand-YYYY-MM-DD.log
 * 其余模块如需日志，扩展 operation 类型复用此文件，不要在业务代码里散落日志逻辑
 */

export type BrandOperation = 'create' | 'delete';

export interface BrandLogPayload {
  operation: BrandOperation;
  operatorId?: number;
  brandId?: number;
  brandName?: string;
  success: boolean;
  message?: string;
}

const LOG_DIR = path.join(process.cwd(), 'logs');

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * 记录一条品牌操作日志（同步追加写文件）
 * 日志写入失败不影响业务主流程，仅控制台兜底提示
 */
export function logBrandOperation(payload: BrandLogPayload): void {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }

    const fields = [
      `[${formatDate(new Date())} ${formatTime(new Date())}]`,
      `[${payload.operation.toUpperCase()}]`,
      payload.operatorId !== undefined
        ? `操作人=${payload.operatorId}`
        : '操作人=未知',
      payload.brandId !== undefined ? `品牌ID=${payload.brandId}` : null,
      payload.brandName ? `品牌名=${payload.brandName}` : null,
      payload.success ? '[成功]' : '[失败]',
      payload.message || '',
    ];

    fs.appendFileSync(
      path.join(LOG_DIR, `brand-${formatDate(new Date())}.log`),
      fields.filter(Boolean).join(' ') + '\n',
      'utf8',
    );
  } catch (err) {
    // 日志失败不能影响业务
    console.error('品牌操作日志写入失败:', err);
  }
}
