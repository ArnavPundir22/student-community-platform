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
      extnames: [
        'png',
        'jpg',
        'jpeg',
        'gif',
        'webp',
        'svg',
        'pdf',
        'doc',
        'docx',
        'txt',
        'zip',
        'rar',
        '7z',
        'csv',
        'xlsx',
        'json',
        'mp3',
        'wav',
        'mp4',
        'webm',
      ],
    })

    if (file) {
      if (file.hasErrors) {
        return response.badRequest({
          message: file.errors[0]?.message || 'Invalid file format or file size exceeded (max 20MB)',
        })
      }

      if (!file.tmpPath) {
        return response.badRequest({ message: 'Failed to read uploaded file stream' })
      }

      const filename = `${randomUUID()}.${file.extname}`
      const fileBuffer = await readFile(file.tmpPath)
      const contentType = file.type || file.subtype || 'application/octet-stream'

      const uploadResult = await StorageService.uploadFile(filename, fileBuffer, contentType)

      return response.created({
        url: uploadResult.url,
        name: file.clientName,
        type: contentType,
        size: uploadResult.size,
      })
    }

    // Fallback: Base64 payload
    const { name, type, data } = request.only(['name', 'type', 'data'])
    if (name && data) {
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
