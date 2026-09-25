// Authentication Routes - PocketBase native auth
// Uses PocketBase's built-in "users" auth collection (bcrypt-hashed passwords, real JWTs)

import { Hono } from 'hono';
import { pb } from './pocketbase_client.tsx';

const app = new Hono();

const PB_URL = Deno.env.get('POCKETBASE_URL') || 'http://localhost:8090';

// Seul ce compte peut créer de nouveaux comptes - même identité que
// Sidebar.tsx/App.tsx côté front (session?.email === ADMIN_EMAIL).
const ADMIN_EMAIL = 'violeau.hortense@gmail.com';

// Vérifie que le Bearer fourni correspond à une session valide pour
// ADMIN_EMAIL. Retourne le message d'erreur à renvoyer si ce n'est pas le
// cas, ou null si l'appelant est bien l'admin.
async function requireAdmin(c: any): Promise<string | null> {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return 'Seule l\'administratrice peut effectuer cette action.';

  try {
    const res = await fetch(`${PB_URL}/api/collections/users/auth-refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token },
    });
    const data = await res.json();
    if (!res.ok || data?.record?.email !== ADMIN_EMAIL) {
      return 'Seule l\'administratrice peut effectuer cette action.';
    }
    return null;
  } catch {
    return 'Impossible de vérifier les droits administrateur.';
  }
}

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
// Réservé à l'administratrice (ADMIN_EMAIL) : plus de création de compte
// en libre-service. L'appelant doit être connectée avec son propre
// compte (Bearer valide, vérifié via requireAdmin) - le compte créé
// n'est PAS connecté automatiquement, on ne renvoie donc pas de token
// pour ne pas remplacer la session de l'admin dans son propre navigateur.
app.post('/signup', async (c) => {
  const adminError = await requireAdmin(c);
  if (adminError) {
    return c.json({ success: false, error: adminError }, 403);
  }

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

    return c.json({
      success: true,
      user: {
        id: data.id,
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

// ─── GET /users ─────────────────────────────────────────────────────
// Liste des comptes existants - réservé à l'administratrice, pour le
// panneau "Gestion des utilisateurs".
app.get('/users', async (c) => {
  const adminError = await requireAdmin(c);
  if (adminError) {
    return c.json({ success: false, error: adminError }, 403);
  }

  try {
    // La requête doit passer par le client superuser (`pb`), pas un fetch
    // anonyme : les règles d'accès de la collection `users` de PocketBase
    // limitent ce qu'un appel non-authentifié peut lister (généralement
    // rien), ce qui faisait toujours remonter 0 compte ici même quand des
    // comptes réels existaient.
    const { items } = await pb.listRecords('users', { perPage: 200, sort: '-created' });
    const users = items.map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role || 'consultant',
      created: u.created,
    }));
    return c.json({ success: true, users, error: null });
  } catch (err: any) {
    console.error('List users error:', err.message);
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
