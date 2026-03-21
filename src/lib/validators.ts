export const validateKosovoPhone = (phone: string): boolean => {
  // Kosovo formats:
  // International: +38344xxxxxx, +38345xxxxxx, +38348xxxxxx, +38349xxxxxx
  // Local: 044xxxxxx, 045xxxxxx, 048xxxxxx, 049xxxxxx
  const internationalRegex = /^\+383(44|45|48|49)\d{6}$/;
  const localRegex = /^0(44|45|48|49)\d{6}$/;

  const cleanPhone = phone.replace(/[\s-]/g, '');
  return internationalRegex.test(cleanPhone) || localRegex.test(cleanPhone);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export type PasswordStrength = 'weak' | 'fair' | 'strong';

export const validatePassword = (password: string): { valid: boolean; strength: PasswordStrength } => {
  const valid = password.length >= 8;
  let strength: PasswordStrength = 'weak';

  if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
    strength = 'strong';
  } else if (password.length >= 8 && (/[A-Z]/.test(password) || /[0-9]/.test(password))) {
    strength = 'fair';
  }

  return { valid, strength };
};

export const generateSubdomain = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};
