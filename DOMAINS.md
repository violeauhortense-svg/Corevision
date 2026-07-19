# Corevision Domain Architecture

This document formalizes domain boundaries, dependencies, and import contracts for the Corevision SaaS. Each domain owns a vertical slice of business logic and must maintain strict unidirectional import rules to prevent circular dependencies and code asphyxiation.

## Domain Inventory

### 1. **PATRIMOINE** (Wealth Management)
**Owner**: Patrimoine team  
**Files**: `src/app/backend/audit_patrimonial*.tsx`, `calculs_patrimoniaux.tsx`, `montages_patrimoniaux*.tsx`, `simulateur_patrimonial.tsx`, `rapport_patrimonial.tsx`, `moteur_patrimonial_ia.tsx`

**Responsibility**:
- Client wealth analysis and structuring
- Asset valorization and categorization (immobilier, financier, professionnel)
- Patrimony simulations and projections
- Montage (wealth structuring) generation and management
- Patrimony-specific AI intelligence

**May Import From**:
- `CORE` (client data, sessions, validation, storage)
- `SHARED` (types, utilities)

**May NOT Import From**:
- FISCAL, SOCIAL, RETRAITE, JURIDIQUE, REPORTS (except report generation hooks)
- Any domain-specific logic outside PATRIMOINE

**God Nodes**:
- `calcul_routes()` — patrimony calculation entry points
- `analyserProfilClient()` — client wealth profile analysis
- `getTotalActif()`, `getTotalPassif()` — balance sheet aggregation

---

### 2. **FISCAL** (Tax Optimization)
**Owner**: Fiscal team  
**Files**: `src/app/backend/regles_fiscales_db.tsx`, `baremes_routes.tsx`, `recommandations.tsx`, `extracteur_regles.tsx`

**Responsibility**:
- Tax rules and rate tables (barèmes)
- Fiscal regime management (IS, IR, Micro, Réel)
- Tax recommendations based on situation
- Regulatory rule extraction and updates

**May Import From**:
- `CORE` (client data, validation, storage)
- `SHARED` (types, utilities)

**May NOT Import From**:
- PATRIMOINE, SOCIAL, RETRAITE, JURIDIQUE, REPORTS
- Domain-specific logic outside FISCAL

**God Nodes**:
- `getReglesCollectees()` — fetch active tax rules
- `initBaremes2026()` — barème initialization
- `scrapeBOFiP()` — external rule data source

---

### 3. **SOCIAL** (Social Security & Compliance)
**Owner**: Social team  
**Files**: `src/app/backend/collecteur_social.tsx`, `collecteur_social_routes.tsx`, `extracteur_regles_sociales.tsx`, `parser_social.tsx`

**Responsibility**:
- Social security contribution tracking
- URSSAF compliance and document collection
- Social regime rules and updates
- Social security simulation

**May Import From**:
- `CORE` (client data, validation, storage)
- `SHARED` (types, utilities)

**May NOT Import From**:
- PATRIMOINE, FISCAL, RETRAITE, JURIDIQUE, REPORTS
- Domain-specific logic outside SOCIAL

**God Nodes**:
- `collecterDocumentsURSSAF()` — URSSAF document aggregation
- `getStatsCollecteSociale()` — social collection metrics

---

### 4. **RETRAITE** (Retirement Planning)
**Owner**: Retraite team  
**Files**: `src/app/backend/collecteur_retraite.tsx`, `collecteur_retraite_routes.tsx`, `extracteur_regles_retraite.tsx`, `parser_retraite.tsx`

**Responsibility**:
- Retirement regime tracking (CNAVPL, CIPAV, CARMF, etc.)
- Retraite contribution and accrual management
- Retirement rules and updates
- Retirement projection and simulation

**May Import From**:
- `CORE` (client data, validation, storage)
- `SHARED` (types, utilities)

**May NOT Import From**:
- PATRIMOINE, FISCAL, SOCIAL, JURIDIQUE, REPORTS
- Domain-specific logic outside RETRAITE

**God Nodes**:
- `collecterDocumentsRetraite()` — retraite document aggregation

---

### 5. **JURIDIQUE** (Legal & Structure)
**Owner**: Juridique team  
**Files**: `src/app/backend/collecteur_juridique.tsx`, `collecteur_juridique_routes.tsx`, `parser_juridique.tsx`

**Responsibility**:
- Legal structure tracking (SARL, EURL, SAS, Auto-entrepreneur, etc.)
- Corporate form validation
- Legal document collection and extraction
- Legal regime rules

**May Import From**:
- `CORE` (client data, validation, storage)
- `SHARED` (types, utilities)

**May NOT Import From**:
- PATRIMOINE, FISCAL, SOCIAL, RETRAITE, REPORTS
- Domain-specific logic outside JURIDIQUE

---

### 6. **REPORTS** (Analysis & Synthesis)
**Owner**: Reports team  
**Files**: `src/app/backend/rapport_patrimonial.tsx`, `rapport_structure.tsx`, `rapport_simple.tsx`, `bilan_routes.tsx`, `der_routes.tsx`, `incoherences.tsx`

**Responsibility**:
- Comprehensive audit and bilan reports
- Cross-domain data synthesis (patrimony + fiscal + social + retraite)
- Recommendation aggregation
- Inconsistency detection and reporting

**May Import From**:
- `CORE` (client data, validation, storage)
- `SHARED` (types, utilities)
- **Any domain** (read-only queries to build reports)

**May NOT Import From**:
- Any domain's business logic implementation
- Must use public API surfaces (routes) to consume domain data

**Note**: REPORTS is the only domain allowed to cross-reference others. All domains produce for REPORTS via well-defined route contracts.

---

