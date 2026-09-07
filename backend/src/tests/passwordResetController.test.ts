import { Request, Response } from 'express';
import { forgotPassword, resetPassword } from '../controllers/authController.js';
import { UserModel } from '../models/User.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

jest.mock('../models/User.js', () => ({
  UserModel: {
    findByEmail: jest.fn(),
    updateResetToken: jest.fn(),
    resetPasswordWithToken: jest.fn(),
  },
}));
jest.mock('../services/emailService.js', () => ({
  sendPasswordResetEmail: jest.fn(),
}));

const response = () => {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  } as unknown as Response;
  (res.status as jest.Mock).mockReturnValue(res);
  (res.json as jest.Mock).mockReturnValue(res);
  return res;
};

const request = (body: Record<string, unknown>) => ({ body } as Request);

describe('password reset controllers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('generates a cryptographically sized token with a one-hour expiry and never returns it', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-07T12:00:00.000Z'));
    (UserModel.findByEmail as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'member@example.com',
    });
    (UserModel.updateResetToken as jest.Mock).mockResolvedValue(undefined);
    (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);
    const res = response();

    await forgotPassword(request({ email: 'member@example.com' }), res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'If email exists, reset link sent',
    });
    const [, token, expires] = (UserModel.updateResetToken as jest.Mock).mock.calls[0];
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(expires).toEqual(new Date('2026-09-07T13:00:00.000Z'));
    expect(sendPasswordResetEmail).toHaveBeenCalledWith('member@example.com', token);
    expect(JSON.stringify((res.json as jest.Mock).mock.calls)).not.toContain(token);
  });

  it('returns the same response for an unknown account without creating a token', async () => {
    (UserModel.findByEmail as jest.Mock).mockResolvedValue(null);
    const res = response();

    await forgotPassword(request({ email: 'unknown@example.com' }), res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'If email exists, reset link sent',
    });
    expect(UserModel.updateResetToken).not.toHaveBeenCalled();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it.each(['invalid', 'expired'])('rejects an %s reset token', async () => {
    (UserModel.resetPasswordWithToken as jest.Mock).mockResolvedValue(false);
    const res = response();

    await resetPassword(request({ token: 'unusable-token', password: 'new-password' }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid or expired token',
    });
  });

  it('accepts a valid token once and rejects its reuse', async () => {
    (UserModel.resetPasswordWithToken as jest.Mock)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    const first = response();
    const reused = response();

    await resetPassword(request({ token: 'single-use-token', password: 'new-password' }), first);
    await resetPassword(request({ token: 'single-use-token', password: 'another-password' }), reused);

    expect(first.json).toHaveBeenCalledWith({
      success: true,
      message: 'Password reset successfully',
    });
    expect(reused.status).toHaveBeenCalledWith(400);
    expect(reused.json).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid or expired token',
    });
  });
});
