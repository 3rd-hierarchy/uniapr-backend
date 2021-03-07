import { config } from './config/config'
import { app } from './express'
import * as mongoose from 'mongoose'
import { Logger } from './utils/logger'

mongoose.connect(config['mongoUri'], {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true
}).catch((err) => {
  Logger.instance.logger?.error('Mongo db connection faild. (%s)', err)
})

mongoose.connection.on('error', () => {
  throw new Error(`unable to connect to database: ${config['mongoUri']}`)
})

app.listen(config['port'], () => {
  Logger.instance.logger?.info('Server started on port %s.', config['port'])
})