### 7. **CORE** (Foundations & Infrastructure)
**Owner**: Infra team  
**Files**: `src/app/backend/auth.tsx`, `sessions.tsx`, `client_routes.tsx`, `kv_store.tsx`, `storage.tsx`, `helpers.tsx`, `validation.tsx`, `index.tsx`

**Responsibility**:
- Authentication & session management
- Client CRUD operations
- Key-value storage abstractions
- Validation & sanitization
- Common helpers and utilities
- Route orchestration

**May Import From**:
- Nothing (no upstream dependencies)

**May NOT Import From**:
- Any domain (PATRIMOINE, FISCAL, SOCIAL, RETRAITE, JURIDIQUE, REPORTS)
- This is the foundation; domains depend on it

**God Nodes**:
- `getSession()` — auth state retrieval
- `get()`, `set()` — KV storage primitives
- `getByPrefix()` — prefix queries

---

### 8. **IA / INTELLIGENCE** (AI & Analysis)
**Owner**: IA team  
**Files**: `src/app/backend/ia_analyse_avancee.tsx`, `index_ia.tsx`, `index_ia_routes.tsx`, `moteur_patrimonial_ia.tsx`

**Responsibility**:
- AI-driven analysis and insights
- Advanced client profiling
- Intelligent recommendations
- ML model integration

**May Import From**:
- `CORE` (client data, sessions, validation)
- `SHARED` (types, utilities)
- **Read-only queries** from any domain (read public surfaces only)

**May NOT Import From**:
- Domain implementations; only consume public APIs

---

### 9. **COMMUNICATION** (Email & Notifications)
**Owner**: Communication team  
**Files**: `src/app/backend/email_routes.tsx`, `mail_routes.tsx`, `email_webhook.tsx`, `emailService.ts`

**Responsibility**:
- Email template rendering and dispatch
- Webhook handling for email events
- Notification orchestration
- User communication flows

**May Import From**:
- `CORE` (client data, validation)
- `SHARED` (types, utilities)

**May NOT Import From**:
- Domain-specific logic (PATRIMOINE, FISCAL, etc.) except via public routes

---

### 10. **UI / DASHBOARD** (Frontend Integration)
**Owner**: Frontend team  
**Files**: `src/app/backend/dashboard_routes.tsx`, `corevision_routes.tsx`, `task_routes.tsx`, `rdv_routes.tsx`, `signature_routes.tsx`, `knowledge_base_routes.tsx`

**Responsibility**:
- Dashboard data assembly
- Task and workflow orchestration
- Appointment/RDV management
- Signature management
- Knowledge base queries

**May Import From**:
- `CORE` (client data, sessions, validation)
- `SHARED` (types, utilities)
- **Read-only queries** from any domain via public routes

**May NOT Import From**:
- Domain implementations; aggregate via public API contracts only

---

### 11. **SHARED** (Types & Common Utilities)
**Owner**: All teams  
**Files**: `src/app/types/**/*.ts`, `src/app/utils/**/*.ts`, `src/app/config/**/*.ts`, `src/app/hooks/**/*.ts`

**Responsibility**:
- Shared TypeScript type definitions
- Common utility functions (non-domain-specific)
- Configuration management
- React hooks (UI-agnostic)

**May Import From**:
- Nothing (no upstream dependencies)

**May NOT Import From**:
- Any domain or CORE
- This is foundational; everything depends on it

---

## Import Rules (Golden Contract)

### Unidirectional Dependency Graph

```
SHARED ← CORE ← {PATRIMOINE, FISCAL, SOCIAL, RETRAITE, JURIDIQUE, IA, COMMUNICATION}
                ↓
              REPORTS (read-only from all domains)
              
SHARED ← {IA, COMMUNICATION, UI} (consume public routes only from domains)
```

### Enforcement Checklist

For every file merge, verify:

1. **No circular imports**: `A → B → A` is forbidden
2. **Domain isolation**: Domain X's impl files only import CORE/SHARED + own domain
3. **Public APIs**: Cross-domain consumption happens via route handlers (e.g., `calculateAuditRoute()`)
4. **REPORTS access**: Only REPORTS may reference multiple domains; it must use public APIs
5. **SHARED is foundation**: Only SHARED and CORE at bottom; all domains import up

### When to Create New Shared Code

Add to SHARED only if:
- Two+ domains need it AND it's not domain-specific logic
- Examples: `ClientType`, `validateEmail()`, `formatCurrency()`

Do NOT add to SHARED:
- Domain-specific calculations (`calculatePatrimony` → PATRIMOINE)
- Domain-specific types (`TaxRegime` → FISCAL)
- Cross-domain logic (goes to REPORTS)

---

## Quarterly Review Cadence

Every **Q**, run:

```bash
graphify update .
graphify query "list cross-domain imports"
graphify path "PATRIMOINE" "FISCAL" --visualize
```

Review findings for:
- New circular dependencies
- Unplanned cross-domain references
- Shared code that should move to a domain

Document outcomes in `DOMAINS_REVIEW_<QUARTER>.md`.

---

## Onboarding New Domains

If adding a new domain (e.g., ASSURANCE):

1. Create domain folder: `src/app/backend/assurance_*.tsx`
2. Add section to this file with responsibility, imports, and god nodes
3. Update import rules graph above
4. Create child issue to audit existing code for unintended dependencies
5. Update CLAUDE.md with new domain owner contact

---

## Migration Path for Existing Code

Existing code may violate these rules. Migration steps:

1. **Audit** (PRU-7.1): Scan for violations using `graphify query`
2. **Document** (this file): Formalize what we're fixing
3. **Refactor incrementally**: One violation per PR, with clear rationale
4. **Monitor**: Graphify queries in CI to prevent regression

This is a **living document**. Update it as domains evolve, and link child issues for large refactors.
