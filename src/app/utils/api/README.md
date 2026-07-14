# 🔗 API Utilities

Communication avec le backend Render. **Note:** Nommé `api/` pour clarité (pas Supabase).

## Fichiers

### `client.ts`
Custom auth client (JWT-based) avec interface compatible `supabase.auth`:
- `getSession()` - Récupère session stockée
- `signInWithPassword(email, password)` - Login
- `signUp(email, password)` - Register
- `signOut()` - Logout
- `onAuthStateChange(callback)` - Listen changements

**Stockage:** `localStorage` sous clé `corevision_session`

### `info.tsx`
Configuration API:
```typescript
apiBaseUrl = "https://corevision-api.onrender.com/make-server-cac859af"
projectId = "self-hosted"
publicAnonKey = "local-auth"
```

---

## Utilisation

```typescript
import { supabase } from '@/utils/api/client';
import { apiBaseUrl } from '@/utils/api/info';

// Auth
const { data: { session }, error } = await supabase.auth.getSession();

// API calls
const res = await fetch(`${apiBaseUrl}/clients/123`);
```

---

**Legacy:** Remplace l'ancienne structure `utils/supabase/` (Supabase).
