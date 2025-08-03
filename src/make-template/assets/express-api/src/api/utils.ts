import { randomUUID } from 'node:crypto'
import { RequestHandler, Router } from 'express'
import { Outcome } from '@design-edito/tools/agnostic/misc/outcome'
import { unknownToString } from '@design-edito/tools/agnostic/errors/unknown-to-string'
import { Codes, register } from '../errors'
import {
  Validator,
  Processor,
  Handler,
  FailureResponseBody,
  SuccessResponseBody,
  Endpoint,
  Authenticator
} from './types'

declare global {
  namespace Express {
    interface Locals {
      requestId?: string
      requestTimestamp?: number
    }
  }
}

function makeHandler <
  ReqBody extends object = {},
  Output extends object = {},
  ValidationErrCodes extends Codes = Codes,
  ProcessingErrCodes extends Codes = Codes
>(authenticator: Authenticator,
  validator: Validator<ReqBody, ValidationErrCodes>,
  processor: Processor<ReqBody, Output, ProcessingErrCodes>
): Handler<Output, ValidationErrCodes, ProcessingErrCodes> {
  const handler: Handler<Output, ValidationErrCodes, ProcessingErrCodes> = async (req, res) => {
    const requestMeta = {
      // This only works because Jwt.authenticate is used before this
      userId: res.locals.accessTokenPayload?.userId ?? null,
      requestId: randomUUID(),
      timestamp: Date.now()
    }
    res.locals.requestId = requestMeta.requestId
    res.locals.requestTimestamp = requestMeta.timestamp
    try {
      const authenticated = await authenticator(req, res)
      if (!authenticated.success) {
        const { code } = authenticated.error
        if (code === Codes.USER_NOT_AUTHENTICATED) res.status(401)
        else if (code === Codes.USER_DOES_NOT_EXIST) res.status(401)
        else res.status(403)
        const responseCore = Outcome.makeFailure(authenticated.error)
        const response: FailureResponseBody<never, never> = {
          ...responseCore,
          meta: requestMeta
        }
        res.json(response)
        return
      }

      const validated = await validator(req, res)
      if (!validated.success) {
        const errorData = validated.error
        const responseCore = Outcome.makeFailure(errorData)
        const response: FailureResponseBody<ValidationErrCodes, never> = {
          ...responseCore,
          meta: requestMeta
        }
        res.status(400).json(response)
        return
      }
      const processed = await processor(validated.payload, req, res)
      if (!processed.success) {
        const errorData = processed.error
        const responseCore = Outcome.makeFailure(errorData)
        const response: FailureResponseBody<never, ProcessingErrCodes> = {
          ...responseCore,
          meta: requestMeta
        }
        // [WIP] maybe find a better logic err.code => res.status 
        res.status(422).json(response)
        return
      }
      const responsePayload = processed.payload
      const responseCore = Outcome.makeSuccess(responsePayload)
      const response: SuccessResponseBody<Output> = {
        ...responseCore,
        meta: requestMeta
      }
      res.status(200).json(response)
    } catch (err) {
      const errorString = unknownToString(err)
      const errorData = register.getErrorData(Codes.UNKNOWN_ERROR, errorString)
      const responseCore = Outcome.makeFailure(errorData)
      const response: FailureResponseBody<never, Codes.UNKNOWN_ERROR> = {
        ...responseCore,
        meta: requestMeta
      }
      res.status(500).json(response)
    }
  }
  return handler
}

export function makeEndpoint<
  ReqBody extends object = {},
  Output extends object = {},
  ValidationErrCodes extends Codes = Codes,
  ProcessingErrCodes extends Codes = Codes
>(
  authenticator: Authenticator,
  validator: Validator<ReqBody, ValidationErrCodes>,
  processor: Processor<ReqBody, Output, ProcessingErrCodes>
): Endpoint<ReqBody, Output, ValidationErrCodes, ProcessingErrCodes> {
  return {
    authenticator,
    validator,
    processor,
    handler: makeHandler(authenticator, validator, processor)
  }
}

export const nullAuthenticator: Authenticator = () => Outcome.makeSuccess(true)
export const nullValidator: Validator = () => Outcome.makeSuccess({})

const methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] as const
type Method = (typeof methods)[number]
const isMethod = (str: string): str is Method => methods.includes(str as Method)

export function makeRouter<T extends { [key: string]: Endpoint<any, any, any, any> }> (endpoints: T) {
  const router = Router()
  Object.entries(endpoints).forEach(([path, endpoint]) => {
    const [method, ...actualPathChunks] = path.split(':')
    const isValidMethod = method !== undefined && isMethod(method)
    if (!isValidMethod) {
      const errorMessage = `${method} is not a valid HTTP method. @${path}.`
      throw new Error(errorMessage)
    }
    const actualPath = actualPathChunks.join(':') // [WIP] check if heading slash is needed
    const handler: RequestHandler = endpoint.handler
    if (method === 'GET') return router.get(actualPath, handler)
    if (method === 'POST') return router.post(actualPath, handler)
    if (method === 'PUT') return router.put(actualPath, handler)
    if (method === 'DELETE') return router.delete(actualPath, handler)
    return router.options(actualPath, handler)
  })
  return router
}
