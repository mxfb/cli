import {
  Schema as MongooseSchema,
  model as mongooseModel,
  Document as MongooseDocument,
  ValidatorProps as MongooseValidatorProps
} from 'mongoose'
import { isEmail, isSlug } from 'validator'
import * as _History from '../_history'
import * as _Meta from '../_meta'

// Imports
type WithHistory<T> = _History.WithHistory<T>
type WithMeta<T> = _Meta.WithMeta<T>

const { withHistory } = _History
const { withMeta } = _Meta

export enum Role {
  ROOT = 'root',
  ADMIN = 'admin',
  USER = 'user'
}

export enum Status {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned'
}

// Document
export type IBaseUserCore = {
  username: string
  role: Role
  status: Status
}

export type IGoogleUserCore = IBaseUserCore & {
  googleId: string
}

export type ILocalUserCore = IBaseUserCore & {
  email: string
  password: string
  verified: boolean
}

export type IBaseUser = WithMeta<WithHistory<IBaseUserCore>>
export type IGoogleUser = WithMeta<WithHistory<IGoogleUserCore>>
export type ILocalUser = WithMeta<WithHistory<ILocalUserCore>>

export type IUser = IGoogleUser | ILocalUser

// Schema
const emailValidator = (input: string) => isEmail(input)
const emailValidationErrMessage = (props: MongooseValidatorProps) => `${props.value} is not a valid email address.`
const usernameValidator = (input: string) => isSlug(input.toLowerCase())
const usernameValidationErrMessage = (props: MongooseValidatorProps) => `${props.value} is not a valid username. Alphanumeric, hyphens and underscore (non starting nor trailing, non consecutive) characters only.`

export const BaseUserCoreSchema = new MongooseSchema<IBaseUserCore>({
  username: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: usernameValidator,
      message: usernameValidationErrMessage
    }
  },
  role: {
    type: String,
    enum: Object.values(Role),
    required: true,
    default: Role.USER
  },
  status: {
    type: String,
    enum: Object.values(Status),
    required: true,
    default: Status.ACTIVE
  }
}, { discriminatorKey: 'authType', _id: false })

export const BaseUserSchema: MongooseSchema<IBaseUser> = withMeta(withHistory(BaseUserCoreSchema))

export const LocalUserCoreSchema = new MongooseSchema<ILocalUserCore>({
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: emailValidator,
      message: emailValidationErrMessage
    }
  },
  password: {
    type: String,
    required: true
  },
  verified: {
    type: Boolean,
    required: true,
    default: false
  }
})

export const GoogleUserCoreSchema = new MongooseSchema<IGoogleUserCore>({
  googleId: {
    type: String,
    required: true,
    unique: true
  }
})

// Models
export const BaseUserModel = mongooseModel<IBaseUser>('User', BaseUserSchema)
export const LocalUserModel = BaseUserModel.discriminator<ILocalUser>('LocalUser', LocalUserCoreSchema)
export const GoogleUserModel = BaseUserModel.discriminator<IGoogleUser>('GoogleUser', GoogleUserCoreSchema)
