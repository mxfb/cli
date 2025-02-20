import { Outcome } from '@design-edito/tools/agnostic/misc/outcome'
import * as Database from '../../../database'
import { ROOT_USER_ID } from '../../../env'
import { Codes, makeFailureOutcome } from '../../../errors'
import { BaseUserModel } from '../../../schema/user'
import { UserRevokedTokenModel } from '../../../schema/user-revoked-auth-token'
import { makeEndpoint, nullValidator } from '../../utils'

export const logout = makeEndpoint<{}, {}>(
  /* Authentication */
  async (_req, res) => {
    // [WIP] this generic "user authed and exists" stuff will have to live elsewhere
    const { accessTokenPayload, accessTokenSigned } = res.locals
    if (accessTokenPayload === undefined) return makeFailureOutcome(Codes.USER_NOT_AUTHENTICATED, 'No access token provided')
    const { userId, exp } = accessTokenPayload
    const now = Date.now()
    const tokenHasExpired = now >= exp * 1000
    if (tokenHasExpired) return makeFailureOutcome(Codes.USER_NOT_AUTHENTICATED, 'Access token has expired')
    const foundRevokedToken = await Database.findOne(UserRevokedTokenModel, { value: accessTokenSigned }, { initiatorId: ROOT_USER_ID })
    if (foundRevokedToken.success) return makeFailureOutcome(Codes.USER_NOT_AUTHENTICATED, 'Access token has been revoked')
    const foundUser = await Database.findOne(BaseUserModel, { _id: userId }, { initiatorId: ROOT_USER_ID })
    if (!foundUser.success) return makeFailureOutcome(Codes.USER_DOES_NOT_EXIST, `Could not find a user with id ${userId}`)
    return Outcome.makeSuccess(true)
  },

  /* Validation */
  nullValidator,

  /* Process */
  async (_body, _req, res) => {
    const { accessTokenSigned, refreshTokenSigned } = res.locals
    const now = new Date()
    const toRevoke = [accessTokenSigned, refreshTokenSigned]
      .filter(token => token !== undefined)
      .map(token => ({ value: token, revokedOn: now }))
    if (toRevoke.length === 0) return Outcome.makeSuccess({})
    const blacklisted = await Database.insertMany(
      UserRevokedTokenModel,
      toRevoke,
      { initiatorId: ROOT_USER_ID }
    )
    if (!blacklisted.success) return blacklisted
    return Outcome.makeSuccess({})
  }
)
