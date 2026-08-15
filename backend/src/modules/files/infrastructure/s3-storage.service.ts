import {
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3StorageService {
  private readonly bucket: string;
  private readonly client: S3Client;

  constructor(private readonly configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('storage.s3.accessKeyId');
    const endpoint = this.configService.get<string>('storage.s3.endpointUrl');
    const secretAccessKey = this.configService.get<string>('storage.s3.secretAccessKey');

    this.bucket = this.configService.getOrThrow<string>('storage.s3.bucket');
    this.client = new S3Client({
      region: this.configService.getOrThrow<string>('storage.s3.region'),
      ...(endpoint ? { endpoint } : {}),
      ...(accessKeyId && secretAccessKey
        ? {
            credentials: {
              accessKeyId,
              secretAccessKey,
            },
          }
        : {}),
    });
  }

  createPresignedUploadUrl(input: { key: string; contentType: string; expiresInSeconds: number }) {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: input.key,
      ContentType: input.contentType,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: input.expiresInSeconds,
    });
  }

  async getObjectMetadata(key: string) {
    const result = await this.client.send(
      new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    return {
      contentLength: result.ContentLength,
      contentType: result.ContentType,
    };
  }

  async copyObject(sourceKey: string, destinationKey: string) {
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: encodeURI(`${this.bucket}/${sourceKey}`),
        Key: destinationKey,
      }),
    );
  }

  async deleteObject(key: string) {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  async putObject(input: { key: string; body: Buffer; contentType: string }) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
        ContentLength: input.body.length,
      }),
    );
  }
}
