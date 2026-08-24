import * as fs from 'fs';
import * as path from 'path';

/**
 * 通用文件型审计日志（所有模块共用此文件，不要每个模块复制一份）
 *
 * 用法示例（品牌模块）：
 *   logOperation({
 *     module: 'brand',
 *     operation: 'create',
 *     operatorId: userId,
 *     targetId: brand.id,
 *     targetName: brand.name,
 *     success: true,
 *   });
 *
 * 日志按模块分文件写入项目根目录 logs/{module}-YYYY-MM-DD.log
 */

export interface LogPayload {
  /** 模块名，如 'brand' / 'product' / 'order'，用于日志文件名与行内标识 */
  module: string;
  /** 操作类型，如 'create' / 'update' / 'delete' / 'pay' */
  operation: string;
  /** 操作人ID（无登录上下文的内部调用可省略） */
  operatorId?: number;
  /** 被操作对象ID */
  targetId?: number;
  /** 被操作对象名称 */
  targetName?: string;
  /** 是否成功 */
  success: boolean;
  /** 失败原因等补充信息 */
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
 * 记录一条操作日志（同步追加写文件）
 * 日志写入失败不影响业务主流程，仅控制台兜底提示
 */
export function logOperation(payload: LogPayload): void {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }

    const fields = [
      `[${formatDate(new Date())} ${formatTime(new Date())}]`,
      `[${payload.module.toUpperCase()}]`,
      `[${payload.operation.toUpperCase()}]`,
      payload.operatorId !== undefined
        ? `操作人=${payload.operatorId}`
        : '操作人=未知',
      payload.targetId !== undefined ? `目标ID=${payload.targetId}` : null,
      payload.targetName ? `名称=${payload.targetName}` : null,
      payload.success ? '[成功]' : '[失败]',
      payload.message || '',
    ];

    fs.appendFileSync(
      path.join(LOG_DIR, `${payload.module}-${formatDate(new Date())}.log`),
      fields.filter(Boolean).join(' ') + '\n',
      'utf8',
    );
  } catch (err) {
    // 日志失败不能影响业务
    console.error('操作日志写入失败:', err);
  }
}
