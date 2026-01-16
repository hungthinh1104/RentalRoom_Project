import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ImageKit from 'imagekit';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private imagekit: ImageKit;

  constructor(private configService: ConfigService) {
    this.imagekit = new ImageKit({
      publicKey: this.configService.getOrThrow<string>('IMAGEKIT_PUBLIC_KEY'),
      privateKey: this.configService.getOrThrow<string>('IMAGEKIT_PRIVATE_KEY'),
      urlEndpoint: this.configService.getOrThrow<string>(
        'IMAGEKIT_URL_ENDPOINT',
      ),
    });
  }

  getAuthenticationParameters() {
    const token = randomUUID();
    return this.imagekit.getAuthenticationParameters(token);
  }

  /**
   * Upload file to ImageKit (Server-side)
   */
  async uploadFile(
    file: Express.Multer.File,
    folder = 'uploads',
  ): Promise<{ url: string; fileId: string }> {
    return new Promise((resolve, reject) => {
      this.imagekit.upload(
        {
          file: file.buffer, // Buffer from Multer
          fileName: file.originalname || `upload-${Date.now()}`,
          folder: folder,
        },
        (err, result) => {
          if (err) {
            this.logger.error('ImageKit upload failed', err);
            return reject(err instanceof Error ? err : new Error(String(err)));
          }
          if (!result) {
            return reject(new Error('ImageKit upload returned empty result'));
          }
          resolve({
            url: result.url,
            fileId: result.fileId,
          });
        },
      );
    });
  }

  /**
   * Delete a file from ImageKit using fileId (FASTEST - Recommended)
   * This is the optimal way when you have the fileId stored in database
   */
  async deleteFileById(fileId: string): Promise<boolean> {
    if (!fileId) {
      this.logger.warn('deleteFileById: Empty fileId provided');
      return false;
    }

    try {
      return new Promise((resolve) => {
        this.imagekit.deleteFile(fileId, (error) => {
          if (error) {
            this.logger.error(`Failed to delete file (ID: ${fileId})`, error);
            resolve(false);
          } else {
            this.logger.log(`Successfully deleted file (ID: ${fileId})`);
            resolve(true);
          }
        });
      });
    } catch (error) {
      this.logger.error(`Exception while deleting file (ID: ${fileId})`, error);
      return false;
    }
  }

  /**
   * Delete a file from ImageKit given its full URL (FALLBACK)
   * Uses listFiles API to find the fileId, then deletes it
   * Note: This is slower than deleteFileById - use only when fileId is not available
   */
  async deleteFileByUrl(imageUrl: string): Promise<boolean> {
    if (!imageUrl) {
      this.logger.warn('deleteFileByUrl: Empty URL provided');
      return false;
    }

    try {
      // Extract filename from URL
      const filename = imageUrl.split('/').pop();
      if (!filename) {
        this.logger.warn(`Cannot extract filename from URL: ${imageUrl}`);
        return false;
      }

      // Search for the file by name
      const files = await this.imagekit.listFiles({
        searchQuery: `name="${filename}"`,
      });

      if (!files || files.length === 0) {
        this.logger.warn(`File not found in ImageKit: ${filename}`);
        return false;
      }

      // Get the fileId from the first match
      const fileId = (files[0] as any).fileId;

      if (!fileId) {
        this.logger.error(`No fileId found for file: ${filename}`);
        return false;
      }

      // Use the optimized deleteFileById method
      return this.deleteFileById(fileId);
    } catch (error) {
      this.logger.error(
        `Exception while deleting file from ImageKit (${imageUrl})`,
        error,
      );
      return false;
    }
  }
}
