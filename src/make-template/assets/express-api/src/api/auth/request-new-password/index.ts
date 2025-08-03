import { randomUUID } from 'crypto'
import zod from 'zod'
import { Outcome } from '@design-edito/tools/agnostic/misc/outcome'
import { isNonNullObject } from '@design-edito/tools/agnostic/objects/is-object'
import { unknownToString } from '@design-edito/tools/agnostic/errors/unknown-to-string'
import { Duration } from '@design-edito/tools/agnostic/time/duration'
import * as Database from '../../../database'
import * as Email from '../../../email'
import { EMAILER_EMAIL, EMAILER_NAME, ROOT_USER_ID } from '../../../env'
import { makeFailureOutcome, Codes } from '../../../errors'
import { LocalUserModel } from '../../../schema/user'
import { UserPasswordRenewalTokenModel } from '../../../schema/user-password-renewal-token'
import { makeEndpoint, nullAuthenticator } from '../../utils'

export type ExpectedBody = {
  email: string
}

export const requestNewPassword = makeEndpoint<ExpectedBody, {}>(
  /* Authentication */
  nullAuthenticator,

  /* Validation */
  async req => {
    const { body } = req
    if (!isNonNullObject(body)) return makeFailureOutcome(Codes.INVALID_REQUEST_BODY, body, 'Must be an object')
    const validationSchema = zod.object({ email: zod.string().email('Invalid email format') })
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
    const foundUser = await Database.findOne(LocalUserModel, { email: body.email }, { initiatorId: ROOT_USER_ID })
    if (!foundUser.success) return makeFailureOutcome(Codes.USER_EMAIL_DOES_NOT_EXIST, body.email)
    await Database.deleteMany(UserPasswordRenewalTokenModel, { email: body.email }, { initiatorId: ROOT_USER_ID })
    const token = randomUUID()
    const now = Date.now()
    const tokenLifetimeMs = Duration.hours(1).toMilliseconds()
    const expiresOn = new Date(now + tokenLifetimeMs)
    const tokenSaved = await Database.insertOne(
      UserPasswordRenewalTokenModel,
      { value: token, email: body.email, expiresOn },
      { initiatorId: ROOT_USER_ID }
    )
    if (!tokenSaved.success) return tokenSaved
    const emailBody = Email.makeUserPasswordRenewalTokenBody(body.email, token)
    await Email.send(
      EMAILER_EMAIL,
      EMAILER_NAME,
      foundUser.payload.email,
      foundUser.payload.username,
      'New password request',
      emailBody)
    return Outcome.makeSuccess({})
  }
)
