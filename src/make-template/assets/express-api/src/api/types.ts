import { Request, Response, RequestHandler } from 'express'
import { Outcome } from '@design-edito/tools/agnostic/misc/outcome'
import { Codes, ErrorData } from '../errors'
import { Endpoints } from '.'

type AsyncOrNot<T> = T | Promise<T>

export type Authenticator = (req: Request, res: Response) => AsyncOrNot<Outcome.Either<true, ErrorData<Codes.USER_NOT_AUTHENTICATED | Codes.USER_NOT_AUTHORIZED | Codes.USER_DOES_NOT_EXIST>>>

export type Validator<
  ReqBody extends object = {},
  Code extends Codes = Codes // [WIP] Maybe only Codes.INVALID_REQUEST_BODY here? Or split Codes into RequestValidatonErrorCodes and RequestProcessingErrorCodes
> = (req: Request, res: Response) => AsyncOrNot<Outcome.Either<ReqBody, ErrorData<Code>>>

export type Processor<
  ReqBody extends object = {},
  Output extends object = {},
  Code extends Codes = Codes
> = (body: ReqBody, req: Request, res: Response) => AsyncOrNot<Outcome.Either<Output, ErrorData<Code>>>

export type ResponseMetaData = {
  userId: string | null
  requestId: string
  timestamp: number
}

export type SuccessResponseBody<Output extends object = {}> = Outcome.Success<Output> & {
  meta: ResponseMetaData
}

export type FailureResponseBody<
  ValidationErrCode extends Codes = Codes,
  ProcessingErrCode extends Codes = Codes
> = Outcome.Failure<ErrorData<ValidationErrCode | ProcessingErrCode | Codes.USER_NOT_AUTHENTICATED | Codes.USER_NOT_AUTHORIZED | Codes.USER_DOES_NOT_EXIST | Codes.UNKNOWN_ERROR>> & {
  meta: ResponseMetaData
}

export type ResponseBody<
  Output extends object = {},
  ValidationErrCode extends Codes = Codes,
  ProcessingErrCode extends Codes = Codes
> = SuccessResponseBody<Output> | FailureResponseBody<ValidationErrCode, ProcessingErrCode>

export type Handler<
  Output extends object = {},
  ValidationErrCode extends Codes = Codes,
  ProcessingErrCode extends Codes = Codes
> = RequestHandler<{}, ResponseBody<Output, ValidationErrCode, ProcessingErrCode>, unknown>

export type Endpoint<
  ReqBody extends object = {},
  Output extends object = {},
  ValidationErrCodes extends Codes = Codes,
  ProcessingErrCodes extends Codes = Codes
> = {
  authenticator: Authenticator
  validator: Validator<ReqBody, ValidationErrCodes>
  processor: Processor<ReqBody, Output, ProcessingErrCodes>
  handler: Handler<Output, ValidationErrCodes, ProcessingErrCodes>
}

export type ExtractReqBody<T extends keyof typeof Endpoints> = typeof Endpoints[T] extends Endpoint<
  infer ReqBody,
  any,
  any,
  any
> ? ReqBody
  : never

export type ExtractResBody<T extends keyof typeof Endpoints> = typeof Endpoints[T] extends Endpoint<
  any,
  infer Output,
  infer ValidationErrCode,
  infer ProcessingErrCode
> ? ResponseBody<Output, ValidationErrCode, ProcessingErrCode>
  : never