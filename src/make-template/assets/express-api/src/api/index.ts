import * as Auth from './auth'

export const Endpoints = {

  // Auth
  'POST:/auth/signup': Auth.signup, // ok
  'POST:/auth/verify-email/': Auth.verifyEmail, // ok
  'POST:/auth/request-email-verification-token': Auth.requestEmailVerificationToken, // ok
  'POST:/auth/login': Auth.login, // ok
  'GET:/auth/refresh-token': Auth.refreshToken,
  'GET:/auth/logout': Auth.logout, // ok
  'POST:/auth/request-new-password': Auth.requestNewPassword, // ok
  'POST:/auth/submit-new-password': Auth.submitNewPassword, // ok
  // 'GET:/auth/google': Auth.google,
  // 'GET:/auth/google-callback': Auth.googleCallback,
  'GET:/auth/whoami': Auth.whoami // ok

}
