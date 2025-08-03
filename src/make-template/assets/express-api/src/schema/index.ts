import { Schema as MongooseSchema, model as mongooseModel } from 'mongoose'
import { Outcome } from '@design-edito/tools/agnostic/misc/outcome'
import { unknownToString } from '@design-edito/tools/agnostic/errors/unknown-to-string'

export async function validate<T> (
  schema: MongooseSchema<T>,
  object: unknown
): Promise<Outcome.Either<T, string>> {
  const Model = mongooseModel('', schema)
  const doc = new Model(object)
  try {
    await doc.validate()
    return Outcome.makeSuccess(object as T)
  } catch (err) {
    return Outcome.makeFailure(unknownToString(err))
  }
}
