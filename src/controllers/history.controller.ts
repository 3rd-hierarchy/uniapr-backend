import { Mutex } from "async-mutex";
import { UniswapSyncher } from "../batch/uniswapSync";
import { HistoryModel, IHistory, IHistoryDocument } from "../models/history.model";
import { HistorySchemaDefine } from "../models/history.schema";
import { Logger } from "../utils/logger"
import { Request, Response, NextFunction } from 'express'

const LIST_COUNT = 100
const logger = Logger.instance.logger

export const append = (data: IHistory) => {
  let history = new HistoryModel(data)

  try {
    history.save()
  } catch (err) {
    logger?.error(err)
  }
}

export const getPairWeekData = async (difiName: string, pairId: string): Promise<IHistoryDocument[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      let histories = await HistoryModel.find(
        {
          [HistorySchemaDefine.DEFI_NAME]: difiName,
          [HistorySchemaDefine.PAIR_ID]: pairId
        }
      ).sort(
        { [HistorySchemaDefine.CREATED]: -1 }
      ).limit(7)

      resolve(histories)
    } catch (err) {
      logger?.error(err)
      reject(err)
    }
  })
}

export const list = async (req: Request, res: Response) => {
  const release = await UniswapSyncher.instance.mutex.acquire()
  try {
    let histories = await HistoryModel.find().sort(
      {[HistorySchemaDefine.CREATED]: -1, [HistorySchemaDefine.RESERVED_USD]: -1}
      ).limit(LIST_COUNT)
    
      res.json({
        list: histories
      })
  } catch (err) {
    logger?.error(err)
    return res.status(400)
  } finally {
    release()
  }
}