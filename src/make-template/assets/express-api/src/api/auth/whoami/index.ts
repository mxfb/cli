import { Outcome } from '@design-edito/tools/agnostic/misc/outcome'
import * as Database from '../../../database'
import { ROOT_USER_ID } from '../../../env'
import { Codes, makeFailureOutcome } from '../../../errors'
import { BaseUserModel, Role, Status } from '../../../schema/user'
import { UserRevokedTokenModel } from '../../../schema/user-revoked-auth-token'
import { makeEndpoint, nullAuthenticator, nullValidator } from '../../utils'

type BaseUserData = {
  _id: string
  username: string
  role: Role
  status: Status
}

type LocalUserData = BaseUserData & {
  email: string
  verified: boolean
}

type GoogleUserData = BaseUserData & {
  googleId: string
}

export type SuccessResponse = LocalUserData | GoogleUserData

export const whoami = makeEndpoint<{}, SuccessResponse>(
  nullAuthenticator,
  nullValidator,
  async (_body, _req, res) => {
    const { accessTokenSigned, accessTokenPayload } = res.locals
    // [WIP] probably better to do this in the authenticator ?
    // Then assume res.locals are not undefined here ?
    if (accessTokenPayload === undefined || accessTokenSigned === undefined) return makeFailureOutcome(Codes.USER_NOT_AUTHENTICATED, 'Access token has been revoked')
    const tokenUserId = accessTokenPayload.userId
    const foundRevokedToken = await Database.findOne(UserRevokedTokenModel, { value: accessTokenSigned }, { initiatorId: ROOT_USER_ID })
    if (foundRevokedToken.success) return makeFailureOutcome(Codes.USER_NOT_AUTHENTICATED, 'Access token has been revoked')
    const userLookup = await Database.findOne(BaseUserModel, { _id: tokenUserId }, { initiatorId: ROOT_USER_ID })
    if (!userLookup.success) return userLookup
    const { _id, username, role, status } = userLookup.payload
    if (
      'email' in userLookup.payload
      && 'verified' in userLookup.payload) {
      const email = userLookup.payload.email as string
      const verified = userLookup.payload.verified as boolean
      return Outcome.makeSuccess({
        _id: _id.toString(),
        username,
        email,
        role,
        status,
        verified
      })
    } else if ('googleId' in userLookup.payload) {
      const googleId = userLookup.payload.googleId as string
      return Outcome.makeSuccess({
        _id: _id.toString(),
        username,
        googleId,
        role,
        status
      })
    }
    // [WIP] what do here ? Send an email to the admin ?
    // probably better not to inform the end user
    return makeFailureOutcome(Codes.USER_DOES_NOT_EXIST, _id.toString())
  }
)