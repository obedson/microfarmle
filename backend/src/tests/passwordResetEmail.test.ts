const mockSetApiKey = jest.fn();
const mockSendTransacEmail = jest.fn();

jest.mock('@getbrevo/brevo', () => ({
  TransactionalEmailsApi: jest.fn().mockImplementation(() => ({
    setApiKey: mockSetApiKey,
    sendTransacEmail: mockSendTransacEmail,
  })),
  TransactionalEmailsApiApiKeys: { apiKey: 0 },
  SendSmtpEmail: class SendSmtpEmail {
    to?: Array<{ email: string }>;
    sender?: { email: string; name: string };
    subject?: string;
    htmlContent?: string;
  },
}));

describe('password reset email delivery', () => {
  const originalApiKey = process.env.BREVO_API_KEY;
  let sendPasswordResetEmail: (email: string, token: string) => Promise<void>;

  beforeAll(async () => {
    process.env.BREVO_API_KEY = 'synthetic-email-provider-test-key';
    jest.resetModules();
    ({ sendPasswordResetEmail } = await import('../services/emailService.js'));
  });

  afterAll(() => {
    if (originalApiKey === undefined) {
      delete process.env.BREVO_API_KEY;
    } else {
      process.env.BREVO_API_KEY = originalApiKey;
    }
  });

  beforeEach(() => {
    mockSendTransacEmail.mockReset();
  });

  it('uses the configured Brevo client and sends the reset link without logging sensitive fields', async () => {
    mockSendTransacEmail.mockResolvedValue({ messageId: 'synthetic-message' });
    const log = jest.spyOn(console, 'log').mockImplementation();
    const error = jest.spyOn(console, 'error').mockImplementation();
    const token = 'synthetic-reset-token';

    await sendPasswordResetEmail('member@example.test', token);

    expect(mockSetApiKey).toHaveBeenCalledWith(0, 'synthetic-email-provider-test-key');
    expect(mockSendTransacEmail).toHaveBeenCalledTimes(1);
    const message = mockSendTransacEmail.mock.calls[0][0];
    expect(message.to).toEqual([{ email: 'member@example.test' }]);
    expect(message.htmlContent).toContain(
      'href="http://localhost:3001/reset-password?token=' + token + '"',
    );
    expect(message.htmlContent.split(token)).toHaveLength(2);
    const visibleText = message.htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    expect(visibleText).not.toContain(token);
    expect(visibleText).not.toContain('reset-password?token=');
    expect(visibleText).not.toMatch(/copy and paste/i);
    expect(visibleText).toContain('This link will expire in 1 hour.');
    expect(log).toHaveBeenCalledWith('Password reset email delivery accepted');
    expect(JSON.stringify(log.mock.calls)).not.toContain(token);
    expect(JSON.stringify(error.mock.calls)).not.toContain(token);

    log.mockRestore();
    error.mockRestore();
  });

  it('redacts provider errors and remains best-effort to protect account enumeration', async () => {
    const token = 'synthetic-reset-token';
    mockSendTransacEmail.mockRejectedValue({
      response: { body: { diagnostic: token } },
    });
    const error = jest.spyOn(console, 'error').mockImplementation();

    await expect(sendPasswordResetEmail('member@example.test', token)).resolves.toBeUndefined();

    expect(error).toHaveBeenCalledWith('Password reset email delivery failed');
    expect(JSON.stringify(error.mock.calls)).not.toContain(token);
    expect(JSON.stringify(error.mock.calls)).not.toContain('member@example.test');

    error.mockRestore();
  });
});
