import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { Outcome } from '@design-edito/tools/agnostic/misc/outcome'
import { isNonNullObject } from '@design-edito/tools/agnostic/objects/is-object'
import * as Database from '../database'
import {
  MODE,
  JWT_SECRET,
  ACCESS_TOKEN_EXPIRATION_SECONDS,
  REFRESH_TOKEN_EXPIRATION_SECONDS,
  ACCESS_TOKEN_RENEWAL_THRESHOLD_SECONDS,
  ACCESS_TOKEN_MAX_REFRESH_COUNT,
  ROOT_USER_ID
} from '../env'
import { BaseUserModel } from '../schema/user'
import { UserRevokedTokenModel } from '../schema/user-revoked-auth-token'

declare global {
  namespace Express {
    interface Locals {
      accessTokenSigned?: string
      accessTokenPayload?: Payload
      refreshTokenSigned?: string
      refreshTokenPayload?: Payload
    }
  }
}

type Payload = {
  userId: string
  exp: number
  refreshCount: number
}

export function isValidPayload (payload: unknown): payload is Payload {
  if (!isNonNullObject(payload)) return false
  if (!('userId' in payload)) return false
  if (typeof payload.userId !== 'string') return false
  if (!('exp' in payload)) return false
  if (typeof payload.exp !== 'number') return false
  if (!('refreshCount' in payload)) return false
  if (typeof payload.refreshCount !== 'number') return false
  return true
}

export async function generateAccessToken (userId: string, refreshCount: number) {
  const foundUser = await Database.findOne(BaseUserModel, { _id: userId }, { initiatorId: ROOT_USER_ID })
  if (!foundUser.success) return foundUser
  const payload: Omit<Payload, 'exp'> = { userId, refreshCount }
  const options: jwt.SignOptions = { expiresIn: ACCESS_TOKEN_EXPIRATION_SECONDS }
  return Outcome.makeSuccess(jwt.sign(payload, JWT_SECRET, options))
}

export async function generateRefreshToken (userId: string, refreshCount: number) {
  const foundUser = await Database.findOne(BaseUserModel, { _id: userId }, { initiatorId: ROOT_USER_ID })
  if (!foundUser.success) return foundUser
  const payload: Omit<Payload, 'exp'> = { userId, refreshCount }
  const options: jwt.SignOptions = { expiresIn: REFRESH_TOKEN_EXPIRATION_SECONDS }
  return Outcome.makeSuccess(jwt.sign(payload, JWT_SECRET, options))
}

export async function authenticate (req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (authHeader === undefined || !authHeader.startsWith('Bearer ')) return next()
  const token = authHeader.split(' ')[1]
  if (token === undefined) return next()
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const validated = isValidPayload(decoded)
    if (!validated) return next()
    const now = Math.floor(Date.now() / 1000)
    const { userId, exp, refreshCount } = decoded
    const accessTokenAlmostStale = exp - now < ACCESS_TOKEN_RENEWAL_THRESHOLD_SECONDS
    const accessTokenCanRenew = refreshCount < ACCESS_TOKEN_MAX_REFRESH_COUNT
    const accessTokenShouldRenew = accessTokenAlmostStale && accessTokenCanRenew
    if (accessTokenShouldRenew) {
      const foundRevokedToken = await Database.findOne(
        UserRevokedTokenModel,
        { value: token },
        { initiatorId: ROOT_USER_ID }
      )
      if (foundRevokedToken.success) return next()
      const newToken = generateAccessToken(userId, refreshCount + 1)
      res.setHeader('Authorization', `Bearer ${newToken}`)
    }
    res.locals.accessTokenSigned = token
    res.locals.accessTokenPayload = decoded
    return next()
  } catch (err) {
    // [WIP] Maybe log something ?
    return next()
  }
}

export function attachAccessTokenToRes (res: Response, token: string) {
  res.setHeader('Authorization', `Bearer ${token}`)
}

export function attachRefreshTokenToRes (res: Response, token: string) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: MODE === 'production',
    sameSite: 'strict'
  })
}
