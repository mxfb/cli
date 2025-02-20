import bcrypt from 'bcrypt'
import validator from 'validator'
import zod from 'zod'
import { Outcome } from '@design-edito/tools/agnostic/misc/outcome'
import { unknownToString } from '@design-edito/tools/agnostic/errors/unknown-to-string'
import { isNonNullObject } from '@design-edito/tools/agnostic/objects/is-object'
import * as Database from '../../../database'
import { Codes, makeFailureOutcome } from '../../../errors'
import { ROOT_USER_ID } from '../../../env'
import * as Jwt from '../../../jwt'
import { Role, Status, LocalUserModel } from '../../../schema/user'
import { makeEndpoint, nullAuthenticator } from '../../utils'

export type ExpectedBody = {
  email: string
  password: string
} | {
  username: string
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

export const login = makeEndpoint<ExpectedBody, SuccessResponse>(
  /* Authentication */
  nullAuthenticator,

  /* Validation */
  async req => {
    const { body } = req
    if (!isNonNullObject(body)) return makeFailureOutcome(Codes.INVALID_REQUEST_BODY, body, 'Must be an object')
    if ('email' in body) {
      const withEmailSchema = zod.object({
        email: zod.string().email('Invalid email format'),
        password: zod.string().min(1, 'Password must be at least one character long')
      })
      try {
        const withEmailValidated = withEmailSchema.parse(body)
        return Outcome.makeSuccess(withEmailValidated)
      } catch (err) {
        const errStr = unknownToString(err)
        return makeFailureOutcome(Codes.INVALID_REQUEST_BODY, body, errStr)
      }
    } else if ('username' in body) {
      const withUsernameSchema = zod.object({
        username: zod.string()
          .min(1)
          .refine(input => validator.isSlug(input.toLowerCase()), {
            message: 'Username must contain alphanumeric or non starting, trailing nor consecutive hyphens or underscores'
          }),
        password: zod.string().min(1, 'Password must be at least one character long')
      })
      try {
        const withUsernameValidated = withUsernameSchema.parse(body)
        return Outcome.makeSuccess(withUsernameValidated)
      } catch (err) {
        const errStr = unknownToString(err)
        return makeFailureOutcome(Codes.INVALID_REQUEST_BODY, body, errStr)
      }
    } else {
      return makeFailureOutcome(Codes.INVALID_REQUEST_BODY, body, 'Missing username or email property')
    }
  },

  /* Process */
  async (body, _req, res) => {
    const { password } = body
    const query = 'email' in body ? { email: body.email } : { username: body.username }
    const foundUser = await Database.findOne(LocalUserModel, query, { initiatorId: ROOT_USER_ID })
    if (!foundUser.success) {
      const err = foundUser.error
      if (err.code === Codes.DB_ERROR) return foundUser
      return makeFailureOutcome(Codes.INVALID_CREDENTIALS)
    }
    const passwordsMatch = await bcrypt.compare(password, foundUser.payload.password)
    if (!passwordsMatch) return makeFailureOutcome(Codes.INVALID_CREDENTIALS)
    const userData = foundUser.payload
    const userId = userData._id.toString()
    const accessToken = await Jwt.generateAccessToken(userId, 0)
    const refreshToken = await Jwt.generateRefreshToken(userId, 0)
    if (!accessToken.success) return accessToken // [WIP] maybe wrap this into a less verbose error?
    if (!refreshToken.success) return refreshToken // [WIP] maybe wrap this into a less verbose error?
    Jwt.attachAccessTokenToRes(res, accessToken.payload)
    Jwt.attachRefreshTokenToRes(res, refreshToken.payload)
    return Outcome.makeSuccess({
      _id: userId,
      username: userData.username,
      email: userData.email,
      role: userData.role,
      status: userData.status,
      verified: userData.verified
    })
  }
)
