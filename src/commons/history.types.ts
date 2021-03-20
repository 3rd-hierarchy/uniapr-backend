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

