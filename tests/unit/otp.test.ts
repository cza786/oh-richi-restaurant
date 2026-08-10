import { describe, it, expect } from 'vitest';
import { generateOTP, verifyOTP, normalizeIdentifier } from '@/lib/otp';

describe('OTP Authentication System', () => {
  it('normalizes email and phone identifiers properly', () => {
    const emailRes = normalizeIdentifier('  Alex@Gmail.COM  ');
    expect(emailRes.identifier).toBe('alex@gmail.com');
    expect(emailRes.type).toBe('email');

    const phoneRes = normalizeIdentifier(' +39 (333) 123-4567 ');
    expect(phoneRes.identifier).toBe('+393331234567');
    expect(phoneRes.type).toBe('phone');
  });

  it('generates a 6-digit OTP code', () => {
    const { code, type } = generateOTP('testuser@gmail.com');
    expect(code).toHaveLength(6);
    expect(/^\d{6}$/.test(code)).toBe(true);
    expect(type).toBe('email');
  });

  it('verifies correct 6-digit OTP code and invalidates bad attempts', () => {
    const email = 'user@ohrichi.com';
    const { code } = generateOTP(email);

    // Wrong code attempt
    const wrongAttempt = verifyOTP(email, '000000');
    expect(wrongAttempt.valid).toBe(false);
    expect(wrongAttempt.error).toContain('Invalid OTP code');

    // Correct code attempt
    const correctAttempt = verifyOTP(email, code);
    expect(correctAttempt.valid).toBe(true);

    // Second attempt should fail (single-use OTP)
    const reuseAttempt = verifyOTP(email, code);
    expect(reuseAttempt.valid).toBe(false);
  });
});
