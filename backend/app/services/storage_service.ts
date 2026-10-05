import { S3Client, PutObjectCommand, CreateBucketCommand } from '@aws-sdk/client-s3'
import app from '@adonisjs/core/services/app'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

class StorageService {
  private s3Client: S3Client
  private bucketName: string
  private supabaseUrl: string

  constructor() {
    const rawRegion = process.env.SUPABASE_S3_REGION
    const rawEndpoint = process.env.SUPABASE_S3_ENDPOINT
    const rawAccessKey = process.env.SUPABASE_S3_ACCESS_KEY_ID
    const rawSecretKey = process.env.SUPABASE_S3_SECRET_ACCESS_KEY
    const rawBucket = process.env.SUPABASE_STORAGE_BUCKET
    const rawSupabaseUrl = process.env.SUPABASE_URL

    const region = rawRegion && rawRegion.trim() ? rawRegion.trim() : 'us-east-1'
    const endpoint =
      rawEndpoint && rawEndpoint.trim()
        ? rawEndpoint.trim()
        : 'https://leowjdfbufhnbgkttxrg.supabase.co/storage/v1/s3'
    const accessKeyId =
      rawAccessKey && rawAccessKey.trim()
        ? rawAccessKey.trim()
        : '7b78423db1803c8ffc27f34b5ede3d4c'
    const secretAccessKey =
      rawSecretKey && rawSecretKey.trim()
        ? rawSecretKey.trim()
        : '3d3be75e779e3051143e9960463ada294a6e8ed499c1dd1322ace1d033b92a2f'

    this.bucketName = rawBucket && rawBucket.trim() ? rawBucket.trim() : 'uploads'
    this.supabaseUrl = (
      rawSupabaseUrl && rawSupabaseUrl.trim()
        ? rawSupabaseUrl.trim()
        : 'https://leowjdfbufhnbgkttxrg.supabase.co'
    ).replace(/\/$/, '')

    this.s3Client = new S3Client({
      forcePathStyle: true,
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  }

  private async ensureBucketExists(): Promise<void> {
    try {
      await this.s3Client.send(
        new CreateBucketCommand({
          Bucket: this.bucketName,
        })
      )
    } catch {
      // Ignore if bucket already exists or S3 permissions prevent bucket creation
    }
  }

  public async uploadFile(
    filename: string,
    buffer: Buffer,
    contentType: string
  ): Promise<{ url: string; size: number }> {
    try {
      await this.ensureBucketExists()

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: filename,
          Body: buffer,
          ContentType: contentType,
        })
      )

      const publicUrl = `${this.supabaseUrl}/storage/v1/object/public/${this.bucketName}/${filename}`
      return {
        url: publicUrl,
        size: buffer.length,
      }
    } catch (err) {
      console.error('[StorageService] Supabase S3 upload failed:', err)

      // Local disk fallback
      const uploadDir = app.makePath('public/uploads')
      await mkdir(uploadDir, { recursive: true })
      const filePath = join(uploadDir, filename)
      await writeFile(filePath, buffer)

      return {
        url: `/uploads/${filename}`,
        size: buffer.length,
      }
    }
  }

  public getPublicUrl(filename: string): string {
    return `${this.supabaseUrl}/storage/v1/object/public/${this.bucketName}/${filename}`
  }
}

export default new StorageService()
