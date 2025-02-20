import { Sender, Recipient, EmailParams, MailerSend } from 'mailersend'
import { APIResponse } from 'mailersend/lib/services/request.service'
import { Outcome } from '@design-edito/tools/agnostic/misc/outcome'
import { unknownToString } from '@design-edito/tools/agnostic/errors/unknown-to-string'
import { MAILERSEND_API_KEY } from '../env'

export type SendOptions = {
  senderEmail: string
  senderName: string
  recipientEmail: string
  recipientName: string
  subject: string
  htmlBody: string
}

export async function send (
  from: string,
  fromName: string,
  to: string,
  toName: string,
  subject: string,
  htmlBody: string
): Promise<Outcome.Either<APIResponse, string>> {
  const mailerSend = new MailerSend({ apiKey: MAILERSEND_API_KEY })
  const sender = new Sender(from, fromName)
  const recipient = new Recipient(to, toName)
  const emailParams = new EmailParams()
    .setFrom(sender)
    .setTo([recipient])
    .setReplyTo(sender)
    .setSubject(subject)
    .setHtml(htmlBody)
  try {
    const sent = await mailerSend.email.send(emailParams)
    return Outcome.makeSuccess(sent)
  } catch (err) {
    return Outcome.makeFailure(unknownToString(err))
  }
}

export function makeUserEmailVerificationTokenBody (username: string, token: string): string {
  return `Hey ${username}! Here is your account verification code: ${token}.`
}

export function makeUserPasswordRenewalTokenBody (username: string, token: string): string {
  return `Hey ${username}! Here is your password renewal code: ${token}.`
}
