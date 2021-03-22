import * as log4js from 'log4js'
import { log4jsConfig } from '../config/config.log4js'

export class Logger {
  private static _self: Logger
  private _logger: log4js.Logger | null = null

  get logger(): log4js.Logger | null {
    return this._logger
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get accessLogger(): any {
    return log4js.connectLogger(log4js.getLogger('web'), {})
  }

  static get instance(): Logger {
    if (!this._self) {
      this._self = new Logger()
    }
    return this._self
  }

  private constructor() {
    log4js.configure(log4jsConfig)
    this._logger = log4js.getLogger()
  }
}
