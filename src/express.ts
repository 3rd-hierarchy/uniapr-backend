import * as express from 'express'
import { json, urlencoded } from 'body-parser'
import * as compress from 'compression'
// import * as cors from 'cors'
import * as helmet from 'helmet'
import * as path from 'path'

import { router as ApiRouter } from './routes/api.routes'
import { Logger } from './utils/logger'

export const app: express.Express = express()

const CURRENT_WORKING_DIR = process.cwd()
app.use('/public', express.static(path.join(CURRENT_WORKING_DIR, 'public')))

app.use(json())
app.use(urlencoded({ extended: true }))
app.use(compress())
app.use(helmet())
// app.use(cors())

app.use(Logger.instance.accessLogger)

app.use('/', ApiRouter)

app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: express.NextFunction
  ) => {
    if (err) {
      res.status(400).json({ error: err.name + ': ' + err.message })
      console.log(err)
    }
  }
)

app.get('*', (req, res) => {
  res.setHeader(
    'Content-Security-Policy',
    "script-src 'self' 'unsafe-inline' apis.google.com www.gstatic.com www.googletagmanager.com"
  )
  res
    .status(200)
    .sendFile(path.join(CURRENT_WORKING_DIR, 'public/client/index.html'))
})
