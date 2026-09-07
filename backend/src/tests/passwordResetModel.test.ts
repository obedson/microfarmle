import bcrypt from 'bcryptjs';
import { UserModel } from '../models/User.js';
import supabase from '../utils/supabase.js';

jest.mock('../utils/supabase.js', () => ({
  __esModule: true,
  default: { from: jest.fn() },
  supabase: { from: jest.fn() },
}));

const resetUpdate = (result: { data: unknown; error: unknown }) => {
  const maybeSingle = jest.fn().mockResolvedValue(result);
  const select = jest.fn().mockReturnValue({ maybeSingle });
  const gt = jest.fn().mockReturnValue({ select });
  const eq = jest.fn().mockReturnValue({ gt });
  const update = jest.fn().mockReturnValue({ eq });
  (supabase.from as jest.Mock).mockReturnValue({ update });
  return { update, eq, gt, select, maybeSingle };
};

describe('UserModel reset token consumption', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-09-07T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('atomically changes the password and clears a valid token', async () => {
    const query = resetUpdate({ data: { id: 'user-1' }, error: null });

    await expect(UserModel.resetPasswordWithToken('valid-token', 'new-password')).resolves.toBe(true);

    expect(supabase.from).toHaveBeenCalledWith('users');
    expect(query.eq).toHaveBeenCalledWith('reset_token', 'valid-token');
    expect(query.gt).toHaveBeenCalledWith('reset_token_expires', '2026-09-07T12:00:00.000Z');
    expect(query.select).toHaveBeenCalledWith('id');
    expect(query.maybeSingle).toHaveBeenCalledTimes(1);

    const update = query.update.mock.calls[0][0];
    expect(update).toMatchObject({
      reset_token: null,
      reset_token_expires: null,
    });
    expect(update.password).not.toBe('new-password');
    await expect(bcrypt.compare('new-password', update.password)).resolves.toBe(true);
  });

  it.each(['invalid', 'expired', 'already-used'])('does not reset for an %s token', async () => {
    resetUpdate({ data: null, error: null });

    await expect(UserModel.resetPasswordWithToken('unusable-token', 'new-password')).resolves.toBe(false);
  });

  it('propagates database failures without leaking them into the API contract', async () => {
    resetUpdate({ data: null, error: new Error('database unavailable') });

    await expect(UserModel.resetPasswordWithToken('valid-token', 'new-password'))
      .rejects.toThrow('database unavailable');
  });
});
