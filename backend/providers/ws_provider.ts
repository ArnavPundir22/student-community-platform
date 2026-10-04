import type { ApplicationService } from '@adonisjs/core/types'
import WsService from '#services/ws_service'

export default class WsProvider {
  constructor(protected app: ApplicationService) {}

  async ready() {
    if (this.app.getEnvironment() === 'web') {
      const server = await this.app.container.make('server')
      if (server.getNodeServer()) {
        WsService.boot(server.getNodeServer()!)
      }
    }
  }
}
