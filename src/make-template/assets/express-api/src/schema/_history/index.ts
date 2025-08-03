import Zlib from 'node:zlib'
import {
  Types as MongooseTypes,
  Schema as MongooseSchema,
  Document as MongooseDocument,
  CallbackWithoutResultAndOptionalError as MongooseCallbackWithoutResultAndOptionalError
} from 'mongoose'
import { unknownToString } from '@design-edito/tools/agnostic/errors/unknown-to-string'
import { DocumentWithLocals, QueryWithLocals } from '../../database'

// Document
export type IHistoryItem = {
  updationTime: Date
  updaterId: MongooseTypes.ObjectId,
  stringifiedDocument: string
}
export type IHistory = Array<IHistoryItem>

export type WithHistory<T> = T & { _history: IHistory }
export type WithoutHistory<T> = Omit<T, '_history'> & { _history?: undefined }

// Schema
export const HistoryItemSchema = new MongooseSchema<IHistoryItem>({
  updationTime: { type: Date, required: true },
  updaterId: { type: MongooseSchema.ObjectId, required: true },
  stringifiedDocument: { type: String, required: true }
})

export async function makeHistoryItem (document: MongooseDocument, initiatorObjectId: MongooseTypes.ObjectId): Promise<IHistoryItem> {
  const docAsObject = document.toObject()
  const coreEntries = Object.entries(docAsObject).filter(([key]) => !key.startsWith('_'))
  const strippedToCore = Object.fromEntries(coreEntries)
  const stringified = JSON.stringify(strippedToCore)
  const compressed = await new Promise<Buffer>((resolve, reject) => {
    Zlib.gzip(stringified, (err, compressed) => {
      if (err !== null) return reject(err)
      return resolve(compressed)
    })
  })
  const base64 = compressed.toString('base64')
  const historyItem: IHistoryItem = {
    updationTime: new Date(),
    updaterId: initiatorObjectId,
    stringifiedDocument: base64
  }
  return historyItem
}

export function withHistory<T extends Object> (inputSchema: MongooseSchema<T>): MongooseSchema<WithHistory<T>> {
  const schema = inputSchema.clone() as MongooseSchema<WithHistory<T>>
  schema.add(new MongooseSchema<WithHistory<{}>>({
    _history: {
      type: [HistoryItemSchema],
      required: true,
      default: []
    }
  }))
  schema.pre('save', handleSave)
  schema.pre('insertMany', handleInsertMany)
  schema.pre('updateOne', handleUpdate)
  schema.pre('findOneAndUpdate', handleUpdate)

  async function handleSave (
    this: WithHistory<DocumentWithLocals<{}>>,
    next: MongooseCallbackWithoutResultAndOptionalError
  ) {
    const context = this.$locals?.context
    const initiatorId = context?.initiatorId ?? null
    const initiatorObjectId = initiatorId !== null ? new MongooseTypes.ObjectId(initiatorId) : null
    if (initiatorObjectId === null) return next(new Error('initiatorId is required in context for save operation.'))
    try {
      const historyItem = await makeHistoryItem(this, initiatorObjectId)
      if (this.isNew) { this._history = [historyItem] }
      else this._history.push(historyItem)
      next()
    } catch (err) {
      const errStr = unknownToString(err)
      next(new Error(errStr))
    }
  }

  async function handleInsertMany (
    next: MongooseCallbackWithoutResultAndOptionalError,
    docs: WithHistory<DocumentWithLocals<{}>>[]
  ) {
    try {
      for (const doc of docs) {
        const context = doc.$locals?.context
        const initiatorId = context?.initiatorId ?? null
        const initiatorObjectId = initiatorId !== null ? new MongooseTypes.ObjectId(initiatorId) : null
        if (initiatorObjectId === null) return next(new Error('initiatorId is required in context for insertMany operation.'))
        const historyItem = await makeHistoryItem(doc, initiatorObjectId)
        doc._history = [historyItem]
      }
      next()
    } catch (err) {
      const errStr = unknownToString(err)
      next(new Error(errStr))
    }
  }

  async function handleUpdate (
    this: QueryWithLocals<WithHistory<{}>>,
    next: MongooseCallbackWithoutResultAndOptionalError
  ) {
    const context = this.getOptions().$locals?.context;
    const initiatorId = context?.initiatorId ?? null;
    const initiatorObjectId = initiatorId !== null ? new MongooseTypes.ObjectId(initiatorId) : null;
    if (initiatorObjectId === null) return next(new Error('initiatorId is required in context for update operation.'))
    try {
      const docPromise = this.model.findOne(this.getFilter()).exec() as Promise<WithHistory<MongooseDocument> | null>
      const doc = await docPromise
      if (doc === null) return next(new Error('Document not found for update.'))
      const historyItem = await makeHistoryItem(doc, initiatorObjectId)
      doc._history.push(historyItem)
      this.set({ _history: doc._history })
      next()
    } catch (err) {
      const errStr = unknownToString(err)
      next(new Error(errStr))
    }
  }
  return schema
}
