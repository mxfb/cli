import {
  Schema as MongooseSchema,
  model as mongooseModel
} from 'mongoose'

// Document
export type IUserRevokedToken = {
  value: string
  revokedOn: Date
}

// Schema
export const UserRevokedTokenSchema = new MongooseSchema<IUserRevokedToken>({
  value: {
    type: String,
    required: true,
    unique: true
  },
  revokedOn: {
    type: Date,
    required: true
  }
})

// Model
export const UserRevokedTokenModel = mongooseModel<IUserRevokedToken>('UserRevokedToken', UserRevokedTokenSchema)
