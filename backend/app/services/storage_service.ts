import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

class StorageService {
  private s3Client: S3Client
  private bucketName: string
  private supabaseUrl: string

  constructor() {
    const defaultRegion = 'us-east-1'
    const defaultEndpoint = 'https://leowjdfbufhnbgkttxrg.supabase.co/storage/v1/s3'
    const defaultAccessKey = '7b78423db1803c8ffc27f34b5ede3d4c'
    const defaultSecretKey = '3d3be75e779e3051143e9960463ada294a6e8ed499c1dd1322ace1d033b92a2f'
    this.bucketName = 'uploads'
    this.supabaseUrl = 'https://leowjdfbufhnbgkttxrg.supabase.co'

    const envAccessKey = process.env.SUPABASE_S3_ACCESS_KEY_ID?.replace(/["']/g, '').trim()
    const envSecretKey = process.env.SUPABASE_S3_SECRET_ACCESS_KEY?.replace(/["']/g, '').trim()
    const envEndpoint = process.env.SUPABASE_S3_ENDPOINT?.replace(/["']/g, '').trim()
    const envBucket = process.env.SUPABASE_STORAGE_BUCKET?.replace(/["']/g, '').trim()
    const envUrl = process.env.SUPABASE_URL?.replace(/["']/g, '').trim()

    const accessKeyId = envAccessKey && envAccessKey.length > 10 ? envAccessKey : defaultAccessKey
    const secretAccessKey = envSecretKey && envSecretKey.length > 10 ? envSecretKey : defaultSecretKey
    const endpoint = envEndpoint && envEndpoint.startsWith('http') ? envEndpoint : defaultEndpoint
    const region = process.env.SUPABASE_S3_REGION?.trim() || defaultRegion

    if (envBucket) this.bucketName = envBucket
    if (envUrl) this.supabaseUrl = envUrl.replace(/\/$/, '')

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

  public async uploadFile(
    filename: string,
    buffer: Buffer,
    contentType: string
  ): Promise<{ url: string; size: number }> {
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
  }

  public getPublicUrl(filename: string): string {
    return `${this.supabaseUrl}/storage/v1/object/public/${this.bucketName}/${filename}`
  }
}

export default new StorageService()
