import {
  connect as mongooseConnect,
  disconnect as mongooseDisconnect,
  Model as MongooseModel,
  FilterQuery as MongooseFilterQuery,
  RootFilterQuery as MongooseRootFilterQuery,
  Document as MongooseDocument,
  Query as MongooseQuery,
  UpdateQuery as MongooseUpdateQuery
} from 'mongoose'
import { unknownToString } from '@design-edito/tools/agnostic/errors/unknown-to-string'
import { Logs } from '@design-edito/tools/agnostic/misc/logs'
import { Outcome } from '@design-edito/tools/agnostic/misc/outcome'
import { DB_USR, DB_PWD, DB_URL, DB_OPT } from '../env'
import { Codes, makeFailureOutcome } from '../errors'

/* * * * * * * * * * * * * * * * * *
 *
 * UTILITY
 *
 * * * * * * * * * * * * * * * * * */
export interface QueryWithLocals<T, R = T | null> extends MongooseQuery<T, R> {
  getOptions(): {
    $locals?: {
      context?: OperationContext
    }
  }
}

/* * * * * * * * * * * * * * * * * *
 *
 * CONNECTION / DISCONNECTION
 *
 * * * * * * * * * * * * * * * * * */
export const connectionString = `mongodb+srv://${DB_USR}:${DB_PWD}@${DB_URL}/?${DB_OPT}`
export async function connect () {
  try {
    await mongooseConnect(connectionString)
    console.log(Logs.styles.important('Mongoose connected'))
  } catch (err) {
    console.log(Logs.styles.error(unknownToString(err)))
  }
}

export async function disconnect() {
  try {
    await mongooseDisconnect()
    console.log(Logs.styles.important('Mongoose disconnected'))
  } catch (err) {
    console.log(Logs.styles.error(unknownToString(err)))
  }
}

/* * * * * * * * * * * * * * * * * *
 *
 * OPERATIONS
 *
 * * * * * * * * * * * * * * * * * */
export type OperationContext = {
  initiatorId: string | null
}

export interface DocumentWithLocals<T> extends MongooseDocument<T> {
  $locals: {
    context?: OperationContext
  }
}

export async function insertOne<T> (
  model: MongooseModel<T>,
  data: Partial<T>,
  context: OperationContext
) {
  try {
    const doc = new model(data)
    doc.$locals = { context }
    const saved = await doc.save()
    return Outcome.makeSuccess(saved.toObject())
  } catch (err) {
    return makeFailureOutcome(Codes.DB_ERROR, unknownToString(err))
  }
}

export async function insertMany<T> (
  model: MongooseModel<T>,
  data: Partial<T>[],
  context: OperationContext
) {
  try {
    const docs = data.map(d => {
      const doc = new model(d)
      doc.$locals = { context }
      return doc
    })
    const saved = await model.insertMany(docs)
    return Outcome.makeSuccess(saved.map(d => d.toObject()))
  } catch (err) {
    return makeFailureOutcome(Codes.DB_ERROR, unknownToString(err))
  }
}

export async function findOne<T> (
  model: MongooseModel<T>,
  filter: MongooseFilterQuery<T>,
  context: OperationContext
) {
  try {
    const found = await model
      .findOne(filter)
      .setOptions({ $locals: { context } })
      .exec()
    return found === null
      ? makeFailureOutcome(Codes.DB_NO_DOCUMENT_MATCHES_FILTER, model, filter)
      : Outcome.makeSuccess(found.toObject())
  } catch (err) {
    return makeFailureOutcome(Codes.DB_ERROR, unknownToString(err))
  }
}

export async function updateOne<T> (
  model: MongooseModel<T>,
  filter: MongooseRootFilterQuery<T>,
  update: MongooseUpdateQuery<T>,
  context: OperationContext
) {
  try {
    const updated = await model
      .findOneAndUpdate(filter, update, { new: true })
      .setOptions({ $locals: { context } })
      .exec()
    return updated === null
      ? makeFailureOutcome(Codes.DB_NO_DOCUMENT_MATCHES_FILTER, model, filter)
      : Outcome.makeSuccess(updated.toObject())
  } catch (err) {
    return makeFailureOutcome(Codes.DB_ERROR, unknownToString(err))
  }
}

export async function deleteOne<T> (
  model: MongooseModel<T>,
  filter: MongooseRootFilterQuery<T>,
  context: OperationContext
) {
  try {
    const deleted = await model
      .findOneAndDelete(filter)
      .setOptions({ $locals: { context } })
      .exec()
    return deleted === null
      ? makeFailureOutcome(Codes.DB_NO_DOCUMENT_MATCHES_FILTER, model, filter)
      : Outcome.makeSuccess(deleted.toObject())
  } catch (err) {
    return makeFailureOutcome(Codes.DB_ERROR, unknownToString(err))
  }
}

export async function deleteMany<T> (
  model: MongooseModel<T>,
  filter: MongooseRootFilterQuery<T>,
  context: OperationContext
) {
  try {
    const deleted = await model
      .deleteMany(filter)
      .setOptions({ $locals: { context } })
      .exec()
    return deleted.deletedCount === 0
      ? makeFailureOutcome(Codes.DB_NO_DOCUMENT_MATCHES_FILTER, model, filter)
      : Outcome.makeSuccess({ deleted: deleted.deletedCount })
  } catch (err) {
    return makeFailureOutcome(Codes.DB_ERROR, unknownToString(err))
  }
}