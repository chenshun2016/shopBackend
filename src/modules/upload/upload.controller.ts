import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, Options } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import {
  FILE_EXTENSIONS,
  FILE_MAGIC,
  generateFilename,
  IMAGE_EXTENSIONS,
  IMAGE_MAGIC,
  UploadService,
} from './upload.service';

const IMAGE_MAX_SIZE = 2 * 1024 * 1024; // 图片 2MB
const FILE_MAX_SIZE = 20 * 1024 * 1024; // 文档 20MB
const IMAGE_MIME = /^image\/(jpeg|png|webp)$/;

/** 构建 multer 存储配置(纯函数:装饰器上下文里不能用 this) */
function multerOptions(allowedExtensions: string[], maxSize: number): Options {
  return {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        const uploadDir = join(process.cwd(), 'uploads');
        mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
      },
      filename: (_req, file, cb) => {
        // 扩展名已由 fileFilter 校验,这里只生成随机文件名(回调里绝不 throw,会崩进程)
        cb(null, generateFilename(file.originalname));
      },
    }),
    // 扩展名白名单必须用 fileFilter:cb(error) 会转成 400 响应;
    // 若在 filename 回调里 throw,会成为未捕获异常直接杀掉整个进程
    fileFilter: (_req, file, cb) => {
      const ext = extname(file.originalname).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        // 传 Error 时只传一个参数(multer 类型重载要求)
        cb(
          new BadRequestException(
            `不支持的文件类型 "${ext || '(无扩展名)'}",仅支持: ${allowedExtensions.join('/')}`,
          ),
        );
        return;
      }
      cb(null, true);
    },
    limits: { fileSize: maxSize },
  };
}

@ApiTags('文件上传')
@Controller('admin/upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth('JWT')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /** 商品图片:严格校验,仅 jpg/jpeg/png/webp ≤2MB */
  @Post('image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', multerOptions(IMAGE_EXTENSIONS, IMAGE_MAX_SIZE)),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }
    // 注意:diskStorage 没有 file.buffer,Nest 内置 FileTypeValidator 无法使用,
    // 因此手动校验:MIME 白名单(第一层,可被伪造) + 魔数校验(真实类型)
    if (!IMAGE_MIME.test(file.mimetype)) {
      throw new BadRequestException('仅支持 jpg/jpeg/png/webp 图片');
    }
    this.uploadService.verifyMagicBytes(
      file,
      IMAGE_MAGIC,
      '文件内容与类型不符,仅支持 jpg/jpeg/png/webp 图片',
    );
    return { url: `/uploads/${file.filename}` };
  }

  /** 通用文档:pdf/doc/docx/xls/xlsx/ppt/pptx/zip/txt ≤20MB */
  @Post('file')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', multerOptions(FILE_EXTENSIONS, FILE_MAX_SIZE)),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }
    // 扩展名白名单在 multer filename 回调已校验,这里做魔数兜底(防伪装扩展名)
    this.uploadService.verifyMagicBytes(
      file,
      FILE_MAGIC,
      '文件内容与类型不符,仅支持 pdf/doc/docx/xls/xlsx/ppt/pptx/zip/txt',
    );
    return { url: `/uploads/${file.filename}` };
  }
}
