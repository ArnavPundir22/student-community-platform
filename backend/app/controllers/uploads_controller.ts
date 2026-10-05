import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import StorageService from '#services/storage_service'

export default class UploadsController {
  async store({ request, response, auth }: HttpContext) {
    try {
      await auth.check()
    } catch {}
    const user = auth.user
    if (!user) {
      return response.unauthorized({ message: 'Authentication required' })
    }

    const file = request.file('file', {
      size: '20mb',
    })

    if (file) {
      if (file.hasErrors) {
        return response.badRequest({
          message: file.errors[0]?.message || 'File upload error or file size exceeded (max 20MB)',
        })
      }

      let fileBuffer: Buffer
      try {
        if (file.tmpPath && existsSync(file.tmpPath)) {
          fileBuffer = await readFile(file.tmpPath)
        } else {
          const tempName = `${randomUUID()}.${file.extname || 'bin'}`
          await file.move(app.makePath('tmp'), { name: tempName })
          if (!file.filePath || !existsSync(file.filePath)) {
            return response.badRequest({ message: 'Failed to read uploaded file' })
          }
          fileBuffer = await readFile(file.filePath)
        }

        const filename = `${randomUUID()}.${file.extname || 'bin'}`
        const contentType = file.type || file.subtype || 'application/octet-stream'

        const uploadResult = await StorageService.uploadFile(filename, fileBuffer, contentType)

        return response.created({
          url: uploadResult.url,
          name: file.clientName,
          type: contentType,
          size: uploadResult.size,
        })
      } catch (err: any) {
        console.error('[UploadsController] S3 upload error:', err)
        return response.internalServerError({
          message: err.message || 'Failed to upload file to Supabase S3 storage',
        })
      }
    }

    // Fallback: Base64 payload
    const { name, type, data } = request.only(['name', 'type', 'data'])
    if (name && data) {
      try {
        const ext = name.split('.').pop() || 'bin'
        const filename = `${randomUUID()}.${ext}`
        const base64Data = data.replace(/^data:.*?;base64,/, '')
        const buffer = Buffer.from(base64Data, 'base64')
        const contentType = type || 'application/octet-stream'

        const uploadResult = await StorageService.uploadFile(filename, buffer, contentType)

        return response.created({
          url: uploadResult.url,
          name,
          type: contentType,
          size: uploadResult.size,
        })
      } catch (err: any) {
        console.error('[UploadsController] Base64 S3 upload error:', err)
        return response.internalServerError({
          message: err.message || 'Failed to upload base64 file to Supabase S3 storage',
        })
      }
    }

    return response.badRequest({ message: 'No file uploaded' })
  }

  async show({ params, response }: HttpContext) {
    const fileName = params.fileName
    const localFilePath = app.makePath('public/uploads', fileName)

    if (existsSync(localFilePath)) {
      return response.download(localFilePath, false)
    }

    const publicUrl = StorageService.getPublicUrl(fileName)
    return response.redirect(publicUrl)
  }
}
