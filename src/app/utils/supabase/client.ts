// Client auth custom — remplace Supabase Auth
// Compatible avec l'interface supabase.auth utilisée dans l'app
import { apiBaseUrl, publicAnonKey } from './info';

const SESSION_KEY = 'corevision_session';
const BASE_AUTH = `${apiBaseUrl}/auth`;

// ─── Session helpers ───────────────────────────────────────────────────────
// ✨ DEPRECATED: Session storage moved to PostgreSQL
// These functions kept for backward compatibility but do nothing

function loadSession(): any | null {
  // Sessions now in DB, not localStorage
  return null;
}

function saveSession(session: any) {
  // Sessions now saved in PostgreSQL via /auth/signin
  // No need to save in localStorage
  console.log('🔐 [saveSession] Session stored in DB via HTTP-only cookie');
}

function clearSession() {
  // Sessions now deleted from PostgreSQL via /auth/signout
  // No need to clear localStorage
  console.log('🔐 [clearSession] Session deleted from DB');
}

function getAuthToken(): string | null {
  // ✨ REMOVED: localStorage no longer used
  // Sessions are now stored in PostgreSQL
  // SessionId is sent via HTTP-only cookie automatically
  // No need for Authorization header anymore!

  console.log('🔐 [getAuthToken] Sessions now use HTTP-only cookies (not localStorage)');
  console.log('🔐 [getAuthToken] sessionId is auto-sent by browser - no token needed');
  return null;
}

// ─── Auth state listeners ──────────────────────────────────────────────────
type AuthChangeCallback = (event: string, session: any) => void;
const listeners: AuthChangeCallback[] = [];

function notifyListeners(event: string, session: any) {
  listeners.forEach(cb => cb(event, session));
}

// ─── Auth object ───────────────────────────────────────────────────────────
const auth = {
  async getSession() {
    const session = loadSession();
    return { data: { session }, error: null };
  },

  onAuthStateChange(callback: AuthChangeCallback) {
    listeners.push(callback);
    // Émettre l'état actuel immédiatement
    const session = loadSession();
    setTimeout(() => callback('INITIAL_SESSION', session), 0);
    return {
      data: {
        subscription: {
          unsubscribe() {
            const idx = listeners.indexOf(callback);
            if (idx !== -1) listeners.splice(idx, 1);
          },
        },
      },
    };
  },

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    try {
      const res = await fetch(`${BASE_AUTH}/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { data: null, error: { message: data.error || 'Erreur de connexion' } };
      }
      const session = data.session || {
        access_token: data.access_token,
        token_type: 'bearer',
        user: data.user,
      };
      saveSession(session);
      notifyListeners('SIGNED_IN', session);
      return { data: { session, user: session.user }, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message || 'Erreur réseau' } };
    }
  },

  async signUp({ email, password, options }: { email: string; password: string; options?: any }) {
    try {
      const metadata = options?.data || {};
      const res = await fetch(`${BASE_AUTH}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, ...metadata }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { data: null, error: { message: data.error || 'Erreur création de compte' } };
      }
      // Auto sign-in après signup
      const signInResult = await auth.signInWithPassword({ email, password });
      if (signInResult.error) {
        // Compte créé mais connexion manuelle requise
        return { data: { user: data, session: null }, error: null };
      }
      return signInResult;
    } catch (err: any) {
      return { data: null, error: { message: err.message || 'Erreur réseau' } };
    }
  },

  async signOut() {
    clearSession();
    notifyListeners('SIGNED_OUT', null);
    return { error: null };
  },
};

// ─── Export compatible avec l'interface Supabase ───────────────────────────
export const supabase = { auth };
export { getAuthToken };
