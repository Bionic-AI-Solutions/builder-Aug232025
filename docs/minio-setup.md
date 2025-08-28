# MinIO S3 Setup for BuilderAI

## Overview
This document describes the MinIO S3-compatible object storage setup for the BuilderAI application. MinIO provides S3-compatible API for local development and can be easily migrated to cloud S3 services in production.

## Architecture

### Services
- **MinIO Server**: S3-compatible object storage server
- **MinIO Console**: Web-based management interface
- **MinIO Client**: Command-line tool for bucket management

### Buckets
- `builderai-files`: Main storage for application files
- `builderai-uploads`: User uploads and temporary files
- `builderai-exports`: Generated exports and reports
- `builderai-backups`: System backups and archives

## Local Development Setup

### Prerequisites
- Docker and Docker Compose
- Ports 9000 and 9001 available

### Quick Start

1. **Start the services:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Access MinIO Console:**
   - URL: http://localhost:9001
   - Username: `minioadmin`
   - Password: `minioadmin123`

3. **Verify buckets are created:**
   - Navigate to the Console
   - Check that all buckets are present

### Environment Variables

The following environment variables are configured in the Docker Compose file:

```env
# MinIO S3 Configuration
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin123
S3_BUCKET_NAME=builderai-files
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true
S3_USE_SSL=false
```

## Usage in Application

### File Upload Example
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  region: process.env.S3_REGION,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
});

// Upload a file
const uploadFile = async (file: Buffer, key: string) => {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: 'application/pdf',
  });
  
  return await s3Client.send(command);
};
```

### File Download Example
```typescript
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const downloadFile = async (key: string) => {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  });
  
  const response = await s3Client.send(command);
  return response.Body;
};
```

## Bucket Policies

### Public Read Access
Some buckets have public read access for serving static files:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::builderai-files/*"]
    }
  ]
}
```

### Private Access
Sensitive files use private access with signed URLs:

```typescript
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const generateSignedUrl = async (key: string, expiresIn: number = 3600) => {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  });
  
  return await getSignedUrl(s3Client, command, { expiresIn });
};
```

## File Organization

### Directory Structure
```
builderai-files/
├── projects/
│   ├── {project-id}/
│   │   ├── knowledge-base/
│   │   ├── exports/
│   │   └── backups/
├── users/
│   ├── {user-id}/
│   │   ├── avatars/
│   │   └── uploads/
├── widgets/
│   ├── {widget-id}/
│   │   ├── assets/
│   │   └── configurations/
└── system/
    ├── templates/
    ├── exports/
    └── backups/
```

### File Naming Convention
- **Projects**: `projects/{project-id}/{type}/{filename}`
- **Users**: `users/{user-id}/{type}/{filename}`
- **Widgets**: `widgets/{widget-id}/{type}/{filename}`
- **System**: `system/{type}/{filename}`

## Security Considerations

### Access Control
- Use signed URLs for private files
- Implement proper authentication and authorization
- Validate file types and sizes
- Scan uploaded files for malware

### Data Protection
- Encrypt sensitive files at rest
- Use HTTPS for all S3 operations
- Implement proper backup strategies
- Monitor access logs

## Migration to Production

### AWS S3 Migration
When migrating to AWS S3, update environment variables:

```env
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY_ID=your-aws-access-key
S3_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET_NAME=your-production-bucket
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=false
S3_USE_SSL=true
```

### Data Migration
1. Create S3 buckets in AWS
2. Use AWS CLI or SDK to migrate data
3. Update application configuration
4. Test all file operations
5. Update DNS and CDN settings

## Monitoring and Maintenance

### Health Checks
```bash
# Check MinIO status
curl http://localhost:9000/minio/health/live

# Check bucket status
mc ls myminio/
```

### Backup Strategy
- Regular bucket backups
- Cross-region replication
- Version control for critical files
- Automated backup testing

### Performance Optimization
- Use CDN for public files
- Implement caching strategies
- Optimize file sizes
- Monitor bandwidth usage

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if MinIO container is running
   - Verify port mappings
   - Check firewall settings

2. **Authentication Errors**
   - Verify access key and secret
   - Check bucket permissions
   - Validate endpoint URL

3. **File Upload Failures**
   - Check file size limits
   - Verify file type restrictions
   - Check disk space

### Logs
```bash
# View MinIO logs
docker-compose -f docker-compose.dev.yml logs minio

# View application logs
docker-compose -f docker-compose.dev.yml logs builderai-dev
```

## Development Workflow

### Adding New File Types
1. Update `ALLOWED_FILE_TYPES` environment variable
2. Add validation logic in application
3. Update bucket policies if needed
4. Test file upload/download

### Adding New Buckets
1. Update `init-minio.sh` script
2. Add bucket configuration
3. Update application code
4. Test bucket operations

## References

- [MinIO Documentation](https://docs.min.io/)
- [AWS S3 SDK Documentation](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/s3-examples.html)
- [S3-Compatible APIs](https://docs.aws.amazon.com/AmazonS3/latest/API/Welcome.html)
