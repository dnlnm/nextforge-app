export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 24;

const usernamePattern = /^[a-z0-9_.-]+$/i;

export const normalizeUsername = (value: string): string =>
  value.trim().toLowerCase();

export const isValidUsername = (value: string): boolean => {
  const normalized = normalizeUsername(value);

  return (
    normalized.length >= USERNAME_MIN_LENGTH &&
    normalized.length <= USERNAME_MAX_LENGTH &&
    usernamePattern.test(normalized)
  );
};

export const isEmailAddress = (value: string): boolean => value.includes("@");
