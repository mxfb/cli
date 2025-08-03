import {
  Types as MongooseTypes,
  Schema as MongooseSchema,
  CallbackWithoutResultAndOptionalError as MongooseCallbackWithoutResultAndOptionalError,
  UpdateQuery as MongooseUpdateQuery
} from 'mongoose'
import { DocumentWithLocals, QueryWithLocals } from '../../database'
import { ROOT_USER_ID } from '../../env'
import { unknownToString } from '@design-edito/tools/agnostic/errors/unknown-to-string'

// Document
export type IMeta = {
  creationTime: Date
  creatorId: MongooseTypes.ObjectId
  lastUpdationTime: Date
  lastUpdaterId: MongooseTypes.ObjectId
  currentVersionNumber: number
}
export type WithMeta<T> = T & { _meta: IMeta }
export type WithoutMeta<T> = Omit<T, '_meta'> & { _meta?: undefined }

// Schema
export const MetaSchema = new MongooseSchema<IMeta>({
  creationTime: { type: Date, required: true },
  creatorId: { type: MongooseSchema.ObjectId, required: true },
  lastUpdationTime: { type: Date, required: true },
  lastUpdaterId: { type: MongooseSchema.ObjectId, required: true },
  currentVersionNumber: { type: Number, required: true }
})

export function withMeta<T extends Object> (inputSchema: MongooseSchema<T>): MongooseSchema<WithMeta<T>> {
  const schema = inputSchema.clone() as MongooseSchema<WithMeta<T>>
  schema.add(new MongooseSchema<WithMeta<{}>>({
    _meta: {
      type: MetaSchema,
      required: true,
      default: {
        creationTime: new Date(),
        creatorId: new MongooseTypes.ObjectId(ROOT_USER_ID),
        lastUpdationTime: new Date(),
        lastUpdaterId: new MongooseTypes.ObjectId(ROOT_USER_ID),
        currentVersionNumber: 0
      }
    }
  }))
  schema.pre('save', handleSave)
  schema.pre('insertMany', handleInsertMany)
  schema.pre('updateOne', handleUpdate)
  schema.pre('findOneAndUpdate', handleUpdate)

  function handleSave (
    this: WithMeta<DocumentWithLocals<{}>>,
    next: MongooseCallbackWithoutResultAndOptionalError
  ) {
    const context = this.$locals?.context
    const initiatorId = context?.initiatorId ?? null
    const initiatorObjectId = initiatorId !== null ? new MongooseTypes.ObjectId(initiatorId) : null
    if (initiatorObjectId === null) return next(new Error('initiatorId is required in context for save operation.'))
    if (this.isNew) {
      this._meta.creationTime = new Date()
      this._meta.creatorId = initiatorObjectId
    }
    this._meta.lastUpdationTime = new Date()
    this._meta.lastUpdaterId = initiatorObjectId
    this._meta.currentVersionNumber = 0
    next()
  }

  function handleInsertMany (
    next: MongooseCallbackWithoutResultAndOptionalError,
    docs: Array<WithMeta<DocumentWithLocals<{}>>>
  ) {
    try {
      for (const doc of docs) {
        const context = doc.$locals?.context
        const initiatorId = context?.initiatorId ?? null
        const initiatorObjectId = initiatorId !== null ? new MongooseTypes.ObjectId(initiatorId) : null
        if (initiatorObjectId === null) return next(new Error('initiatorId is required in context for insertMany operation.'))
        doc._meta.creationTime = new Date()
        doc._meta.creatorId = initiatorObjectId
        doc._meta.lastUpdationTime = new Date()
        doc._meta.lastUpdaterId = initiatorObjectId
        doc._meta.currentVersionNumber = 0
      }
      next()
    } catch (err) {
      const errStr = unknownToString(err)
      next(new Error(errStr))
    }
  }

  function handleUpdate (
    this: QueryWithLocals<WithMeta<{}>>,
    next: MongooseCallbackWithoutResultAndOptionalError
  ) {
    const context = this.getOptions().$locals?.context
    const initiatorId = context?.initiatorId ?? null
    const initiatorObjectId = initiatorId !== null ? new MongooseTypes.ObjectId(initiatorId) : null
    if (initiatorObjectId === null) return next(new Error('initiatorId is required in context for save operation.'))
    const rawUpdate = this.getUpdate()
    if (Array.isArray(rawUpdate)) return next(new Error('Aggregation pipeline updates are not supported in this hook.'))
    const update: MongooseUpdateQuery<WithMeta<{}>> = (rawUpdate ?? {}) as MongooseUpdateQuery<WithMeta<{}>>
    update.$set = update.$set ?? {}
    update.$inc = update.$inc ?? {}
    update.$set['_meta.lastUpdationTime'] = new Date()
    update.$set['_meta.lastUpdaterId'] = initiatorObjectId
    update.$inc['_meta.currentVersionNumber'] = ((update.$inc['_meta.currentVersionNumber'] as number) ?? 0) + 1
    this.setUpdate(update)
    next()
  }

  return schema
}
