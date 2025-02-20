import { randomUUID } from 'crypto'
import { Duration } from '@design-edito/tools/agnostic/time/duration'
import { Logs } from '@design-edito/tools/agnostic/misc/logs'
import * as Database from '../../../database'
import * as Email from '../../../email'
import {
  USER_EMAIL_VALIDATION_TOKEN_LIFETIME_MINUTES,
  EMAILER_EMAIL,
  EMAILER_NAME,
  ROOT_USER_ID
} from '../../../env'
import {
  IUserEmailValidationToken,
  UserEmailValidationTokenModel
} from '../../../schema/user-email-validation-token'

export async function createAndSendUserEmailValidationToken (email: string, username: string) {
  const tokenLifetimeMinutes = parseInt(USER_EMAIL_VALIDATION_TOKEN_LIFETIME_MINUTES)
  const tokenLifetimeMs = Duration.minutes(tokenLifetimeMinutes).toMilliseconds()
  const tokenExpiresOnTimestamp = Date.now() + tokenLifetimeMs
  const tokenExpiresOn = new Date(tokenExpiresOnTimestamp)
  const tokenValue = randomUUID()
  const tokenDocument: IUserEmailValidationToken = {
    email,
    value: tokenValue,
    expiresOn: tokenExpiresOn,
  }
  const tokenInserted = await Database.insertOne(UserEmailValidationTokenModel, tokenDocument, { initiatorId: ROOT_USER_ID })
  if (!tokenInserted.success) {
    console.log(Logs.styles.error('Token not inserted'))
    console.log(Logs.styles.regular(tokenInserted.error.message))
    console.log(tokenInserted.error.details)
    // [WIP] what do here ?
    // send mail to admin ?
    // Retry ?
    // Send fallback mail to user something like 'request a new token' ?
    // Do nothing and try create and send token again when trying to login ?
  }
  const emailBody = Email.makeUserEmailVerificationTokenBody(username, tokenValue)
  return await Email.send(
    EMAILER_EMAIL,
    EMAILER_NAME,
    email,
    username,
    'Validate your email',
    emailBody)
}
