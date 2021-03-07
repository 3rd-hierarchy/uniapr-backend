import { model, Document, Model } from 'mongoose'
import { HistorySchemaDefine, HistorySchema } from './history.schema'

export interface IHistory {
  [HistorySchemaDefine.DEFI_NAME]: string,
  [HistorySchemaDefine.PAIR_NAME]: string,
  [HistorySchemaDefine.PAIR_ID]: string,
  [HistorySchemaDefine.RESERVED_USD]: number,
  [HistorySchemaDefine.VOLUME_USD]: number,
  [HistorySchemaDefine.APR]: number,
  [HistorySchemaDefine.APR_WEEK]: number,
  [HistorySchemaDefine.CREATED]?: Date
}

export interface IHistoryDocument extends IHistory, Document {}

export const HistoryModel = model<IHistoryDocument>("History", HistorySchema)