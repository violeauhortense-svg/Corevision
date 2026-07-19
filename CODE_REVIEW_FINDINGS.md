# CoreVision - Complete Code Review Report
**Date:** 2026-07-19  
**Scope:** Full SaaS codebase review  
**Status:** Findings documented, awaiting approval

---

## Executive Summary

The CoreVision SaaS codebase has **9 major inconsistency categories** affecting code quality and maintainability. Most are architectural remnants from the Supabase→Deno/Hono migration. **Critical issues** include an auth token bug and architectural misalignment (localStorage vs. PostgreSQL).

---

## 🔴 CRITICAL ISSUES

### 1. **Auth Token Bug - Production Risk**
**Location:** `src/app/App.tsx`, `src/app/components/DashboardView.tsx`, `src/app/components/KanbanBoard.tsx`

**Problem:**
- These components import `getAuthToken()` from deprecated `/utils/supabase/client.ts`
- That function returns `null` (marked as "REMOVED" and "DEPRECATED")
- This causes authorization failures when these components make API calls

**Current Code:**
```typescript
// App.tsx (BROKEN)
import { getAuthToken } from './utils/supabase/client';
const token = getAuthToken(); // ❌ Returns null
```

**Correct Code Already Exists:**
```typescript
// corevisionAPI.ts (WORKS)
async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? '';
}
```

**Impact:** Medium-to-High. These components will fail silently if auth is required.

---

### 2. **Architecture Mismatch - localStorage vs. PostgreSQL**
**Location:** `src/app/services/agendaAPI.ts`

**Problem:**
- Documented architecture: All data stored in PostgreSQL (via `/make-server-cac859af/` endpoints)
- Actual implementation: `agendaAPI` stores calendar events directly in `localStorage`
- This breaks the single-source-of-truth principle

**Current Code:**
```typescript
// agendaAPI.ts - reads/writes to localStorage, NOT backend
export const agendaAPI = {
  getAll: async (): Promise<AgendaEvent[]> => {
    const userId = localStorage.getItem('user_id') || 'default';
    const key = `agenda_events_${userId}`;
    const stored = localStorage.getItem(key); // ❌ localStorage, not API
    return JSON.parse(stored);
  },
};
```

**Expected Behavior:**
- All data should flow through backend API (`agendaAPI.getAll()` → `/make-server-cac859af/agenda/*`)
- Backend validates auth, persists to PostgreSQL
- Frontend caches if needed

**Impact:** High. Data loss on browser clear, no backup, no audit trail.

---

### 3. **Obsolete Directory Still in Use**
**Location:** `/src/app/utils/supabase/` (deprecated) vs. `/src/app/utils/api/` (current)

**Problem:**
- Migration: Supabase → Custom JWT (documented in ARCHITECTURE.md)
- Status: Both directories exist
- Files are importing from **old** directory instead of **new** one

**Import Mismatch:**
```typescript
// ❌ Wrong (deprecated directory)
import { getAuthToken } from '../utils/supabase/client';

// ✅ Correct (new directory)
import { supabase } from '../utils/api/client';
```

**Affected Files:**
- `App.tsx`
- `DashboardView.tsx`
- `KanbanBoard.tsx`
- `ServerDiagnostic.tsx` (still has outdated setup instructions)

**The Old Directory Says:**
```typescript
// /utils/supabase/client.ts
// ✨ DEPRECATED: Session storage moved to PostgreSQL
// These functions kept for backward compatibility but do nothing
```

**Impact:** Medium. Creates confusion, maintenance burden, risk of accidentally using deprecated code.

---

## 🟡 MAJOR INCONSISTENCIES

### 4. **Unused Dependency in package.json**
**Location:** `package.json` line 41

**Problem:**
```json
"@supabase/supabase-js": "^2.49.8",  // ❌ Not used after migration
```

**Status:**
- Supabase was fully replaced with Deno/Hono backend
- Compatibility layer created instead (`supabaseAdminCompat` in `storage.tsx`)
- This dependency is dead weight (~1-2MB)

**Impact:** Low. Wastes ~2MB, but doesn't break anything since there's a compat layer.

---

### 5. **Inconsistent File Naming Conventions**
**Location:** Throughout codebase

**Pattern Mismatch:**
```
Backend routes:
  ✓ audit_patrimonial_routes.tsx  (snake_case)
  ✓ client_routes.tsx             (snake_case)
  ✓ email_routes.tsx              (snake_case)

Frontend services:
  ✓ ClientService.ts              (PascalCase + Service suffix)
  ✓ corevisionAPI.ts              (camelCase + API suffix)
  ✓ agendaAPI.ts                  (camelCase + API suffix)
  ✓ calculService.ts              (camelCase + Service suffix)
```

**No clear rule:** Is it `X_routes.tsx` or `XRoutes.tsx`? Is it `XService` or `X_service`?

**Impact:** Low. Inconsistent but not breaking. Makes refactoring harder.

---

### 6. **Inconsistent API Response Formats**
**Location:** `src/app/services/api.ts`

