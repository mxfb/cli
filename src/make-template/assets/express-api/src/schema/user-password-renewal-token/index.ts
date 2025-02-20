import {
  Schema as MongooseSchema,
  model as mongooseModel
} from 'mongoose'

// Document
export type IUserPasswordRenewalToken = {
  value: string
  email: string
  expiresOn: Date
}

export const UserPasswordRenewalTokenSchema = new MongooseSchema<IUserPasswordRenewalToken>({
  value: { type: String, required: true },
  email: { type: String, required: true },
  expiresOn: { type: Date, required: true }
})

// Models
export const UserPasswordRenewalTokenModel = mongooseModel<IUserPasswordRenewalToken>('UserPasswordRenewalToken', UserPasswordRenewalTokenSchema)
