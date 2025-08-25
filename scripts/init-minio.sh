#!/bin/bash

# Wait for MinIO to be ready
echo "Waiting for MinIO to be ready..."
until mc alias set myminio http://minio:9000 minioadmin minioadmin123; do
  echo "MinIO is not ready yet. Waiting..."
  sleep 2
done

echo "MinIO is ready!"

# Create the default bucket for BuilderAI files
echo "Creating bucket: builderai-files"
mc mb myminio/builderai-files

# Set bucket policy for public read (if needed for certain files)
echo "Setting bucket policy..."
mc policy set download myminio/builderai-files

# Create additional buckets for different file types
echo "Creating additional buckets..."
mc mb myminio/builderai-uploads
mc mb myminio/builderai-exports
mc mb myminio/builderai-backups

# Set policies for additional buckets
mc policy set download myminio/builderai-uploads
mc policy set download myminio/builderai-exports
mc policy set download myminio/builderai-backups

echo "MinIO initialization completed!"
echo "Available buckets:"
mc ls myminio

echo "MinIO Console available at: http://localhost:9001"
echo "Login with: minioadmin / minioadmin123"
