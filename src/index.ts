import { config } from './config/config'
import { app } from './express'
import * as mongoose from 'mongoose'
import { Logger } from './utils/logger'
import * as cluster from 'cluster'

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

var numCPUs = require('os').cpus().length;
if (cluster.isMaster) {
  for (var i = 0; i < numCPUs; i++) {
    // Create a worker
    cluster.fork();
  }
} else {
  app.listen(config['port'], () => {
    Logger.instance.logger?.info('Server started on port %s.', config['port'])
  })
}

cluster.on('exit', function (worker, code, signal) {
  console.log('Worker %d died with code/signal %s. Restarting worker...', worker.process.pid, signal || code);
  cluster.fork();
})
