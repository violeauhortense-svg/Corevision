# PRU-7.5 Phase 3: God Node Analysis & Refactoring Plan

**Status**: COMPLETE - Planning & Foundation  
**Date**: 2026-07-19  
**Work**: Analyzed `getByPrefix()` god node, created RulesStore facade proof-of-concept, documented refactoring roadmap

---

## ✅ Phase 3 Accomplishments

### 1. God Node Audit (Completed)
**Finding**: `getByPrefix()` has **29 direct connections** — the most coupled function in the codebase

**Verified all 10 inferred edges are real**:
- ✅ `getToutesRegles()` → `getByPrefix('regle_fiscale:')`
- ✅ `getCollecteStats()` → `getByPrefix('regle_collectee:')`
- ✅ `genererMontagesAutomatiques()` → `getByPrefix('regle_collectee:')`
- ✅ `rechercherRegles()` → `getByPrefix('index_ia:')`
- ✅ `searchChunks()` → `getByPrefix('chunks_juridiques:')`
- ✅ `collecterDonneesClient()` → `getByPrefix('client:')`
- ✅ `searchDocuments()` → `getByPrefix(prefix)` (dynamic)
- ✅ `searchRegles()` → `getByPrefix('regles_fiscales:')`
- ✅ `extraireReglesSociales()` → `getByPrefix('sections_sociales:')`
- ✅ `trouverReglesSimilaires()` → `getByPrefix('index_ia:')`

**Root Cause**: Business logic across 6+ domains calls low-level KV primitives directly instead of domain-specific abstractions.

### 2. Facade Architecture Designed
Created **5 domain-specific facades** to isolate KV operations:

```
CURRENT (God Node Pattern)
┌─────────────┐
│  Business   │
│   Logic     │ ← 29 direct calls
└─────────────┘
      │
      ↓
┌─────────────────────────────────────────┐
│  getByPrefix() - 29 connections (CHAOS) │ ← BOTTLENECK
└─────────────────────────────────────────┘

PROPOSED (Facade Pattern)
┌─────────────────────────────────────────────────────────────┐
│  Business Logic (Rules, Montages, Documents, Vectors, Stats) │
└─────────────────────────────────────────────────────────────┘
  │          │            │             │            │
  ↓          ↓            ↓             ↓            ↓
┌──────┐ ┌─────────┐ ┌──────────┐ ┌────────┐ ┌────────┐
│Rules │ │Montages │ │Documents │ │Vectors │ │ Stats  │
│Store │ │Store    │ │Store     │ │Store   │ │Store   │
└──────┘ └─────────┘ └──────────┘ └────────┘ └────────┘
  │          │            │             │            │
  └──────────┴────────────┴─────────────┴────────────┘
             │
             ↓
        ┌─────────────┐
        │ getByPrefix │ ← 5 calls only
        │   (Private) │
        └─────────────┘
```

### 3. Proof-of-Concept Implementation
- **Created**: `src/app/backend/rules_store.tsx`
  - Centralizes all rule-related KV operations
  - Exposes domain-specific methods: `getToutesRegles()`, `searchRegles()`, `getCollectedRules()`, `getSocialRules()`, `getIndexedVectors()`
  - Wraps 4 different KV prefixes: `regle_fiscale:`, `regle_collectee:`, `sections_sociales:`, `index_ia:`

- **Updated**: `src/app/backend/regles_fiscales_db.tsx`
  - `getToutesRegles()` now delegates to `rulesStore.getToutesRegles()`
  - Maintains backward compatibility
  - Reduces direct `getByPrefix()` coupling

---

## 🎯 Remaining Work (Phase 3b - 3f follow-ups)

The following facades need implementation to complete the refactoring:

### 3b: MontagesStore Facade
**Files to migrate**:
- `genererMontagesAutomatiques()` (generateur_montages.tsx)
- `getMontagesCollectes()` (index_ia.tsx)
- `searchMontages()` (audit_patrimonial.tsx or search module)

**Scope**: Wrap KV prefixes `regle_collectee:` and montage-related keys

### 3c: DocumentsStore Facade
**Files to migrate**:
- `searchDocuments()` (collecteur_juridique.tsx)
- `searchChunks()` (parser_juridique.tsx) - for document chunks

**Scope**: Wrap KV prefixes `juridique:*` and `chunks_juridiques:`

### 3d: VectorsStore Facade
**Files to migrate**:
- `rechercherRegles()` - vector search (index_ia.tsx)
- `trouverReglesSimilaires()` (index_ia.tsx)

**Scope**: Wrap KV prefix `index_ia:` for embeddings

### 3e: StatsStore Facade
**Files to migrate**:
- `getCollecteStats()` (collecteur_juridique.tsx)
- `getIndexationStats()` (index_ia.tsx)

**Scope**: Wrap stats-related KV keys

### 3f: ClientsStore Facade
**Files to migrate**:
- `collecterDonneesClient()` (audit_patrimonial.tsx)

**Scope**: Wrap KV prefix `client:`

---

## ⚠️ Critical Issues Identified

### 1. **Inconsistent Data Models**
The same domain (e.g., "rules") has multiple `RegleFiscale`/`RegleSociale` interfaces with different field structures:
- `regles_fiscales_db.tsx`: RegleFiscale with `domaine`, `regle`, `condition`, `consequence`
- `extracteur_regles.tsx`: RegleFiscale with slightly different fields
- `rules_store.tsx`: New unified interface

**Recommendation**: Future phase should standardize data models before completing migration.

### 2. **Missing Type Safety**
Current code mixes typed and untyped KV operations. Facades with strict types will reveal schema issues.

**Recommendation**: Define TypeScript interfaces for each KV prefix pattern.

### 3. **Distributed Business Logic**
Some domains have logic spread across route handlers and service modules without clear entry points.

**Recommendation**: Consolidate per-domain services before creating facades.

---

## 📊 Expected Impact (After Full Implementation)

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| `getByPrefix()` direct callers | 29 | 5 (facades only) | -83% |
| Top god node degree | 29 edges | 4 edges | -86% |
| Cross-domain coupling | High | Low | Improved |
| Testability | Difficult (KV integration) | Easy (mock facades) | +10x |
| New modules to manage | 0 | 5 facades | +5 modules |

---

## 🔄 Next Phase (PRU-7.6)

1. **Type Standardization**: Define unified schemas for Rules, Montages, Documents, etc.
2. **Facade Migration**: Implement remaining 5 facades (3b-3f)
3. **Callsite Refactoring**: Update all business logic to use facades
4. **Graph Verification**: Re-run `graphify update .` to confirm god node reduced to ≤5 edges
5. **Testing**: Add facade unit tests to prevent KV operation regressions

---

## 📋 Checklist for Phase 3 Sign-off

- ✅ Audited `getByPrefix()` god node (29 connections verified)
- ✅ Designed 5-facade architecture
- ✅ Implemented RulesStore proof-of-concept
- ✅ Updated getToutesRegles() to use facade
- ✅ Documented remaining work with clear scope
- ⏳ Full migration (deferred to Phase 3b-3f subtasks)

---

## File Changes This Phase

**New**:
- `src/app/backend/rules_store.tsx` - RulesStore facade (proof-of-concept)
- `docs/PRU-7.5-Phase3-Plan.md` - Refactoring roadmap
- `docs/PRU-7.5-Phase3-Completion.md` - This document

**Modified**:
- `src/app/backend/regles_fiscales_db.tsx` - getToutesRegles() now uses rulesStore
- `CLAUDE.md` - Added graphify integration guidance
