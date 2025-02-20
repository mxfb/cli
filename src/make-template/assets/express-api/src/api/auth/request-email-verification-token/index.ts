import zod from 'zod'
import { Outcome } from '@design-edito/tools/agnostic/misc/outcome'
import { isNonNullObject } from '@design-edito/tools/agnostic/objects/is-object'
import { unknownToString } from '@design-edito/tools/agnostic/errors/unknown-to-string'
import * as Database from '../../../database'
import { ROOT_USER_ID } from '../../../env'
import { Codes, makeFailureOutcome } from '../../../errors'
import { LocalUserModel } from '../../../schema/user'
import { UserEmailValidationTokenModel } from '../../../schema/user-email-validation-token'
import { makeEndpoint, nullAuthenticator } from '../../utils'
import { createAndSendUserEmailValidationToken } from '../_utils'

export type ExpectedBody = { email: string }

export const requestEmailVerificationToken = makeEndpoint<ExpectedBody, {}>(
  /* Auth */
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
    const { email } = body
    const userLookup = await Database.findOne(LocalUserModel, { email }, { initiatorId: ROOT_USER_ID })
    if (!userLookup.success) return makeFailureOutcome(Codes.USER_EMAIL_DOES_NOT_EXIST, email)
    const tokensDeletion = await Database.deleteMany(UserEmailValidationTokenModel, { email }, { initiatorId: ROOT_USER_ID })
    if (!tokensDeletion.success) { /* [WIP] what do ? */ }
    const userData = userLookup.payload
    if (userData.verified === true) return makeFailureOutcome(Codes.USER_EMAIL_ALREADY_VERIFIED, email) // [WIP] maybe this discloses user data?
    await createAndSendUserEmailValidationToken(email, userData.username)
    return Outcome.makeSuccess({})
  }
)
