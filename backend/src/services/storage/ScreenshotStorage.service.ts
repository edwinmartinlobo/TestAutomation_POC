import * as Minio from 'minio';
import { appConfig } from '../../config/app.config';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export class ScreenshotStorageService {
  private minioClient: Minio.Client;
  private bucket: string;

  constructor() {
    const [host, port] = appConfig.storage.endpoint.split(':');

    this.minioClient = new Minio.Client({
      endPoint: host,
      port: port ? parseInt(port) : 9000,
      useSSL: appConfig.storage.useSSL,
      accessKey: appConfig.storage.accessKey,
      secretKey: appConfig.storage.secretKey,
    });

    this.bucket = appConfig.storage.bucket;
    this.ensureBucketExists();
  }

  /**
   * Ensure bucket exists, create if it doesn't
   */
  private async ensureBucketExists(): Promise<void> {
    try {
      const exists = await this.minioClient.bucketExists(this.bucket);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucket, appConfig.storage.region);
        logger.info('MinIO bucket created', { bucket: this.bucket });
      }
    } catch (error: any) {
      logger.error('Failed to ensure bucket exists', {
        bucket: this.bucket,
        error: error.message,
      });
    }
  }

  /**
   * Upload screenshot from base64 string
   */
  async uploadScreenshot(params: {
    base64Data: string;
    testResultId: string;
    failureId?: string;
    type?: 'failure' | 'step' | 'comparison';
  }): Promise<{ storageKey: string; url: string }> {
    try {
      // Remove data URL prefix if present
      const base64String = params.base64Data.replace(/^data:image\/\w+;base64,/, '');

      // Convert base64 to buffer
      const buffer = Buffer.from(base64String, 'base64');

      // Generate unique key
      const timestamp = Date.now();
      const uuid = uuidv4();
      const storageKey = `screenshots/${params.testResultId}/${timestamp}-${uuid}.png`;

      // Upload to MinIO
      await this.minioClient.putObject(this.bucket, storageKey, buffer, buffer.length, {
        'Content-Type': 'image/png',
        'X-Test-Result-Id': params.testResultId,
        ...(params.failureId && { 'X-Failure-Id': params.failureId }),
        'X-Screenshot-Type': params.type || 'failure',
      });

      // Generate URL
      const url = await this.getSignedUrl(storageKey);

      logger.info('Screenshot uploaded', {
        storageKey,
        testResultId: params.testResultId,
        size: buffer.length,
      });

      return { storageKey, url };
    } catch (error: any) {
      logger.error('Failed to upload screenshot', {
        error: error.message,
        testResultId: params.testResultId,
      });
      throw error;
    }
  }

  /**
   * Upload screenshot from file path
   */
  async uploadScreenshotFile(params: {
    filePath: string;
    testResultId: string;
    failureId?: string;
    type?: 'failure' | 'step' | 'comparison';
  }): Promise<{ storageKey: string; url: string }> {
    try {
      const timestamp = Date.now();
      const uuid = uuidv4();
      const ext = path.extname(params.filePath) || '.png';
      const storageKey = `screenshots/${params.testResultId}/${timestamp}-${uuid}${ext}`;

      await this.minioClient.fPutObject(this.bucket, storageKey, params.filePath, {
        'Content-Type': 'image/png',
        'X-Test-Result-Id': params.testResultId,
        ...(params.failureId && { 'X-Failure-Id': params.failureId }),
        'X-Screenshot-Type': params.type || 'failure',
      });

      const url = await this.getSignedUrl(storageKey);

      logger.info('Screenshot file uploaded', {
        storageKey,
        testResultId: params.testResultId,
      });

      return { storageKey, url };
    } catch (error: any) {
      logger.error('Failed to upload screenshot file', {
        error: error.message,
        filePath: params.filePath,
      });
      throw error;
    }
  }

  /**
   * Get a signed URL for accessing a screenshot
   */
  async getSignedUrl(storageKey: string, expirySeconds = 3600): Promise<string> {
    try {
      const url = await this.minioClient.presignedGetObject(
        this.bucket,
        storageKey,
        expirySeconds
      );
      return url;
    } catch (error: any) {
      logger.error('Failed to generate signed URL', {
        error: error.message,
        storageKey,
      });
      throw error;
    }
  }

  /**
   * Download screenshot as buffer
   */
  async downloadScreenshot(storageKey: string): Promise<Buffer> {
    try {
      const chunks: Buffer[] = [];
      const stream = await this.minioClient.getObject(this.bucket, storageKey);

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
    } catch (error: any) {
      logger.error('Failed to download screenshot', {
        error: error.message,
        storageKey,
      });
      throw error;
    }
  }

  /**
   * Delete screenshot
   */
  async deleteScreenshot(storageKey: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucket, storageKey);
      logger.info('Screenshot deleted', { storageKey });
    } catch (error: any) {
      logger.error('Failed to delete screenshot', {
        error: error.message,
        storageKey,
      });
      throw error;
    }
  }

  /**
   * List screenshots for a test result
   */
  async listScreenshotsForTest(testResultId: string): Promise<string[]> {
    try {
      const prefix = `screenshots/${testResultId}/`;
      const stream = this.minioClient.listObjects(this.bucket, prefix, true);

      const keys: string[] = [];
      return new Promise((resolve, reject) => {
        stream.on('data', (obj) => {
          if (obj.name) keys.push(obj.name);
        });
        stream.on('end', () => resolve(keys));
        stream.on('error', reject);
      });
    } catch (error: any) {
      logger.error('Failed to list screenshots', {
        error: error.message,
        testResultId,
      });
      return [];
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalObjects: number;
    totalSize: number;
  }> {
    try {
      const stream = this.minioClient.listObjects(this.bucket, '', true);

      let totalObjects = 0;
      let totalSize = 0;

      return new Promise((resolve, reject) => {
        stream.on('data', (obj) => {
          totalObjects++;
          totalSize += obj.size;
        });
        stream.on('end', () => resolve({ totalObjects, totalSize }));
        stream.on('error', reject);
      });
    } catch (error: any) {
      logger.error('Failed to get storage stats', {
        error: error.message,
      });
      return { totalObjects: 0, totalSize: 0 };
    }
  }
}

// Export singleton instance
export const screenshotStorage = new ScreenshotStorageService();
