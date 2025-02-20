import bcrypt from 'bcrypt'
import zod from 'zod'
import { isNonNullObject } from '@design-edito/tools/agnostic/objects/is-object'
import { Outcome } from '@design-edito/tools/agnostic/misc/outcome'
import { unknownToString } from '@design-edito/tools/agnostic/errors/unknown-to-string'
import * as Database from '../../../database'
import { ROOT_USER_ID } from '../../../env'
import { makeFailureOutcome, Codes } from '../../../errors'
import { LocalUserModel } from '../../../schema/user'
import { UserPasswordRenewalTokenModel } from '../../../schema/user-password-renewal-token'
import { makeEndpoint, nullAuthenticator } from '../../utils'

export type ExpectedBody = {
  email: string
  token: string
  password: string
}

export const submitNewPassword = makeEndpoint<ExpectedBody, {}>(
  nullAuthenticator,
  
  async req => {
    const { body } = req
    if (!isNonNullObject(body)) return makeFailureOutcome(Codes.INVALID_REQUEST_BODY, body, 'Must be an object')
    const validationSchema = zod.object({
      email: zod.string().email('Invalid email format'),
      token: zod.string(),
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

  async body => {
    const deletedToken = await Database.deleteOne(
      UserPasswordRenewalTokenModel,
      { value: body.token, email: body.email, expiresOn: { $gte: Date.now() } },
      { initiatorId: ROOT_USER_ID }
    )
    if (!deletedToken.success) return makeFailureOutcome(Codes.USER_PASSWORD_RENEWAL_TOKEN_DOES_NOT_EXIST, body.email, body.token)
    const foundUser = await Database.findOne(
      LocalUserModel,
      { email: body.email },
      { initiatorId: ROOT_USER_ID }
    )
    if (!foundUser.success) return makeFailureOutcome(Codes.USER_EMAIL_DOES_NOT_EXIST, body.email)
    const updatedUser = await Database.updateOne(
      LocalUserModel,
      { _id: foundUser.payload._id },
      { $set: { password: await bcrypt.hash(body.password, 10) } },
      { initiatorId: ROOT_USER_ID }
    )
    if (!updatedUser.success) return updatedUser
    return Outcome.makeSuccess({})
  }
)