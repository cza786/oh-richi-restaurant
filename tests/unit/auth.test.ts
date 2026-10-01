import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Mock DB client
vi.mock('@/lib/db', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    session: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import db from '@/lib/db';
import {
  getJwtSecret,
  getRefreshTokenSecret,
  hashToken,
  generateTokenPair,
  rotateRefreshToken,
  revokeAllUserSessions,
  revokeSessionByToken,
  extractTokenFromRequest,
  requireAuth,
  requireRole,
} from '@/lib/auth';
import { checkRateLimit, clearRateLimitStore } from '@/lib/rateLimit';

describe('Auth Core Utilities (lib/auth.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearRateLimitStore();
  });

  it('should return configured JWT_SECRET', () => {
    const secret = getJwtSecret();
    expect(secret).toBe('test_secret_key_oh_richi_12345');
  });

  it('should return configured REFRESH_TOKEN_SECRET or fallback', () => {
    const secret = getRefreshTokenSecret();
    expect(secret).toBeDefined();
  });

  it('should hash refresh token consistently using SHA-256', () => {
    const token = 'sample-token-123';
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex string length
    expect(hash1).not.toBe(token);
  });

  describe('generateTokenPair', () => {
    it('should generate valid access and refresh token pair and persist HASHED token in Session table', async () => {
      vi.mocked(db.session.create).mockResolvedValueOnce({
        id: 'sess-1',
        tokenHash: 'hashed-value',
        userId: 'user-1',
        userAgent: 'Chrome',
        ipAddress: '127.0.0.1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'SUPER_ADMIN',
        roles: ['SUPER_ADMIN'],
      };

      const pair = await generateTokenPair(mockUser, { userAgent: 'Chrome', ipAddress: '127.0.0.1' });

      expect(pair.accessToken).toBeDefined();
      expect(pair.refreshToken).toBeDefined();
      
      const expectedHash = hashToken(pair.refreshToken);

      expect(db.session.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            tokenHash: expectedHash,
            userAgent: 'Chrome',
            ipAddress: '127.0.0.1',
            isRevoked: false,
          }),
        })
      );
    });
  });

  describe('rotateRefreshToken & Reuse Detection', () => {
    it('should rotate valid refresh token, revoke old session, and issue new pair', async () => {
      const secret = getRefreshTokenSecret();
      const validRefreshToken = jwt.sign({ userId: 'user-1', tokenType: 'refresh' }, secret);
      const expectedHash = hashToken(validRefreshToken);

      const mockSessionRecord = {
        id: 'sess-100',
        tokenHash: expectedHash,
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 100000),
        isRevoked: false,
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user-1',
          email: 'user1@example.com',
          firstName: 'User',
          lastName: 'One',
          isActive: true,
          role: 'SUPER_ADMIN',
        },
      };

      vi.mocked(db.session.findUnique).mockResolvedValueOnce(mockSessionRecord as any);
      vi.mocked(db.session.update).mockResolvedValueOnce({ ...mockSessionRecord, isRevoked: true } as any);
      vi.mocked(db.session.create).mockResolvedValueOnce({
        id: 'sess-101',
        tokenHash: 'new-hashed-token',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await rotateRefreshToken(validRefreshToken);

      expect(result).not.toBeNull();
      if (result) {
        expect(result.accessToken).toBeDefined();
        expect(result.refreshToken).toBeDefined();
      }
      expect(db.session.update).toHaveBeenCalledWith({
        where: { id: 'sess-100' },
        data: expect.objectContaining({ isRevoked: true }),
      });
    });

    it('REUSE DETECTION: should revoke ALL user sessions when a revoked token is reused', async () => {
      const secret = getRefreshTokenSecret();
      const revokedRefreshToken = jwt.sign({ userId: 'user-1', tokenType: 'refresh' }, secret);
      const expectedHash = hashToken(revokedRefreshToken);

      // Session record is already revoked (isRevoked = true)
      vi.mocked(db.session.findUnique).mockResolvedValueOnce({
        id: 'sess-102',
        tokenHash: expectedHash,
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 100000),
        isRevoked: true, // ALREADY REVOKED!
        user: { id: 'user-1', isActive: true, role: 'SUPER_ADMIN' },
      } as any);

      vi.mocked(db.session.updateMany).mockResolvedValueOnce({ count: 5 } as any);

      const result = await rotateRefreshToken(revokedRefreshToken);
      
      // Should return null (access denied)
      expect(result).toBeNull();

      // Should have revoked all active sessions for user-1 due to reuse detection
      expect(db.session.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          isRevoked: false,
        },
        data: expect.objectContaining({ isRevoked: true }),
      });
    });
  });

  describe('revokeAllUserSessions & revokeSessionByToken', () => {
    it('should revoke all active sessions for user', async () => {
      vi.mocked(db.session.updateMany).mockResolvedValueOnce({ count: 3 } as any);

      await revokeAllUserSessions('user-1');

      expect(db.session.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          isRevoked: false,
        },
        data: expect.objectContaining({ isRevoked: true }),
      });
    });

    it('should revoke specific session by matching refresh token hash', async () => {
      const token = 'my-device-token';
      const expectedHash = hashToken(token);

      vi.mocked(db.session.findUnique).mockResolvedValueOnce({
        id: 'sess-777',
        tokenHash: expectedHash,
        isRevoked: false,
      } as any);

      vi.mocked(db.session.update).mockResolvedValueOnce({
        id: 'sess-777',
        isRevoked: true,
      } as any);

      const success = await revokeSessionByToken(token);
      expect(success).toBe(true);
      expect(db.session.update).toHaveBeenCalledWith({
        where: { id: 'sess-777' },
        data: expect.objectContaining({ isRevoked: true }),
      });
    });
  });

  describe('Rate Limiting Utility', () => {
    it('should allow requests within limit and block when exceeded', () => {
      const key = 'test-ip:127.0.0.1';
      const limit = 3;

      expect(checkRateLimit(key, limit, 60000).success).toBe(true);
      expect(checkRateLimit(key, limit, 60000).success).toBe(true);
      expect(checkRateLimit(key, limit, 60000).success).toBe(true);
      
      const blockedResult = checkRateLimit(key, limit, 60000);
      expect(blockedResult.success).toBe(false);
      expect(blockedResult.remaining).toBe(0);
    });
  });



  describe('extractTokenFromRequest', () => {
    it('should extract token from session_token cookie', () => {
      const request = new Request('http://localhost/api/test', {
        headers: {
          cookie: 'session_token=mock_cookie_token_123',
        },
      });
      const token = extractTokenFromRequest(request);
      expect(token).toBe('mock_cookie_token_123');
    });

    it('should extract token from Authorization header', () => {
      const request = new Request('http://localhost/api/test', {
        headers: {
          authorization: 'Bearer mock_bearer_token_456',
        },
      });
      const token = extractTokenFromRequest(request);
      expect(token).toBe('mock_bearer_token_456');
    });
  });

  describe('requireAuth & requireRole', () => {
    it('should return 401 NextResponse when unauthenticated', async () => {
      const request = new Request('http://localhost/api/admin/restaurants');
      const result = await requireAuth(request);

      expect(result).toBeInstanceOf(NextResponse);
      const res = result as NextResponse;
      expect(res.status).toBe(401);
    });
  });
});
