import { HistoryModel, IHistoryDocument } from '../models/history.model'
import { IHistory, HistorySchemaDefine } from '../commons/history.types'
import { Logger } from '../utils/logger'
import { Request, Response } from 'express'

const LIST_COUNT = 100
const logger = Logger.instance.logger

export const append = (data: IHistory): void => {
  const history = new HistoryModel(data)

  try {
    history.save()
  } catch (err) {
    logger?.error(err)
  }
}

export const getPairWeekData = async (
  difiName: string,
  pairId: string
): Promise<IHistoryDocument[]> => {
  try {
    const histories = await HistoryModel.find({
      [HistorySchemaDefine.DEFI_NAME]: difiName,
      [HistorySchemaDefine.PAIR_ID]: pairId,
    })
      .sort({ [HistorySchemaDefine.CREATED]: -1 })
      .limit(6)

    return histories
  } catch (err) {
    logger?.error(err)
    return err
  }
}

export const list = async (req: Request, res: Response): Promise<void> => {
  // const release = await defiSyncher.instance.mutex.acquire()
  try {
    if (!(typeof req.query.name === 'string')) {
      res.status(400).send()
      return
    }

    const histories = await HistoryModel.find({
      [HistorySchemaDefine.DEFI_NAME]: req.query.name,
    })
      .sort({ [HistorySchemaDefine.CREATED]: -1 })
      .limit(LIST_COUNT * 2)

    const shurinked = removeDucplicate(histories)

    const sorted = shurinked
      .sort((a, b): number => {
        return b.reserveUSD - a.reserveUSD
      })
      .slice(0, LIST_COUNT)

    res.json(sorted)
  } catch (err) {
    logger?.error(err)
    res.status(500).send()
  } finally {
    // release()
  }
}

function removeDucplicate(source: IHistory[]): IHistory[] {
  const pairNameArray = [] as string[]

  const dist = source.filter((data) => {
    if (pairNameArray.includes(data.pairName)) {
      return false
    } else {
      pairNameArray.push(data.pairName)
      return true
    }
  })

  return dist
}
