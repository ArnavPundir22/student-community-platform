import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export default class UploadsController {
  async store({ request, response, auth }: HttpContext) {
    try {
      await auth.check()
    } catch {}
    const user = auth.user
    if (!user) {
      return response.unauthorized({ message: 'Authentication required' })
    }

    const uploadDir = app.makePath('public/uploads')
    await mkdir(uploadDir, { recursive: true })

    const file = request.file('file', {
      size: '20mb',
      extnames: [
        'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg',
        'pdf', 'doc', 'docx', 'txt', 'zip', 'rar', '7z',
        'csv', 'xlsx', 'json', 'mp3', 'wav', 'mp4', 'webm'
      ],
    })

    if (file) {
      if (file.hasErrors) {
        return response.badRequest({ message: file.errors[0]?.message || 'Invalid file format or file size exceeded (max 20MB)' })
      }
      const filename = `${randomUUID()}.${file.extname}`
      await file.move(uploadDir, { name: filename })
      const url = `/uploads/${filename}`
      return response.created({
        url,
        name: file.clientName,
        type: file.type || file.subtype || 'application/octet-stream',
        size: file.size,
      })
    }

    // Fallback: Base64 payload
    const { name, type, data } = request.only(['name', 'type', 'data'])
    if (name && data) {
      const ext = name.split('.').pop() || 'bin'
      const filename = `${randomUUID()}.${ext}`
      const filePath = join(uploadDir, filename)
      const base64Data = data.replace(/^data:.*?;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')
      await writeFile(filePath, buffer)
      const url = `/uploads/${filename}`
      return response.created({
        url,
        name,
        type: type || 'application/octet-stream',
        size: buffer.length,
      })
    }

    return response.badRequest({ message: 'No file uploaded' })
  }

  async show({ params, response }: HttpContext) {
    const fileName = params.fileName
    const filePath = app.makePath('public/uploads', fileName)
    return response.download(filePath, false)
  }
}
