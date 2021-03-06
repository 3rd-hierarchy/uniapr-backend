import {config} from './config/config'
import {app} from './express'
import * as mongoose from 'mongoose'

app.listen(config['port'], () => {
  console.info('Server started on port %s.', config['port'])
})

mongoose.connect(config['mongoUri'], {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true
})

mongoose.connection.on('error', () => {
  throw new Error(`unable to connect to database: ${config['mongoUri']}`)
})