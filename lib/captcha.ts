import crypto from 'crypto';

interface FailedAttemptEntry {
  count: number;
  resetTime: number;
}

const failedAttemptMap = new Map<string, FailedAttemptEntry>();
const MAX_FAILED_ATTEMPTS_BEFORE_CAPTCHA = 3;
const FAILED_ATTEMPTS_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const CAPTCHA_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCaptchaSecret(): string {
  return process.env.JWT_SECRET || 'oh_richi_captcha_secret_fallback_2026';
}

/**
 * Cleanup expired failed attempt entries periodically
 */
if (typeof setInterval !== 'undefined') {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of failedAttemptMap.entries()) {
      if (now > entry.resetTime) {
        failedAttemptMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);
  if (timer.unref) {
    timer.unref();
  }
}

/**
 * Resets the in-memory failed attempt store (useful for unit tests)
 */
export function clearFailedAttemptsStore(): void {
  failedAttemptMap.clear();
}

/**
 * Returns current failed login attempts count for key
 */
export function getFailedAttemptCount(key: string): number {
  const now = Date.now();
  const entry = failedAttemptMap.get(key);
  if (!entry || now > entry.resetTime) {
    return 0;
  }
  return entry.count;
}

/**
 * Returns true if failed attempts count for key >= threshold
 */
export function isCaptchaRequired(key: string, threshold: number = MAX_FAILED_ATTEMPTS_BEFORE_CAPTCHA): boolean {
  return getFailedAttemptCount(key) >= threshold;
}

/**
 * Increments failed attempts for key and returns the updated count
 */
export function recordFailedAttempt(
  key: string,
  windowMs: number = FAILED_ATTEMPTS_WINDOW_MS
): number {
  const now = Date.now();
  const entry = failedAttemptMap.get(key);

  if (!entry || now > entry.resetTime) {
    failedAttemptMap.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return 1;
  }

  entry.count += 1;
  return entry.count;
}

/**
 * Resets failed attempt counter for key on successful authentication
 */
export function resetFailedAttempts(key: string): void {
  failedAttemptMap.delete(key);
}

/**
 * Generates an SVG image string for the CAPTCHA text challenge
 */
function generateCaptchaSvg(text: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="45" viewBox="0 0 160 45">
    <rect width="100%" height="100%" fill="#1e1e2d" rx="6" stroke="#2d2d42" stroke-width="1"/>
    <path d="M 10 22 Q 40 5, 80 22 T 150 22" stroke="#374151" fill="none" stroke-width="2"/>
    <path d="M 5 12 Q 50 38, 95 12 T 155 35" stroke="#1f2937" fill="none" stroke-width="2"/>
    <circle cx="25" cy="12" r="1.5" fill="#f87171" opacity="0.6"/>
    <circle cx="135" cy="32" r="1.5" fill="#f87171" opacity="0.6"/>
    <circle cx="75" cy="38" r="1.5" fill="#f87171" opacity="0.6"/>
    <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="#ef4444" font-family="'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700" letter-spacing="2">${text}</text>
  </svg>`;
}

/**
 * Generates a signed CAPTCHA challenge containing a token, SVG image string, and text prompt
 */
export function generateCaptchaChallenge() {
  const operations = ['+', '-'];
  const op = operations[Math.floor(Math.random() * operations.length)];
  let num1 = Math.floor(Math.random() * 15) + 1;
  let num2 = Math.floor(Math.random() * 15) + 1;

  if (op === '-' && num1 < num2) {
    [num1, num2] = [num2, num1];
  }

  const answer = op === '+' ? (num1 + num2).toString() : (num1 - num2).toString();
  const prompt = `${num1} ${op} ${num2} = ?`;
  const displayText = `${num1} ${op} ${num2} =`;

  const expiresAt = Date.now() + CAPTCHA_TTL_MS;
  const signaturePayload = `${expiresAt}:${answer.trim().toLowerCase()}`;
  const hmac = crypto.createHmac('sha256', getCaptchaSecret()).update(signaturePayload).digest('hex');
  const captchaToken = `${expiresAt}.${hmac}`;

  const svgContent = generateCaptchaSvg(displayText);
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;

  return {
    captchaToken,
    prompt,
    svgDataUrl: dataUrl,
  };
}

/**
 * Verifies a CAPTCHA token and answer solution
 */
export function verifyCaptchaToken(token: string | undefined | null, userAnswer: string | undefined | null): boolean {
  if (!token || !userAnswer) return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [expiresAtStr, providedHmac] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);

  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return false;
  }

  const normalizedAnswer = userAnswer.trim().toLowerCase();
  const signaturePayload = `${expiresAt}:${normalizedAnswer}`;
  const expectedHmac = crypto.createHmac('sha256', getCaptchaSecret()).update(signaturePayload).digest('hex');

  if (providedHmac.length !== expectedHmac.length) return false;

  return crypto.timingSafeEqual(Buffer.from(providedHmac, 'hex'), Buffer.from(expectedHmac, 'hex'));
}
