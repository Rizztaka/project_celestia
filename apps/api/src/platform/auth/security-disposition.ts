/** Authentication credentials/identifiers are never part of a portable account export.
 * Every row cascades on user deletion (rotated hashes cascade through sessions).
 */
export const authSecurityModelDisposition = {
  Session: 'exclude_from_export_cascade_on_delete',
  RotatedRefreshToken: 'exclude_from_export_cascade_on_delete',
  OAuthAccount: 'exclude_from_export_cascade_on_delete',
  PasswordResetToken: 'exclude_from_export_cascade_on_delete',
  EmailVerificationToken: 'exclude_from_export_cascade_on_delete',
} as const;
