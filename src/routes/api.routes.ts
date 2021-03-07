import * as express from 'express'

import * as historyController from '../controllers/history.controller'

export const router = express.Router()

router.route('/api/history')
  .get(historyController.list)
