import dotenv from 'dotenv'

dotenv.config()

const MODE = process.env.MODE as 'development' | 'production'
const HOST = process.env.HOST as string
const DB_USR = process.env.DB_USR as string
const DB_PWD = process.env.DB_PWD as string
const DB_URL = process.env.DB_URL as string
const DB_OPT = process.env.DB_OPT as string
const DB_RESERVED_AGENDA_JOBS_COLLECTION_NAME = process.env.DB_RESERVED_AGENDA_JOBS_COLLECTION_NAME as string
const ROOT_USER_ID = process.env.ROOT_USER_ID as string
const ROOT_USER_NAME = process.env.ROOT_USER_NAME as string
const ROOT_USER_EMAIL = process.env.ROOT_USER_EMAIL as string
const ROOT_USER_PWD = process.env.ROOT_USER_PWD as string
const USER_EMAIL_VALIDATION_TOKEN_LIFETIME_MINUTES = process.env.USER_EMAIL_VALIDATION_TOKEN_LIFETIME_MINUTES as string
const JWT_SECRET = process.env.JWT_SECRET as string
const ACCESS_TOKEN_EXPIRATION_SECONDS = parseFloat(process.env.ACCESS_TOKEN_EXPIRATION_SECONDS as string)
const ACCESS_TOKEN_RENEWAL_THRESHOLD_SECONDS = parseFloat(process.env.ACCESS_TOKEN_RENEWAL_THRESHOLD_SECONDS as string)
const REFRESH_TOKEN_EXPIRATION_SECONDS = parseFloat(process.env.REFRESH_TOKEN_EXPIRATION_SECONDS as string)
const ACCESS_TOKEN_MAX_REFRESH_COUNT = parseFloat(process.env.ACCESS_TOKEN_MAX_REFRESH_COUNT as string)
const REFRESH_TOKEN_MAX_REFRESH_COUNT = parseFloat(process.env.REFRESH_TOKEN_MAX_REFRESH_COUNT as string)
const MAILERSEND_API_KEY = process.env.MAILERSEND_API_KEY as string
const EMAILER_EMAIL = process.env.EMAILER_EMAIL as string
const EMAILER_NAME = process.env.EMAILER_NAME as string

function kill (message: string) {
  console.log(message) // [WIP] replace all app's console.logs with actual logger calls
  throw process.exit(1) // It's too early in this file to use await Init.shutdown(1)
}

if (typeof MODE !== 'string') { kill('.env/MODE field must be a string') }
if (typeof HOST !== 'string') { kill('.env/HOST field must be a string') }
else if (MODE !== 'development' && MODE !== 'production') { kill('.env/MODE field must be either "development" or "production"') }
else if (typeof DB_USR !== 'string') { kill('.env/DB_USR field must be a string') }
else if (typeof DB_PWD !== 'string') { kill('.env/DB_PWD field must be a string') }
else if (typeof DB_URL !== 'string') { kill('.env/DB_URL field must be a string') }
else if (typeof DB_OPT !== 'string') { kill('.env/DB_OPT field must be a string') }
else if (typeof DB_RESERVED_AGENDA_JOBS_COLLECTION_NAME !== 'string') { kill('.env/DB_RESERVED_AGENDA_JOBS_COLLECTION_NAME field must be a string') }
else if (typeof ROOT_USER_ID !== 'string') { kill('.env/ROOT_USER_ID field must be a string') }
else if (typeof ROOT_USER_NAME !== 'string') { kill('.env/ROOT_USER_NAME field must be a string') }
else if (typeof ROOT_USER_EMAIL !== 'string') { kill('.env/ROOT_USER_EMAIL field must be a string') }
else if (typeof ROOT_USER_PWD !== 'string') { kill('.env/ROOT_USER_PWD field must be a string') }
else if (typeof USER_EMAIL_VALIDATION_TOKEN_LIFETIME_MINUTES !== 'string') { kill('.env/USER_EMAIL_VALIDATION_TOKEN_LIFETIME_MINUTES field must be a string') }
else if (typeof JWT_SECRET !== 'string') { kill('.env/JWT_SECRET field must be a string') }
else if (typeof ACCESS_TOKEN_EXPIRATION_SECONDS !== 'number' || Number.isNaN(ACCESS_TOKEN_EXPIRATION_SECONDS)) { kill('.env/ACCESS_TOKEN_EXPIRATION_SECONDS field must be a number') }
else if (typeof ACCESS_TOKEN_RENEWAL_THRESHOLD_SECONDS !== 'number' || Number.isNaN(ACCESS_TOKEN_RENEWAL_THRESHOLD_SECONDS)) { kill('.env/ACCESS_TOKEN_RENEWAL_THRESHOLD_SECONDS field must be a number') }
else if (typeof REFRESH_TOKEN_EXPIRATION_SECONDS !== 'number' || Number.isNaN(REFRESH_TOKEN_EXPIRATION_SECONDS)) { kill('.env/REFRESH_TOKEN_EXPIRATION_SECONDS field must be a number') }
else if (typeof ACCESS_TOKEN_MAX_REFRESH_COUNT !== 'number' || Number.isNaN(ACCESS_TOKEN_MAX_REFRESH_COUNT)) { kill('.env/ACCESS_TOKEN_MAX_REFRESH_COUNT field must be a number') }
else if (typeof REFRESH_TOKEN_MAX_REFRESH_COUNT !== 'number' || Number.isNaN(REFRESH_TOKEN_MAX_REFRESH_COUNT)) { kill('.env/REFRESH_TOKEN_MAX_REFRESH_COUNT field must be a number') }
else if (typeof MAILERSEND_API_KEY !== 'string') { kill('.env/MAILERSEND_API_KEY field must be a string') }
else if (typeof EMAILER_EMAIL !== 'string') { kill('.env/EMAILER_EMAIL field must be a string') }
else if (typeof EMAILER_NAME !== 'string') { kill('.env/EMAILER_NAME field must be a string') }

export {
  MODE,
  HOST,
  DB_USR,
  DB_PWD,
  DB_URL,
  DB_OPT,
  DB_RESERVED_AGENDA_JOBS_COLLECTION_NAME,
  ROOT_USER_ID,
  ROOT_USER_NAME,
  ROOT_USER_EMAIL,
  ROOT_USER_PWD,
  USER_EMAIL_VALIDATION_TOKEN_LIFETIME_MINUTES,
  JWT_SECRET,
  ACCESS_TOKEN_EXPIRATION_SECONDS,
  ACCESS_TOKEN_RENEWAL_THRESHOLD_SECONDS,
  REFRESH_TOKEN_EXPIRATION_SECONDS,
  ACCESS_TOKEN_MAX_REFRESH_COUNT,
  REFRESH_TOKEN_MAX_REFRESH_COUNT,
  MAILERSEND_API_KEY,
  EMAILER_EMAIL,
  EMAILER_NAME
}
