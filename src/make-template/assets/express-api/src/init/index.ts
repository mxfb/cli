import Agenda from 'agenda'
import { Types as MongooseTypes } from 'mongoose'
import { Logs } from '@design-edito/tools/agnostic/misc/logs'
import { unknownToString } from '@design-edito/tools/agnostic/errors/unknown-to-string'
import { Duration } from '@design-edito/tools/agnostic/time/duration'
import * as Database from'../database'
import {
  ROOT_USER_ID,
  ROOT_USER_PWD,
  ROOT_USER_EMAIL,
  ROOT_USER_NAME,
  DB_RESERVED_AGENDA_JOBS_COLLECTION_NAME,
  REFRESH_TOKEN_EXPIRATION_SECONDS
} from '../env'
import * as User from '../schema/user'
import { UserEmailValidationTokenModel } from '../schema/user-email-validation-token'
import { UserPasswordRenewalTokenModel } from '../schema/user-password-renewal-token'
import { UserRevokedTokenModel } from '../schema/user-revoked-auth-token'

export async function ensureRootUser () {
  console.log(Logs.styles.info('Ensuring ROOT user...'))
  try {
    // [WIP] use Database helpers here ?
    const rootUsersViaRole = await User.LocalUserModel.find({ role: User.Role.ROOT }).exec()
    const rootUsersViaId = await User.LocalUserModel.find({ _id: ROOT_USER_ID }).exec()
    const rootUsersWithDuplicates = [...rootUsersViaRole, ...rootUsersViaId]
    const rootUsersIdsSet = new Set(rootUsersWithDuplicates.map(usr => usr._id.toString()))

    // No ROOT user found
    if (rootUsersIdsSet.size === 0) {
      const newRootUser = new User.LocalUserModel({
        _id: new MongooseTypes.ObjectId(ROOT_USER_ID),
        username: ROOT_USER_NAME,
        email: ROOT_USER_EMAIL,
        password: ROOT_USER_PWD,
        role: User.Role.ROOT,
        status: User.Status.ACTIVE,
        verified: true
      })
      const rootUserInserted = await Database.insertOne<User.ILocalUser>(
        User.LocalUserModel,
        newRootUser,
        { initiatorId: ROOT_USER_ID }
      )
      if (!rootUserInserted.success) {
        console.log(Logs.styles.danger('Something went wrong while creating ROOT user. Shutting down'))
        const { message, details } = rootUserInserted.error
        console.log(Logs.styles.error(message))
        console.log(Logs.styles.error(details.dbError))
        return await shutdown(1)
      }
      console.log(Logs.styles.important('ROOT user created'))
      return
    }

    // Many ROOT users found
    if (rootUsersIdsSet.size > 1) {
      console.log(Logs.styles.danger('Multiple ROOT users found, shutting down'))
      return await shutdown(1)
    }

    // Single ROOT user found
    console.log(Logs.styles.regular('ROOT user exists'))

  } catch (err) {
    console.log(Logs.styles.danger('An unknown error occured while initing the database'))
    console.log(Logs.styles.error(unknownToString(err)))
    return await shutdown(1)
  }
}

let agenda: Agenda | null = null
async function startAgenda (): Promise<void> {
  if (agenda !== null) return;
  agenda = new Agenda()
  agenda.database(Database.connectionString, DB_RESERVED_AGENDA_JOBS_COLLECTION_NAME)
  agenda.processEvery('1 minute')
  await new Promise<void>((resolve, reject) => {
    agenda!.once('ready', resolve)
    agenda!.once('error', reject)
  })
  await agenda.start()
}

async function scheduleCronTask (name: string, interval: string, worker: () => void | Promise<void>) {
  try {
    await startAgenda()
    agenda!.define(name, worker)
    await agenda!.every(interval, name)
  } catch (err) {
    console.log(Logs.styles.danger('An unknown error occured while initing the cron tasks'))
    console.log(Logs.styles.error(unknownToString(err)))
    return await shutdown(1)
  }
}

export async function scheduleCronTasks () {
  await scheduleCronTask('ENSURE_ROOT_USER', '1 minute', () => ensureRootUser())
  await scheduleCronTask('CLEANUP_USER_EMAIL_VERIFICATION_TOKENS', '5 minutes', async () => {
    const now = new Date()
    const deleted = await Database.deleteMany(
      UserEmailValidationTokenModel,
      { expiresOn: { $lt: now } },
      { initiatorId: ROOT_USER_ID }
    )
    if (!deleted.success) return; // [WIP] what to do with the error ? Send mail ?
    return
  })
  await scheduleCronTask('CLEANUP_USER_REVOKED_AUTH_TOKENS', '5 minutes', async () => {
    const now = Date.now()
    const refreshTokenLifetimeSeconds = REFRESH_TOKEN_EXPIRATION_SECONDS
    const refreshTokenLifetimeMs = Duration.seconds(refreshTokenLifetimeSeconds).toMilliseconds()
    const oldEnoughRevokedTokensThreshold = new Date(now - (refreshTokenLifetimeMs * 5))
    const deleted = await Database.deleteMany(
      UserRevokedTokenModel,
      { revokedOn: { $lt: oldEnoughRevokedTokensThreshold } },
      { initiatorId: ROOT_USER_ID }
    )
    if (!deleted.success) return; // [WIP] what to do with the error ? Send mail ?
    return
  })
  await scheduleCronTask('CLEANUP_USER_PASSWORD_RENEWAL_TOKENS', '5 minutes', async () => {
    const now = new Date()
    const deleted = await Database.deleteMany(
      UserPasswordRenewalTokenModel,
      { expiresOn: { $lt: now } },
      { initiatorId: ROOT_USER_ID }
    )
    if (!deleted.success) return; // [WIP] what to do with the error ? Send mail ?
    return
  })
}

export function captureTerminationSignals () {
  process.on('SIGINT', async () => {
    console.log('SIGINT received.')
    await shutdown(0)
  })

  process.on('SIGTERM', async () => {
    console.log('SIGTERM received.')
    await shutdown(0)
  })
}

export async function gracefulShutdown () {
  if (agenda !== null) await agenda.stop()
  await Database.disconnect()
}

export async function shutdown (code: number) {
  console.log('Running cleanup tasks...')
  await gracefulShutdown()
  console.log('Cleanup complete. Exiting...')
  process.exit(code)
}