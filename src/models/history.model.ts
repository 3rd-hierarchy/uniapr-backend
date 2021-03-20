import { model, Document } from 'mongoose'
import { HistorySchema } from './history.schema'
import { IHistory } from '../commons/history.types'


export interface IHistoryDocument extends IHistory, Document {}

export const HistoryModel = model<IHistoryDocument>("History", HistorySchema)