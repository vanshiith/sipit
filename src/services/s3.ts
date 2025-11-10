import AWS from 'aws-sdk';
import { config } from '../config';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class S3Service {
  private s3: AWS.S3;
  private bucket: string;

  constructor() {
    this.s3 = new AWS.S3({
      region: config.aws.region,
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
    });
    this.bucket = config.aws.s3Bucket;
  }

  async generatePresignedUploadUrl(
    fileName: string,
    fileType: string,
    folder: 'profiles' | 'reviews'
  ): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    try {
      const fileExtension = fileName.split('.').pop();
      const key = `${folder}/${uuidv4()}.${fileExtension}`;

      const params = {
        Bucket: this.bucket,
        Key: key,
        Expires: 300, // 5 minutes
        ContentType: fileType,
        ACL: 'public-read',
      };

      const uploadUrl = await this.s3.getSignedUrlPromise('putObject', params);
      const fileUrl = `https://${this.bucket}.s3.${config.aws.region}.amazonaws.com/${key}`;

      return {
        uploadUrl,
        fileUrl,
        key,
      };
    } catch (error) {
      logger.error('Generate presigned URL error:', error);
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3
        .deleteObject({
          Bucket: this.bucket,
          Key: key,
        })
        .promise();
    } catch (error) {
      logger.error('Delete file error:', error);
      throw error;
    }
  }

  async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    fileType: string,
    folder: 'profiles' | 'reviews'
  ): Promise<string> {
    try {
      const fileExtension = fileName.split('.').pop();
      const key = `${folder}/${uuidv4()}.${fileExtension}`;

      await this.s3
        .putObject({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: fileType,
          ACL: 'public-read',
        })
        .promise();

      return `https://${this.bucket}.s3.${config.aws.region}.amazonaws.com/${key}`;
    } catch (error) {
      logger.error('Upload buffer error:', error);
      throw error;
    }
  }
}

export const s3Service = new S3Service();
