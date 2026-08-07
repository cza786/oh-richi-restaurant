import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearFailedAttemptsStore,
  getFailedAttemptCount,
  recordFailedAttempt,
  isCaptchaRequired,
  resetFailedAttempts,
  generateCaptchaChallenge,
  verifyCaptchaToken,
} from '@/lib/captcha';

describe('CAPTCHA Protection Utility (lib/captcha.ts)', () => {
  beforeEach(() => {
    clearFailedAttemptsStore();
  });

  describe('Failed Attempt Tracker', () => {
    it('should initially return 0 attempts for unknown key', () => {
      expect(getFailedAttemptCount('test-key-1')).toBe(0);
      expect(isCaptchaRequired('test-key-1')).toBe(false);
    });

    it('should increment attempt count and trigger CAPTCHA requirement after 3 attempts', () => {
      const key = 'login:127.0.0.1:user@example.com';

      expect(recordFailedAttempt(key)).toBe(1);
      expect(isCaptchaRequired(key)).toBe(false);

      expect(recordFailedAttempt(key)).toBe(2);
      expect(isCaptchaRequired(key)).toBe(false);

      expect(recordFailedAttempt(key)).toBe(3);
      expect(isCaptchaRequired(key)).toBe(true);
      expect(getFailedAttemptCount(key)).toBe(3);
    });

    it('should reset failed attempt counter on resetFailedAttempts', () => {
      const key = 'login:127.0.0.1:user@example.com';

      recordFailedAttempt(key);
      recordFailedAttempt(key);
      recordFailedAttempt(key);

      expect(isCaptchaRequired(key)).toBe(true);

      resetFailedAttempts(key);

      expect(getFailedAttemptCount(key)).toBe(0);
      expect(isCaptchaRequired(key)).toBe(false);
    });
  });



  describe('CAPTCHA Challenge Generator & Verifier', () => {
    it('should generate valid challenge with token, prompt, and svgDataUrl', () => {
      const challenge = generateCaptchaChallenge();

      expect(challenge.captchaToken).toBeDefined();
      expect(challenge.captchaToken.split('.')).toHaveLength(2);
      expect(challenge.prompt).toMatch(/^\d+ [\+\-] \d+ = \?$/);
      expect(challenge.svgDataUrl).toContain('data:image/svg+xml;base64,');
    });

    it('should correctly verify valid answer solution', () => {
      const challenge = generateCaptchaChallenge();

      // Extract equation numbers and operation from prompt (e.g., "12 + 5 = ?")
      const match = challenge.prompt.match(/^(\d+) ([\+\-]) (\d+) = \?$/);
      expect(match).not.toBeNull();

      if (match) {
        const num1 = parseInt(match[1], 10);
        const op = match[2];
        const num2 = parseInt(match[3], 10);
        const correctAnswer = op === '+' ? (num1 + num2).toString() : (num1 - num2).toString();

        expect(verifyCaptchaToken(challenge.captchaToken, correctAnswer)).toBe(true);
      }
    });

    it('should reject incorrect user answer solution', () => {
      const challenge = generateCaptchaChallenge();
      expect(verifyCaptchaToken(challenge.captchaToken, '99999')).toBe(false);
    });

    it('should reject invalid or tampered token', () => {
      expect(verifyCaptchaToken('invalid-token', '5')).toBe(false);
      expect(verifyCaptchaToken('12345678.fakehmac', '5')).toBe(false);
      expect(verifyCaptchaToken('', '5')).toBe(false);
      expect(verifyCaptchaToken(null, '5')).toBe(false);
    });

    it('should reject expired tokens', () => {
      const pastTime = Date.now() - 10000;
      const fakeExpiredToken = `${pastTime}.0000000000000000000000000000000000000000000000000000000000000000`;
      expect(verifyCaptchaToken(fakeExpiredToken, '5')).toBe(false);
    });
  });
});
