process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'http://127.0.0.1:54321';
process.env.SUPABASE_SERVICE_KEY = 'synthetic-runtime-check-key';
process.env.JWT_SECRET = 'synthetic-runtime-check-jwt-secret-value';
process.env.JWT_REFRESH_SECRET = 'synthetic-runtime-check-refresh-secret';
process.env.FRONTEND_URL = 'http://127.0.0.1:3001';
delete process.env.BREVO_API_KEY;

const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;
console.log = () => {};
console.warn = () => {};
console.error = () => {};

try {
  const { UserModel } = await import('../dist/models/User.js');
  const { forgotPassword } = await import('../dist/controllers/authController.js');

  let stored;
  UserModel.findByEmail = async () => ({
    id: 'runtime-user',
    email: 'runtime@example.com',
  });
  UserModel.updateResetToken = async (email, token, expires) => {
    stored = { email, token, expires };
  };

  const payloads = [];
  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      payloads.push(payload);
      return this;
    },
  };

  const before = Date.now();
  await forgotPassword({ body: { email: 'runtime@example.com' } }, res);
  const after = Date.now();

  if (res.statusCode !== 200) throw new Error('forgot-password runtime check returned a failure');
  if (!stored || !/^[a-f0-9]{64}$/.test(stored.token)) {
    throw new Error('forgot-password runtime check did not generate a secure token');
  }
  const expiry = stored.expires.getTime();
  if (expiry < before + 3600000 || expiry > after + 3600000) {
    throw new Error('forgot-password runtime check did not preserve the one-hour expiry');
  }
  if (JSON.stringify(payloads).includes(stored.token)) {
    throw new Error('forgot-password runtime response exposed the reset token');
  }
} finally {
  console.log = originalLog;
  console.warn = originalWarn;
  console.error = originalError;
}

console.log('Compiled forgot-password ESM runtime verification passed');
