# PRU-7.3: Domain Boundary Audit Report

**Date**: 2026-07-19  
**Status**: Complete  
**Scope**: Analyze current codebase against domain boundaries defined in DOMAINS.md

---

## Executive Summary

Conducted a comprehensive audit of the backend codebase against the domain import contract defined in DOMAINS.md. Found **7 import violations** across 7 files, with most being intra-domain module organization issues. Only **1 critical cross-domain violation** requires refactoring.

**Severity Breakdown**:
- 🔴 Critical (cross-domain): 1 violation
- 🟡 Medium (circular/internal): 6 violations

---

## Violations by Domain

### 1. JURIDIQUE Domain
**Severity**: 🔴 **CRITICAL** (Cross-domain violation)

**File**: `src/app/backend/collecteur_juridique_routes.tsx`  
**Violation**: Imports PATRIMOINE module  
**Import**: `./montages_60_patrimoniaux.tsx`

**Issue**: JURIDIQUE should NOT import from PATRIMOINE per domain contract.  
**Root Cause**: Collecteur juridique needs montage data for legal document generation.  
**Resolution**: Extract shared montage interface to SHARED domain.

---

### 2. COMMUNICATION Domain
**Severity**: 🟡 **MEDIUM** (Intra-domain import)

**File**: `src/app/backend/email_routes.tsx`  
**Violation**: Imports from emailService  
**Import**: `./emailService.ts`

**Issue**: email_routes.tsx is COMMUNICATION, emailService.ts is also COMMUNICATION — this is correct internal module usage.  
**Resolution**: **FALSE POSITIVE** — intra-domain imports are allowed. No action needed.

---

### 3. SOCIAL Domain (2 violations)
**Severity**: 🟡 **MEDIUM** (Intra-domain circular refs)

#### 3a. `extracteur_regles_sociales.tsx` → `parser_social.tsx`
**Issue**: Both SOCIAL domain modules, but creates circular dependency chain.  
**Root Cause**: Parser pulls rules without proper abstraction boundary.  
**Resolution**: Refactor to have clear parser API, extracteur uses only public interface.

#### 3b. `parser_social.tsx` → `collecteur_social.tsx`
**Issue**: Circular reference within SOCIAL domain.  
**Root Cause**: Data collection and parsing are tightly coupled.  
**Resolution**: Separate collection from parsing; create public API boundary.

---

### 4. PATRIMOINE Domain (2 violations)
**Severity**: 🟡 **MEDIUM** (Circular refs within domain)

#### 4a. `montages_60_patrimoniaux.tsx` ↔ `montages_patrimoniaux.tsx`
**Issue**: Circular dependency between montage modules.  
**Root Cause**: Version 60 montage template references base montage template bidirectionally.  
**Resolution**: Move shared logic to `montages_core.tsx`, import unidirectionally.

#### 4b. `montages_patrimoniaux.tsx` ↔ `montages_60_patrimoniaux.tsx`
**Issue**: Reverse direction of same circular dependency.  
**Root Cause**: Mutual dependencies on template logic.  
**Resolution**: Extract common template logic to shared module.

---

### 5. REPORTS Domain
**Severity**: 🟡 **MEDIUM** (Intra-domain import)

**File**: `src/app/backend/rapport_simple_route.tsx`  
**Violation**: Imports from `rapport_simple.tsx`  

**Issue**: Both REPORTS domain modules — internal module usage.  
**Resolution**: **FALSE POSITIVE** — intra-domain imports are allowed. No action needed.

---

## Violation Classification

### By Type
- **Cross-domain violations**: 1 (must fix)
- **Intra-domain circular refs**: 4 (should refactor)
- **Valid intra-domain imports**: 2 (no action)

### By Impact
| Severity | Count | Effort | Impact |
|----------|-------|--------|--------|
| Critical | 1 | Medium | Blocks domain isolation |
| High | 4 | Low-Medium | Complicates refactoring |
| Info | 2 | None | No action needed |

---

## Refactoring Priority

### Priority 1 (Do First)
**JURIDIQUE → PATRIMOINE cross-domain violation**
- **What**: Move montage interface/types to SHARED
- **Why**: Unblocks proper domain isolation
- **Effort**: ~1 hour
- **Files**: 
  - Create `src/app/backend/shared/montage_types.ts`
  - Update `collecteur_juridique_routes.tsx` to import from SHARED
  - Update `montages_patrimoniaux.tsx` to export from SHARED

### Priority 2 (Follow-up)
**Circular dependencies within PATRIMOINE**
- **What**: Extract shared template logic
- **Why**: Improves maintainability of montage system
- **Effort**: ~2 hours
- **Files**:
  - Create `src/app/backend/montages_core.tsx`
  - Move common logic
  - Update both montage modules

### Priority 3 (Follow-up)
**Circular dependencies within SOCIAL**
- **What**: Separate collection from parsing with API boundary
- **Why**: Improves testability and domain clarity
- **Effort**: ~1.5 hours
- **Files**:
  - Refactor `collecteur_social.tsx` to public API only
  - Make `parser_social.tsx` depend on public API

---

## Quarterly Review Schedule

Per DOMAINS.md, domain violations should be audited quarterly:
- **Q3 2026 (Next Review)**: After refactoring Priority 1-3 violations
- **Tooling**: Use `graphify query` to detect new violations:
  ```bash
  graphify query "what files import across domain boundaries"
  ```
- **Automated Checks**: Consider eslint plugin for enforcement (PRU-7.4)

---

## Prevention Going Forward

### Code Review Process
- When reviewing PRs, check import paths against DOMAINS.md
- Flag any cross-domain imports for discussion
- Intra-domain circular refs should be caught early

### ESLint Rules (PRU-7.4)
- Create `eslint-plugin-domain-boundaries` or similar
- Enforce rules during CI/CD
- Prevent violations from merging

### Documentation
- Link DOMAINS.md in PR templates
- Add comments near import statements explaining why they're safe
- Document any necessary cross-domain dependencies

---

## Conclusion

The codebase is in **good shape** relative to the domain architecture:
- Only 1 critical cross-domain violation
- 4 internal circular refs are typical during refactoring
- 2 violations are false positives (valid intra-domain usage)

**Next Phase (PRU-7.4)**: Implement enforcement mechanism and fix violations starting with Priority 1.

