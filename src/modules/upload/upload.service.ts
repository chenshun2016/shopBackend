import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { extname } from 'path';
import { readFileSync, unlinkSync } from 'fs';

export interface MagicRule {
  offset: number;
  signature: number[];
}

type MagicTable = Record<string, MagicRule[]>;

// 图片魔数(文件头签名),用于识别真实文件类型,防 mimetype 伪装
const IMAGE_MAGIC: MagicTable = {
  jpg: [{ offset: 0, signature: [0xff, 0xd8, 0xff] }],
  jpeg: [{ offset: 0, signature: [0xff, 0xd8, 0xff] }],
  png: [
    { offset: 0, signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  ],
  webp: [
    { offset: 0, signature: [0x52, 0x49, 0x46, 0x46] }, // "RIFF"
    { offset: 8, signature: [0x57, 0x45, 0x42, 0x50] }, // "WEBP"
  ],
};

// 文档魔数:PDF("%PDF-") / OLE2(.doc/.xls/.ppt) / ZIP(.docx/.xlsx/.pptx/.zip)
// txt 无固定文件头,签名留空数组表示跳过魔数校验
const FILE_MAGIC: MagicTable = {
  pdf: [{ offset: 0, signature: [0x25, 0x50, 0x44, 0x46, 0x2d] }], // "%PDF-"
  doc: [
    {
      offset: 0,
      signature: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
    },
  ],
  docx: [{ offset: 0, signature: [0x50, 0x4b, 0x03, 0x04] }], // ZIP "PK\x03\x04"
  xls: [
    {
      offset: 0,
      signature: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
    },
  ],
  xlsx: [{ offset: 0, signature: [0x50, 0x4b, 0x03, 0x04] }],
  ppt: [
    {
      offset: 0,
      signature: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
    },
  ],
  pptx: [{ offset: 0, signature: [0x50, 0x4b, 0x03, 0x04] }],
  zip: [{ offset: 0, signature: [0x50, 0x4b, 0x03, 0x04] }],
  txt: [],
};

export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
export const FILE_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.zip',
  '.txt',
];

/**
 * 生成随机文件名,防覆盖/防路径穿越(纯函数,供 multer 回调使用)
 * 注意:扩展名白名单由 multer fileFilter 前置校验,这里不重复抛错
 * (multer 回调里 throw 会成为未捕获异常,直接崩溃进程)
 */
export function generateFilename(originalname: string): string {
  const ext = extname(originalname).toLowerCase();
  return `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;
}

@Injectable()
export class UploadService {
  /**
   * 校验文件真实类型(魔数),伪装文件直接删除并抛 400
   * @param table 扩展名 → 魔数规则表;空数组 = 该类型无固定文件头,跳过校验
   */
  verifyMagicBytes(
    file: Express.Multer.File,
    table: MagicTable,
    message: string,
  ): void {
    const ext = extname(file.originalname).toLowerCase().replace('.', '');
    const rules = table[ext];
    if (!rules) {
      // multer 先落盘后校验,失败分支都要清理已落盘的文件
      this.removeUploadedFile(file);
      throw new BadRequestException(message);
    }
    if (rules.length === 0) {
      return; // 无固定文件头的类型(如 txt),跳过魔数校验
    }
    if (!file.path) {
      throw new BadRequestException('文件未保存');
    }
    const buffer = readFileSync(file.path);
    const ok = rules.every(({ offset, signature }) =>
      signature.every((byte, i) => buffer[offset + i] === byte),
    );
    if (!ok) {
      // 伪装文件:删除已落盘的文件再报错
      this.removeUploadedFile(file);
      throw new BadRequestException(message);
    }
  }

  /** 删除已落盘的临时文件(失败不影响报错) */
  private removeUploadedFile(file: Express.Multer.File): void {
    try {
      unlinkSync(file.path);
    } catch {
      // 删除失败不影响报错
    }
  }
}

export { IMAGE_MAGIC, FILE_MAGIC };
export type { MagicTable };
