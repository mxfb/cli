import bcrypt from 'bcrypt'
import validator from 'validator'
import zod from 'zod'
import { Outcome } from '@design-edito/tools/agnostic/misc/outcome'
import { isNonNullObject } from '@design-edito/tools/agnostic/objects/is-object'
import { unknownToString } from '@design-edito/tools/agnostic/errors/unknown-to-string'
import { Logs } from '@design-edito/tools/agnostic/misc/logs'
import * as Database from '../../../database'
import { ROOT_USER_ID } from '../../../env'
import { Codes, makeFailureOutcome } from '../../../errors'
import { BaseUserModel, LocalUserModel, GoogleUserModel, Role, Status } from '../../../schema/user'
import { makeEndpoint, nullAuthenticator } from '../../utils'
import { createAndSendUserEmailValidationToken } from '../_utils'

export type ExpectedBody = {
  username: string
  email: string
  password: string
}

export type SuccessResponse = {
  _id: string
  username: string
  email: string
  role: Role
  status: Status
  verified: boolean
}

export const signup = makeEndpoint<ExpectedBody, SuccessResponse>(
  /* Authentication (none) */
  nullAuthenticator,

  /* Body validation */
  async req => {
    const { body } = req
    if (!isNonNullObject(body)) return makeFailureOutcome(Codes.INVALID_REQUEST_BODY, body, 'Must be an object')
    const validationSchema = zod.object({
      username: zod.string()
        .min(1)
        .refine(input => validator.isSlug(input.toLowerCase()), {
          message: 'Username must contain alphanumeric or non starting, trailing nor consecutive hyphens or underscores'
        }),
      email: zod.string().email('Invalid email format'),
      password: zod.string().min(1, 'Password must be at least one character long')
    })
    try {
      const validated = validationSchema.parse(body)
      return Outcome.makeSuccess(validated)
    } catch (err) {
      const errStr = unknownToString(err)
      return makeFailureOutcome(Codes.INVALID_REQUEST_BODY, body, errStr)
    }
  },

  /* Process request */
  async body => {
    const { username, email, password } = body
    const rootQueryContext: Database.OperationContext = { initiatorId: ROOT_USER_ID }
    const foundUsername = await Database.findOne(BaseUserModel, { username }, rootQueryContext)
    if (foundUsername.success) return makeFailureOutcome(Codes.USERNAME_ALREADY_TAKEN, username)
    const foundEmail = await Database.findOne(GoogleUserModel, { email }, rootQueryContext)
    if (foundEmail.success) return makeFailureOutcome(Codes.EMAIL_ADDRESS_ALREADY_TAKEN, email)
    const inserted = await Database.insertOne(
      LocalUserModel,
      {
        username,
        role: Role.USER,
        status: Status.ACTIVE,
        email,
        password: await bcrypt.hash(password, 10),
        verified: false
      },
      rootQueryContext
    )
    if (!inserted.success) return inserted
    // Create validation token, store it, send email
    const sent = await createAndSendUserEmailValidationToken(email, username)
    const strippedUserData: SuccessResponse = {
      _id: inserted.payload._id.toString(),
      username: inserted.payload.username,
      email: inserted.payload.email,
      role: inserted.payload.role,
      status: inserted.payload.status,
      verified: inserted.payload.verified
    }
    if (sent.success) return Outcome.makeSuccess(strippedUserData)
    else {
      console.log(Logs.styles.error('Email not sent'))
      console.log(Logs.styles.regular(unknownToString(sent.error)))
      // [WIP] what do here ?
      // send mail to admin ?
      // Retry ?
      // Send fallback mail to user something like "request a new token" ?
      // Do nothing and try create and send token again when trying to login ?
      return Outcome.makeSuccess(strippedUserData)
    }
  }
)
