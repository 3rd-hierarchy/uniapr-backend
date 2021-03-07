import { Schema } from "mongoose"

export module HistorySchemaDefine {
  export const ID = '_id'
  export const DEFI_NAME = 'defiName'
  export const PAIR_NAME = 'pairName'
  export const PAIR_ID = 'pairId'
  export const RESERVED_USD = 'reserveUSD'
  export const VOLUME_USD = 'volumeUSD'
  export const APR = 'apr'
  export const APR_WEEK = 'aprWeek'
  export const CREATED = 'created'
}

export const HistorySchema = new Schema({
  [HistorySchemaDefine.PAIR_NAME]: {
    type: String
  },
  [HistorySchemaDefine.DEFI_NAME]: {
    type: String,
  },
  [HistorySchemaDefine.PAIR_ID]: {
    type: String
  },
  [HistorySchemaDefine.RESERVED_USD]: {
    type: Number
  },
  [HistorySchemaDefine.VOLUME_USD]: {
    type: Number
  },
  [HistorySchemaDefine.APR]: {
    type: Number 
  },
  [HistorySchemaDefine.APR_WEEK]: {
    type: Number
  },
  [HistorySchemaDefine.CREATED]: {
    type: Date,
    default: () => new Date
  }
},
{capped: {size: 100 * 1024 * 1024, max: 100000}})
