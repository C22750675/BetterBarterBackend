import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname, join } from 'node:path';
import { JwtAuthGuard } from '../auth/decorators/jwt-auth.guard.js';
import { createHash } from 'node:crypto';
import { existsSync, writeFileSync, mkdirSync } from 'node:fs';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        if (!new RegExp(/\/(jpg|jpeg|png|gif)$/).exec(file.mimetype)) {
          return cb(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is missing');
    }

    // 1. Calculate the SHA-256 hash of the file buffer
    const hash = createHash('sha256').update(file.buffer).digest('hex');

    // 2. Prepare file metadata
    const extension = extname(file.originalname).toLowerCase();
    const fileName = `${hash}${extension}`;
    const uploadDir = join(process.cwd(), 'imageUploads');
    const filePath = join(uploadDir, fileName);

    // 3. Ensure the upload directory exists
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    // 4. Check if file already exists (Deduplication)
    if (!existsSync(filePath)) {
      // Only write to disk if it doesn't exist
      writeFileSync(filePath, file.buffer);
    }

    // 5. Return the URL (either for the new file or the existing one)
    return {
      url: `/${fileName}`,
      // Helpful for your report: indicate if it was a fresh upload
      hash: hash,
      deduplicated: existsSync(filePath),
    };
  }
}
