// OTP Management Utility for Email / Gmail and Phone Number Authentication

interface OTPRecord {
  code: string;
  expiresAt: number;
  attempts: number;
  type: 'email' | 'phone';
}

// Global in-memory OTP store (survives requests during dev/prod runtime)
const otpStore = new Map<string, OTPRecord>();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes validity
const MAX_ATTEMPTS = 5;

/**
 * Standardize identifier (lowercased email or numeric phone)
 */
export function normalizeIdentifier(input: string): { identifier: string; type: 'email' | 'phone' } {
  const trimmed = input.trim();
  if (trimmed.includes('@')) {
    return { identifier: trimmed.toLowerCase(), type: 'email' };
  }
  // Strip spaces, dashes, parentheses for phone matching
  const cleanedPhone = trimmed.replace(/[\s\-\(\)]/g, '');
  return { identifier: cleanedPhone, type: 'phone' };
}

/**
 * Generate a 6-digit OTP for an email or phone number
 */
export function generateOTP(rawIdentifier: string): { code: string; expiresAt: number; type: 'email' | 'phone' } {
  const { identifier, type } = normalizeIdentifier(rawIdentifier);
  
  // Generate random 6-digit numeric OTP code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + OTP_TTL_MS;

  otpStore.set(identifier, {
    code,
    expiresAt,
    attempts: 0,
    type,
  });

  return { code, expiresAt, type };
}

/**
 * Verify a 6-digit OTP entered by the user
 */
export function verifyOTP(rawIdentifier: string, enteredCode: string): { valid: boolean; error?: string } {
  const { identifier } = normalizeIdentifier(rawIdentifier);
  const record = otpStore.get(identifier);

  if (!record) {
    return { valid: false, error: 'No active OTP request found for this account. Please request a new code.' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(identifier);
    return { valid: false, error: 'OTP code has expired. Please request a new one.' };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(identifier);
    return { valid: false, error: 'Too many incorrect attempts. Please request a new OTP code.' };
  }

  if (record.code !== enteredCode.trim()) {
    record.attempts += 1;
    return { valid: false, error: `Invalid OTP code. (${MAX_ATTEMPTS - record.attempts} attempts remaining)` };
  }

  // OTP is valid - consume it
  otpStore.delete(identifier);
  return { valid: true };
}
