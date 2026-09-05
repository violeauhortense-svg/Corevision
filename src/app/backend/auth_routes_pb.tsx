// Authentication Routes - PocketBase

import { Hono } from 'hono';
import { pb } from './pocketbase_client.tsx';

const app = new Hono();

// ─── POST /signin ────────────────────────────────────────────────────
app.post('/signin', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Email et password requis' }, 400);
    }

    const result = await pb.authenticate(email, password);

    return c.json({
      success: true,
      token: result.token,
      user: result.user,
      error: null,
    }, 200);
  } catch (err: any) {
    console.error('SignIn error:', err.message);
    return c.json({ success: false, error: err.message }, 401);
  }
});

// ─── POST /signup ───────────────────────────────────────────────────
app.post('/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Email et password requis' }, 400);
    }

    // Créer l'utilisateur
    const user = await pb.createRecord('users', {
      id: `user_${Date.now()}`,
      email,
      password,
      name: name || email.split('@')[0],
      role: 'consultant',
    });

    // Auto-signin
    const auth = await pb.authenticate(email, password);

    return c.json({
      success: true,
      token: auth.token,
      user: auth.user,
      error: null,
    }, 201);
  } catch (err: any) {
    console.error('SignUp error:', err.message);
    return c.json({ success: false, error: err.message }, 400);
  }
});

// ─── POST /signout ──────────────────────────────────────────────────
app.post('/signout', (c) => {
  pb.setAuthToken(null);
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
    pb.setAuthToken(token);

    // TODO: Implémenter la vérification du token et récupérer l'utilisateur
    // Pour maintenant, on retourne juste le token validé

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

export default app;
