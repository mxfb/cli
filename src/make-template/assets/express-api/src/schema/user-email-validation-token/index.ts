import {
  Schema as MongooseSchema,
  model as mongooseModel
} from 'mongoose'

// Document
export type IUserEmailValidationToken = {
  value: string
  email: string
  expiresOn: Date
}

export const UserEmailValidationTokenSchema = new MongooseSchema<IUserEmailValidationToken>({
  value: { type: String, required: true },
  email: { type: String, required: true },
  expiresOn: { type: Date, required: true }
})

// Models
export const UserEmailValidationTokenModel = mongooseModel<IUserEmailValidationToken>('UserEmailValidationToken', UserEmailValidationTokenSchema)
