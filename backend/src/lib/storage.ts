/** Image uploads: Azure Blob Storage when configured, otherwise the local `uploads/` folder (dev). */
import { BlobServiceClient } from '@azure/storage-blob';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from '../config.js';

export const UPLOAD_DIR = path.resolve('uploads');
const EXT: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/avif': '.avif' };
export const ALLOWED_TYPES = Object.keys(EXT);

export async function saveImage(buf: Buffer, mime: string): Promise<string> {
  const name = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}${EXT[mime] || ''}`;
  if (config.azureStorage) {
    const svc = BlobServiceClient.fromConnectionString(config.azureStorage);
    const container = svc.getContainerClient(config.azureContainer);
    await container.createIfNotExists({ access: 'blob' });
    const blob = container.getBlockBlobClient(name);
    await blob.uploadData(buf, { blobHTTPHeaders: { blobContentType: mime, blobCacheControl: 'public, max-age=31536000, immutable' } });
    return blob.url;
  }
  const file = path.join(UPLOAD_DIR, name);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, buf);
  return `${config.publicUrl}/api/uploads/${name}`;
}
