// Authentication Routes - PocketBase (Fixed)
// Uses a simpler auth system that doesn't rely on PocketBase auth

import { Hono } from 'hono';

const app = new Hono();

// Simple in-memory user store (for now)
const users = new Map<string, any>();

// ─── POST /signin ────────────────────────────────────────────────────
app.post('/signin', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Email and password required' }, 400);
    }

    // Check if user exists (in memory for now)
    const user = users.get(email);

    if (!user || user.password !== password) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Generate a simple token (in production, use JWT)
    const token = btoa(`${email}:${Date.now()}`);

    return c.json({
      success: true,
      token,
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
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

    // Check if user already exists
    if (users.has(email)) {
      return c.json({ error: 'User already exists' }, 400);
    }

    // Create user
    const user = {
      email,
      password, // In production, hash this!
      name: name || email.split('@')[0],
      role: 'consultant',
    };

    users.set(email, user);

    // Generate token
    const token = btoa(`${email}:${Date.now()}`);

    return c.json({
      success: true,
      token,
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
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

    // For now, just verify token exists
    const token = authHeader.replace('Bearer ', '');

    return c.json({
      success: true,
      token,
      error: null,
    });
  } catch (err: any) {
    console.error('Get user error:', err.message);
    return c.json({ success: false, error: err.message }, 401);
  }
});

// ─── Initialize with test user ──────────────────────────────────────
// Add the test user on startup
users.set('violeau.hortense@gmail.com', {
  email: 'violeau.hortense@gmail.com',
  password: 'Hvguillote78',
  name: 'Hortense Violeau',
  role: 'consultant',
});

console.log('✅ Test user pre-loaded: violeau.hortense@gmail.com');

export default app;
