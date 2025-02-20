import zod from 'zod'
import { Outcome } from '@design-edito/tools/agnostic/misc/outcome'
import { isNonNullObject } from '@design-edito/tools/agnostic/objects/is-object'
import { unknownToString } from '@design-edito/tools/agnostic/errors/unknown-to-string'
import * as Database from '../../../database'
import { ROOT_USER_ID } from '../../../env'
import { Codes, makeFailureOutcome } from '../../../errors'
import { UserEmailValidationTokenModel } from '../../../schema/user-email-validation-token'
import { LocalUserModel, Role, Status } from '../../../schema/user'
import { makeEndpoint, nullAuthenticator } from '../../utils'

export type ExpectedBody = {
  email: string
  token: string
}

export type SuccessResponse = {
  _id: string
  username: string
  email: string
  role: Role
  status: Status
  verified: boolean
}

export const verifyEmail = makeEndpoint<ExpectedBody, SuccessResponse>(
  /* Auth */
  nullAuthenticator,

  /* Validation */
  async req => {
    const { body } = req
    if (!isNonNullObject(body)) return makeFailureOutcome(Codes.INVALID_REQUEST_BODY, body, 'Must be an object')
    const validationSchema = zod.object({
      email: zod.string().email('Invalid email format'),
      token: zod.string()
    })
    try {
      const validated = validationSchema.parse(body)
      return Outcome.makeSuccess(validated)
    } catch (err) {
      const errStr = unknownToString(err)
      return makeFailureOutcome(Codes.INVALID_REQUEST_BODY, body, errStr)
    }
  },

  /* Process */
  async body => {
    const { email, token } = body
    if (token === undefined) return makeFailureOutcome(Codes.USER_EMAIL_VERIFICATION_TOKEN_NOT_PROVIDED)
    const now = new Date()
    const rootQueryContext = { initiatorId: ROOT_USER_ID }
    const tokenDeletion = await Database.deleteOne(
      UserEmailValidationTokenModel,
      { email, value: token, expiresOn: { $gte: now } },
      rootQueryContext
    )
    if (!tokenDeletion.success) return makeFailureOutcome(Codes.USER_EMAIL_VERIFICATION_TOKEN_DOES_NOT_EXIST)
    const userUpdation = await Database.updateOne(
      LocalUserModel,
      { email },
      { $set: { verified: true } },
      rootQueryContext
    )
    if (!userUpdation.success) return makeFailureOutcome(
      Codes.USER_EMAIL_VERIFICATION_PROCESS_FAILED,
      userUpdation.error.message
    )
    const updatedUser = userUpdation.payload
    return Outcome.makeSuccess({
      _id: updatedUser._id.toString(),
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
      verified: updatedUser.verified
    })
  }
)
