// Authentication Routes - PocketBase native auth
// Uses PocketBase's built-in "users" auth collection (bcrypt-hashed passwords, real JWTs)

import { Hono } from 'hono';

const app = new Hono();

const PB_URL = Deno.env.get('POCKETBASE_URL') || 'http://localhost:8090';

// ─── POST /signin ────────────────────────────────────────────────────
app.post('/signin', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Email and password required' }, 400);
    }

    const res = await fetch(`${PB_URL}/api/collections/users/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return c.json({ success: false, error: 'Invalid credentials' }, 401);
    }

    return c.json({
      success: true,
      token: data.token,
      user: {
        email: data.record.email,
        name: data.record.name,
        role: data.record.role || 'consultant',
      },
      error: null,
    }, 200);
  } catch (err: any) {
    console.error('SignIn error:', err.message);
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ─── POST /signup ───────────────────────────────────────────────────
app.post('/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Email and password required' }, 400);
    }

    const res = await fetch(`${PB_URL}/api/collections/users/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        passwordConfirm: password,
        name: name || email.split('@')[0],
        role: 'consultant',
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const message = data.data?.email?.message || data.message || 'User already exists';
      return c.json({ success: false, error: message }, 400);
    }

    // Sign in immediately after creating the account to return a usable token
    const authRes = await fetch(`${PB_URL}/api/collections/users/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: email, password }),
    });
    const authData = await authRes.json();

    return c.json({
      success: true,
      token: authData.token,
      user: {
        email: data.email,
        name: data.name,
        role: data.role || 'consultant',
      },
      error: null,
    }, 201);
  } catch (err: any) {
    console.error('SignUp error:', err.message);
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ─── POST /signout ──────────────────────────────────────────────────
app.post('/signout', (c) => {
  return c.json({ success: true, error: null });
});

// ─── GET /me (get current user) ──────────────────────────────────────
app.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');

    const res = await fetch(`${PB_URL}/api/collections/users/auth-refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return c.json({ success: false, error: 'Invalid or expired token' }, 401);
    }

    return c.json({
      success: true,
      token: data.token,
      user: {
        email: data.record.email,
        name: data.record.name,
        role: data.record.role || 'consultant',
      },
      error: null,
    });
  } catch (err: any) {
    console.error('Get user error:', err.message);
    return c.json({ success: false, error: err.message }, 401);
  }
});

export default app;
