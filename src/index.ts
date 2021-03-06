import { config } from './config/config'
import { app } from './express'
import * as mongoose from 'mongoose'
import { Logger } from './utils/logger'

app.listen(config['port'], () => {
  Logger.instance.logger?.info('Server started on port %s.', config['port'])
})

mongoose.connect(config['mongoUri'], {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true
})

mongoose.connection.on('error', () => {
  throw new Error(`unable to connect to database: ${config['mongoUri']}`)
})