import { Schema } from 'mongoose'
import { HistorySchemaDefine } from '../commons/history.types'

export const HistorySchema = new Schema(
  {
    [HistorySchemaDefine.PAIR_NAME]: {
      type: String,
    },
    [HistorySchemaDefine.DEFI_NAME]: {
      type: String,
    },
    [HistorySchemaDefine.PAIR_ID]: {
      type: String,
    },
    [HistorySchemaDefine.RESERVED_USD]: {
      type: Number,
    },
    [HistorySchemaDefine.VOLUME_USD]: {
      type: Number,
    },
    [HistorySchemaDefine.APR]: {
      type: Number,
    },
    [HistorySchemaDefine.APR_WEEK]: {
      type: Number,
    },
    [HistorySchemaDefine.CREATED]: {
      type: Date,
      default: () => new Date(),
    },
  },
  { capped: { size: 100 * 1024 * 1024, max: 100000 } }
)
