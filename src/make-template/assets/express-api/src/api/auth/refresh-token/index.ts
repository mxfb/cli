import jwt from 'jsonwebtoken'
import { Outcome } from '@design-edito/tools/agnostic/misc/outcome'
import { unknownToString } from '@design-edito/tools/agnostic/errors/unknown-to-string'
import * as Database from '../../../database'
import { JWT_SECRET, REFRESH_TOKEN_MAX_REFRESH_COUNT, ROOT_USER_ID } from '../../../env'
import { Codes, makeFailureOutcome } from '../../../errors'
import * as Jwt from '../../../jwt'
import { BaseUserModel } from '../../../schema/user'
import { makeEndpoint, nullValidator } from '../../utils'
import { UserRevokedTokenModel } from '../../../schema/user-revoked-auth-token'

export const refreshToken = makeEndpoint<{}, {}>(

  /* Authentication */
  async (req, res) => {
    const refreshToken = req.cookies?.refreshToken
    const tokenIsString = typeof refreshToken === 'string'
    const foundRevokedToken = await Database.findOne(UserRevokedTokenModel, { value: refreshToken }, { initiatorId: ROOT_USER_ID })
    if (foundRevokedToken.success) return makeFailureOutcome(Codes.USER_NOT_AUTHENTICATED, 'Refresh token has been revoked')
    if (!tokenIsString) return makeFailureOutcome(Codes.USER_NOT_AUTHENTICATED, 'No refresh token provided')
    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET)
      if (!Jwt.isValidPayload(decoded)) return makeFailureOutcome(Codes.USER_NOT_AUTHENTICATED, 'Malformed refresh token')
      const { userId, exp, refreshCount } = decoded
      const now = Math.floor(Date.now() / 1000)
      const tokenHasExpired = now >= exp
      if (tokenHasExpired) return makeFailureOutcome(Codes.USER_NOT_AUTHENTICATED, 'Refresh token has expired')
      if (refreshCount >= REFRESH_TOKEN_MAX_REFRESH_COUNT) return makeFailureOutcome(Codes.USER_NOT_AUTHENTICATED, 'Refresh token has reached maximum refresh count')
      const foundUser = await Database.findOne(BaseUserModel, { _id: userId }, { initiatorId: ROOT_USER_ID })
      if (!foundUser.success) return makeFailureOutcome(Codes.USER_DOES_NOT_EXIST, `Could not find a user with id ${userId}`)
      res.locals.refreshTokenSigned = refreshToken
      res.locals.refreshTokenPayload = decoded
    } catch (err) {
      return makeFailureOutcome(Codes.USER_NOT_AUTHENTICATED, `Bad refresh token: ${unknownToString(err)}`)
    }
    return Outcome.makeSuccess(true)
  },
  
  /* Request body validation (none) */
  nullValidator,
  
  /* Process request */
  async (_body, _req, res) => {
    if (res.locals.refreshTokenPayload === undefined) return makeFailureOutcome(Codes.USER_NOT_AUTHENTICATED, 'Refresh token has expired')
    const { userId, refreshCount } = res.locals.refreshTokenPayload
    const newAccessToken = await Jwt.generateAccessToken(userId, 0)
    const newRefreshToken = await Jwt.generateRefreshToken(userId, refreshCount + 1)
    if (!newAccessToken.success) return newAccessToken // [WIP] maybe wrap this into a less verbose error?
    if (!newRefreshToken.success) return newRefreshToken // [WIP] maybe wrap this into a less verbose error?
    Jwt.attachAccessTokenToRes(res, newAccessToken.payload)
    Jwt.attachRefreshTokenToRes(res, newRefreshToken.payload)
    return Outcome.makeSuccess({})
  }
)
