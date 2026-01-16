import { Controller, Get, Query } from '@nestjs/common';
import { UploadService } from './upload.service';
// import { Public } from '../../common/decorators/public.decorator'; // Commented out until verified

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Get('auth')
  getAuthenticationParameters() {
    return this.uploadService.getAuthenticationParameters();
  }

  // NOTE: In a real app, you should guard this endpoint to ensure the user owns the file
  // or checks referer/origin. For this project, we trust the client's session.
  // @Public()
  // We can treat this as a utility for the client to clean up its own uploads.
  @Get('delete')
  async deleteFile(@Query('url') url: string) {
    return this.uploadService.deleteFileByUrl(url);
  }
}
