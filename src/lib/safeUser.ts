type UserWithSecrets = {
  otpCode?: string | null;
  otpExpiresAt?: Date | null;
  passwordHash?: string | null;
};

export function toSafeUser<T extends UserWithSecrets>(user: T) {
  const { otpCode, otpExpiresAt, passwordHash, ...safe } = user;
  return safe;
}
