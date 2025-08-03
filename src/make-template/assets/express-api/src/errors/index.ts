import {
  FilterQuery as MongooseFilterQuery,
  Model as MongooseModel
} from 'mongoose'
import { Errors } from '@design-edito/tools/agnostic/errors'
import { Outcome } from '@design-edito/tools/agnostic/misc/outcome'

export enum Codes {
  // UNKNOWN
  UNKNOWN_ERROR = 'unknown-error',

  // AUTH
  USER_NOT_AUTHENTICATED = 'user-not-authenticated',
  USER_NOT_AUTHORIZED = 'user-not-authorized',
  USER_DOES_NOT_EXIST = 'user-does-not-exist',
  USER_EMAIL_DOES_NOT_EXIST = 'user-email-does-not-exist',
  USERNAME_ALREADY_TAKEN = 'username-already-taken',
  EMAIL_ADDRESS_ALREADY_TAKEN = 'email-address-already-taken',
  USER_EMAIL_VERIFICATION_TOKEN_NOT_PROVIDED = 'user-email-verification-token-not-provided',
  USER_EMAIL_VERIFICATION_TOKEN_DOES_NOT_EXIST = 'user-email-verification-token-does-not-exist',
  USER_EMAIL_VERIFICATION_PROCESS_FAILED = 'user-email-verification-process-failed',
  USER_EMAIL_ALREADY_VERIFIED = 'user-email-already-verified',
  INVALID_CREDENTIALS = 'invalid-credentials',
  USER_PASSWORD_RENEWAL_TOKEN_DOES_NOT_EXIST = 'user-password-renewal-token-does-not-exist',

  // REQUESTS
  INVALID_REQUEST_BODY = 'invalid-request-body',

  // DATABASE
  DB_ERROR = 'db-error',
  DB_NO_DOCUMENT_MATCHES_FILTER = 'db-no-document-matches-filter'
}

export const source = Errors.Register.makeSource({
  [Codes.UNKNOWN_ERROR]: {
    message: 'An unknown error occured',
    detailsMaker: (details?: string) => details
  },

  [Codes.USER_NOT_AUTHENTICATED]: {
    message: 'User must be authenticated.',
    detailsMaker: (details?: string) => details
  },

  [Codes.USER_NOT_AUTHORIZED]: {
    message: 'User has not sufficient permissions',
    detailsMaker: (details?: string) => details
  },

  [Codes.USER_DOES_NOT_EXIST]: {
    message: 'Impossible to retreive user information',
    detailsMaker: (userId: string) => ({ userId })
  },

  [Codes.USER_EMAIL_DOES_NOT_EXIST]: {
    message: 'This email is not tied to any user account.',
    detailsMaker: (email: string) => ({ email })
  },

  [Codes.USERNAME_ALREADY_TAKEN]: {
    message: 'This username is already taken',
    detailsMaker: (username: string) => ({ username })
  },

  [Codes.EMAIL_ADDRESS_ALREADY_TAKEN]: {
    message: 'This email address is already taken',
    detailsMaker: (email: string) => ({ email })
  },

  [Codes.USER_EMAIL_VERIFICATION_TOKEN_NOT_PROVIDED]: {
    message: 'This endpoint expects a token in the URL to process the validation',
    detailsMaker: () => undefined
  },

  [Codes.USER_EMAIL_VERIFICATION_TOKEN_DOES_NOT_EXIST]: {
    message: 'The email verification token provided does not exist',
    detailsMaker: () => undefined
  },

  [Codes.USER_EMAIL_VERIFICATION_PROCESS_FAILED]: {
    message: 'Something went wrong while updating the user verification status',
    detailsMaker: (details: string) => details
  },

  [Codes.USER_EMAIL_ALREADY_VERIFIED]: {
    message: 'This user already verified their email',
    detailsMaker: (email: string) => ({ email })
  },

  [Codes.INVALID_CREDENTIALS]: {
    message: 'The provided credentials are invalid',
    detailsMaker: () => undefined
  },

  [Codes.USER_PASSWORD_RENEWAL_TOKEN_DOES_NOT_EXIST]: {
    message: 'The password renewal token provided does not exist',
    detailsMaker: (email: string, token: string) => ({ email, token })
  },

  [Codes.INVALID_REQUEST_BODY]: {
    message: 'The request body provided could not be used for the operation',
    detailsMaker: ((body: any, error: string) => ({ body, error }))
  },

  [Codes.DB_ERROR]: {
    message: 'The database returned an error',
    detailsMaker: ((dbError: string) => ({ dbError }))
  },

  [Codes.DB_NO_DOCUMENT_MATCHES_FILTER]: {
    message: 'No document matches the provided filter',
    detailsMaker: <M extends MongooseModel<any>>(
      model: M,
      filter: MongooseFilterQuery<M extends MongooseModel<infer DocType> ? DocType : never>
    ) => ({ collection: model.name, filter })
  }
} as const)

export const register = Errors.Register.from(source)

export type ErrorData<Code extends Codes> = Errors.Register.ErrorData<typeof source, Code>

export function makeFailureOutcome<Code extends Codes> (
  code: Code,
  ...params: Errors.Register.DetailsMakerParams<typeof register.source, Code>) {
  const errData = register.getErrorData(code, ...params)
  return Outcome.makeFailure(errData)
}