**Problem:**
```typescript
// Line 95: Sometimes wraps in { client: X }
const client = data.client ?? data;
return clientToFrontend(client);

// Line 107: Sometimes uses { clients: X }
const clients = data.clients ?? data ?? [];

// Pattern: "Try nested key, fall back to whole response"
```

**Inconsistency:** Backend routes return different shapes:
- Some: `{ client: {...} }`
- Some: `{ clients: [...] }`
- Some: just the raw data object

**Impact:** Medium. Creates fragile frontend code with lots of `??` operators. One breaking change on backend breaks multiple clients.

---

### 7. **Mixed Language Field Names (French/English)**
**Location:** Throughout models and API

**Server (French):**
```typescript
// Backend
nom, prenom, telephone, statut, priorite
```

**Frontend (English):**
```typescript
// Frontend types
firstName, lastName, phone, status, priority
```

**Mapping Layer Exists (But Brittle):**
```typescript
function clientToFrontend(client: any): any {
  return {
    firstName: client.firstName ?? client.prenom ?? '',
    lastName: client.lastName ?? client.nom ?? '',
    // ... lots of ?? fallbacks
  };
}
```

**Impact:** Medium. Works due to mapping, but:
- Increases cognitive load
- Error-prone (`prenom` vs `firstName` typos)
- Harder to debug

---

### 8. **UTF-8 Encoding Issues in Backend**
**Location:** `src/app/backend/index.tsx` (and likely others)

**Problem:**
```typescript
// Line 46: Should be ✅ or 🚀, but shows as ??????
console.log(`?????? Server starting - ROUTES DER PUBLIQUES - Version ${SERVER_VERSION} ??????`);
// Line 100, 101, 124, 129: Same issue
```

**Impact:** Low. Cosmetic. Doesn't affect functionality but makes logs hard to read.

---

### 9. **Inconsistent Error Handling Patterns**
**Location:** Backend route handlers

**Pattern Variance:**
```typescript
// Pattern A: console.error with message + err.message
catch (err) {
  console.error('Error fetching clients:', err);
  return c.json({ error: 'Failed to fetch clients: ' + err.message }, 500);
}

// Pattern B: console.error only
catch (err) {
  return c.json({ error: String(err) }, 500);
}

// Pattern C: silent (swallow error)
try {
  Deno.mkdir(...);
} catch { }
```

**Impact:** Low-Medium. Makes debugging harder, inconsistent logging.

---

## Summary Table

| Issue | Severity | Files Affected | Fix Time | Impact |
|-------|----------|----------------|----------|--------|
| Auth token bug | 🔴 CRITICAL | 3 files | 15 min | Auth failures in production |
| localStorage vs PostgreSQL | 🔴 CRITICAL | 1 file | 1-2 hours | Data loss risk |
| Obsolete `/utils/supabase/` | 🟡 HIGH | 4+ files | 30 min | Confusion, maintenance burden |
| Unused Supabase dependency | 🟡 MEDIUM | package.json | 2 min | Wasted space |
| File naming inconsistency | 🟡 MEDIUM | 50+ files | 2-3 hours | Harder to navigate |
| API response formats | 🟡 MEDIUM | 10+ files | 2-3 hours | Brittle frontend |
| Mixed language names | 🟡 MEDIUM | 30+ files | 3-4 hours | Cognitive load |
| UTF-8 encoding | 🟠 LOW | 10+ files | 15 min | Cosmetic |
| Error handling | 🟠 LOW | 60+ files | 2-3 hours | Debugging difficulty |

---

## Recommendations (by priority)

### 1️⃣ IMMEDIATE (Today)
- [ ] Fix auth token bug in `App.tsx`, `DashboardView.tsx`, `KanbanBoard.tsx`
- [ ] Fix `agendaAPI` to use backend instead of localStorage

### 2️⃣ SHORT TERM (This sprint)
- [ ] Delete `/utils/supabase/` directory
- [ ] Remove `@supabase/supabase-js` from package.json
- [ ] Standardize API response format (always return `{ data: X, error: null }`)
- [ ] Fix UTF-8 emoji encoding

### 3️⃣ MEDIUM TERM (Refactor)
- [ ] Standardize file naming (choose `snake_case` or `camelCase` consistently)
- [ ] Consolidate language (choose English OR French, not both)
- [ ] Standardize error handling (create error handler utility)

---

## Question for You

**Before I proceed with improvements, please clarify:**

1. **Auth Strategy:** Should all components use `supabase.auth.getSession()` from `/utils/api/client.ts`?
2. **Language Preference:** Keep French field names on server (nom/prenom) and map on frontend, or switch everything to English?
3. **File Naming:** Prefer `snake_case` (routes.tsx) or `camelCase` (routes.ts)?
4. **localStorage:** Are there intentional reasons to use localStorage for certain data (offline support, caching)?

---

**Report compiled by:** Code Review Agent  
**Next step:** Wait for approval before applying fixes
