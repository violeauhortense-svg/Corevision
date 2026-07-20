# Phase 5: Facade Completeness Audit (PRU-12)

**Status**: Planned  
**Priority**: High (blocks god node reduction)  
**Date**: 2026-07-20  

---

## Executive Summary

The facade pattern introduced in Phase 4 is **incomplete**. While 6 store facades exist (DocumentsStore, RulesStore, ClientsStore, MontagesStore, StatsStore, VectorsStore), **22 application files bypass them to call `kv.getByPrefix()` directly**, violating the abstraction layer.

**Impact**: 
- God node `getByPrefix()` remains at **45 edges** (expected 30 after Phase 4)
- Architecture remains coupled to Deno KV implementation
- Testability compromised (can't mock KV layer)
- Persistence layer swaps are blocked

---

## Files Violating Facade Pattern

### Application Files (should use facades, not `kv.getByPrefix()`)

1. **audit_patrimonial.tsx** - Uses `kv.getByPrefix('audit_patrimonial:')`
2. **audit_patrimonial_routes.tsx** - Direct KV access for audit queries
3. **auth.tsx** - Session/auth KV access
4. **baremes_routes.tsx** - Uses `kv.getByPrefix("bareme_ir_")`
5. **bilan_routes.tsx** - Bilans KV access
6. **client_routes.tsx** - Client data queries
7. **collecteur_retraite.tsx** - Retirement collector logic
8. **collecteur_social.tsx** - Social security collector logic
9. **dashboard_routes.tsx** - Dashboard data queries
10. **der_routes.tsx** - DER (Déclaration d'Expertise Retraite) routes
11. **email_routes.tsx** - Email template/config storage
12. **email_webhook.tsx** - Email webhook handling
13. **extracteur_regles.tsx** - Rule extraction (should use RulesStore)
14. **extracteur_regles_retraite.tsx** - Retirement rules extraction
15. **extracteur_regles_sociales.tsx** - Social rules extraction
16. **generateur_montages.tsx** - Montage generation (should use MontagesStore)
17. **incoherences_routes.tsx** - Inconsistency detection
18. **index.tsx** - Main entry point setup
19. **index_ia.tsx** - AI index operations
20. **knowledge_base_routes.tsx** - Knowledge base operations
21. **mail_routes.tsx** - Mail operations
22. **moteur_patrimonial_ia.tsx** - AI patrimony engine

Plus ~13 more in extractors, parsers, routes...

---

## Missing Store Facades

Based on direct KV access patterns, these domain stores need to be created:

### High Priority (used by >3 application files)

| Domain | Current Pattern | Required Methods | Priority |
|--------|-----------------|------------------|----------|
| **Audits** | `kv.getByPrefix('audit_patrimonial:')` | getAudits(), storeAudit(), deleteAudit() | 🔴 High |
| **Baremés** | `kv.getByPrefix("bareme_ir_")` | getBaremes(), storeBareme(), updateBareme() | 🔴 High |
| **Bilans** | `kv.getByPrefix('bilan_signature:')` | getBilans(), storeBilan(), deleteBilan() | 🔴 High |
| **Tasks** | `kv.getByPrefix('task:')` | getTasks(), storeTask(), deleteTask() | 🔴 High |
| **DER** | `kv.getByPrefix('der_signature:')` | getDERs(), storeDER(), deleteDER() | 🟠 Medium |
| **Orders** | `kv.getByPrefix('corevision_order_')` | getOrders(), storeOrder(), updateOrder() | 🟠 Medium |
| **Rapports** | `kv.getByPrefix('rapport_patrimonial_')` | getRapports(), storeRapport(), deleteRapport() | 🟠 Medium |
| **Sessions** | Direct session KV access | getSessions(), storeSession(), deleteSession() | 🔴 High |

---

## Implementation Strategy

### Phase 5.1: Create Missing Core Stores (Week 1)

**AuditStore** (consolidates audit data)
```typescript
class AuditStore {
  async getAudits(userId: string): Promise<Audit[]>
  async getAudit(auditId: string): Promise<Audit | null>
  async storeAudit(audit: Audit): Promise<void>
  async deleteAudit(auditId: string): Promise<void>
  async searchAudits(userId: string, query?: string): Promise<Audit[]>
}
```

**BaremesStore** (tax brackets and schedules)
```typescript
class BaremesStore {
  async getBaremes(year: number): Promise<Bareme[]>
  async getBareme(id: string): Promise<Bareme | null>
  async storeBareme(bareme: Bareme): Promise<void>
  async updateBareme(id: string, updates: Partial<Bareme>): Promise<void>
}
```

**BilansStore** (signature bilans)
```typescript
class BilansStore {
  async getBilans(userId: string): Promise<Bilan[]>
  async getBilan(bilantId: string): Promise<Bilan | null>
  async storeBilan(bilan: Bilan): Promise<void>
  async deleteBilan(bilantId: string): Promise<void>
}
```

**SessionStore** (auth sessions)
```typescript
class SessionStore {
  async getSession(sessionId: string): Promise<Session | null>
  async storeSession(session: Session): Promise<void>
  async deleteSession(sessionId: string): Promise<void>
  async deleteExpiredSessions(beforeDate: Date): Promise<void>
}
```

### Phase 5.2: Update Application Files (Week 1-2)

Systematically replace `kv.getByPrefix()` calls:

**Before**:
```typescript
import { kv } from '../kv_store';
const audits = await kv.getByPrefix('audit_patrimonial:');
```

**After**:
```typescript
import { auditStore } from '../audit_store';
const audits = await auditStore.getAudits(userId);
```

Priority order (by impact):
1. `audit_patrimonial.tsx` - heavily used
2. `auth.tsx` - critical for security
3. Route handlers (baremes, bilans, der, client)
4. Collectors and extractors

### Phase 5.3: Verification & Cleanup (Week 2)

- [ ] Run `graphify update .` and verify `getByPrefix()` edges < 25
- [ ] Grep for remaining `kv.getByPrefix()` calls in app code
- [ ] Verify all store files are ONLY in `src/app/backend/*_store.tsx`
- [ ] Remove any remaining kv imports from non-store files
- [ ] Update import statements in all affected files

---

## Architectural Principles (Non-Negotiable)

✅ **Facade Pattern**: All KV access flows through store facades  
✅ **No KV Leaks**: Application code NEVER imports `kv_store` directly  
✅ **Domain Language**: Stores expose domain methods (`getAudits`, not `getByPrefix`)  
✅ **Encapsulation**: Store prefixes are private; consumers don't know KV details  
✅ **Consistency**: Read/Write/Delete methods for all resources  

---

## Success Criteria

- [ ] All 6+ new stores created with complete CRUD methods
- [ ] All 22 application files use facades instead of direct KV access
- [ ] Zero remaining `import.*kv` in non-store files
- [ ] `getByPrefix()` god node reduced to < 25 edges
- [ ] All tests pass
- [ ] Architecture review score improves to 9.0+/10

---

## Related Issues

- **PRU-7.5**: Phase 4 domain-specific store facades (completed)
- **PRU-12**: Software Architect oversight (current)
- **Recommended**: Create child issues for each store creation (5.1.1, 5.1.2, etc.)

---

## Decision Log

**Decision**: Facade pattern is non-negotiable architectural constraint  
**Rationale**: Enables persistence layer independence, testability, clean separation of concerns  
**Approved by**: Software Architect (PRU-12)

---

**Next Action**: Create child issues for Phase 5.1 store creation, starting with AuditStore + SessionStore (highest impact).
