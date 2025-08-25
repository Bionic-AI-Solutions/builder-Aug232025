import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client for MinIO
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin123',
  },
  region: process.env.S3_REGION || 'us-east-1',
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'builderai-files';

export interface FileUploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  public?: boolean;
}

export interface FileInfo {
  key: string;
  size: number;
  lastModified: Date;
  contentType?: string;
  metadata?: Record<string, string>;
}

/**
 * Upload a file to S3/MinIO
 */
export async function uploadFile(
  key: string,
  file: Buffer | string,
  options: FileUploadOptions = {}
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: options.contentType || 'application/octet-stream',
    Metadata: options.metadata,
    ACL: options.public ? 'public-read' : 'private',
  });

  await s3Client.send(command);
  return key;
}

/**
 * Download a file from S3/MinIO
 */
export async function downloadFile(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const response = await s3Client.send(command);
  
  if (!response.Body) {
    throw new Error('File not found or empty');
  }

  // Convert stream to buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as any) {
    chunks.push(chunk);
  }
  
  return Buffer.concat(chunks);
}

/**
 * Delete a file from S3/MinIO
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Generate a signed URL for file access
 */
export async function generateSignedUrl(
  key: string,
  operation: 'get' | 'put' = 'get',
  expiresIn: number = 3600
): Promise<string> {
  const command = operation === 'get' 
    ? new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key })
    : new PutObjectCommand({ Bucket: BUCKET_NAME, Key: key });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * List files in a directory
 */
export async function listFiles(prefix: string = ''): Promise<FileInfo[]> {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix,
  });

  const response = await s3Client.send(command);
  
  if (!response.Contents) {
    return [];
  }

  return response.Contents.map(item => ({
    key: item.Key!,
    size: item.Size || 0,
    lastModified: item.LastModified || new Date(),
  }));
}

/**
 * Check if a file exists
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    await s3Client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'NoSuchKey') {
      return false;
    }
    throw error;
  }
}

/**
 * Get file metadata
 */
export async function getFileInfo(key: string): Promise<FileInfo | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    const response = await s3Client.send(command);
    
    return {
      key,
      size: parseInt(response.ContentLength?.toString() || '0'),
      lastModified: response.LastModified || new Date(),
      contentType: response.ContentType,
      metadata: response.Metadata,
    };
  } catch (error: any) {
    if (error.name === 'NoSuchKey') {
      return null;
    }
    throw error;
  }
}

/**
 * Upload project knowledge base file
 */
export async function uploadProjectFile(
  projectId: string,
  fileName: string,
  file: Buffer,
  contentType: string = 'application/octet-stream'
): Promise<string> {
  const key = `projects/${projectId}/knowledge-base/${fileName}`;
  return await uploadFile(key, file, { contentType });
}

/**
 * Upload user avatar
 */
export async function uploadUserAvatar(
  userId: string,
  fileName: string,
  file: Buffer,
  contentType: string = 'image/jpeg'
): Promise<string> {
  const key = `users/${userId}/avatars/${fileName}`;
  return await uploadFile(key, file, { contentType, public: true });
}

/**
 * Upload widget asset
 */
export async function uploadWidgetAsset(
  widgetId: string,
  fileName: string,
  file: Buffer,
  contentType: string = 'application/octet-stream'
): Promise<string> {
  const key = `widgets/${widgetId}/assets/${fileName}`;
  return await uploadFile(key, file, { contentType, public: true });
}

/**
 * Get public URL for a file (if public)
 */
export function getPublicUrl(key: string): string {
  const endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';
  return `${endpoint}/${BUCKET_NAME}/${key}`;
}

/**
 * Validate file type
 */
export function validateFileType(fileName: string, allowedTypes: string[]): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension ? allowedTypes.includes(extension) : false;
}

/**
 * Validate file size
 */
export function validateFileSize(size: number, maxSize: number): boolean {
  return size <= maxSize;
}

export default {
  uploadFile,
  downloadFile,
  deleteFile,
  generateSignedUrl,
  listFiles,
  fileExists,
  getFileInfo,
  uploadProjectFile,
  uploadUserAvatar,
  uploadWidgetAsset,
  getPublicUrl,
  validateFileType,
  validateFileSize,
};
