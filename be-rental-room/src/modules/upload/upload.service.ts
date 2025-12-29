import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ImageKit from 'imagekit';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadService {
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
   * Delete a file from ImageKit using fileId (FASTEST - Recommended)
   * This is the optimal way when you have the fileId stored in database
   */
  async deleteFileById(fileId: string): Promise<boolean> {
    if (!fileId) {
      console.warn('deleteFileById: Empty fileId provided');
      return false;
    }

    try {
      console.log(`Deleting file by ID: ${fileId}`);

      return new Promise((resolve, reject) => {
        this.imagekit.deleteFile(fileId, (error, result) => {
          if (error) {
            console.error(`Failed to delete file (ID: ${fileId}):`, error);
            resolve(false);
          } else {
            console.log(`✓ Successfully deleted file (ID: ${fileId})`);
            resolve(true);
          }
        });
      });
    } catch (error) {
      console.error(`Exception while deleting file (ID: ${fileId}):`, error);
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
      console.warn('deleteFileByUrl: Empty URL provided');
      return false;
    }

    try {
      console.log(`Attempting to delete image: ${imageUrl}`);

      // Extract filename from URL
      const filename = imageUrl.split('/').pop();
      if (!filename) {
        console.warn(`Cannot extract filename from URL: ${imageUrl}`);
        return false;
      }

      console.log(`Searching for file: ${filename}`);

      // Search for the file by name
      const files = await this.imagekit.listFiles({
        searchQuery: `name="${filename}"`,
      });

      console.log(`Found ${files?.length || 0} files matching: ${filename}`);

      if (!files || files.length === 0) {
        console.warn(`File not found in ImageKit: ${filename}`);
        return false;
      }

      // Get the fileId from the first match
      const fileId = (files[0] as any).fileId;

      if (!fileId) {
        console.error(`No fileId found for file: ${filename}`);
        return false;
      }

      // Use the optimized deleteFileById method
      return this.deleteFileById(fileId);
    } catch (error) {
      console.error(
        `Exception while deleting file from ImageKit (${imageUrl}):`,
        error,
      );
      return false;
    }
  }
}
