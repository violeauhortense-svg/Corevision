# PRU-7.5 Phase 3: Constrain `getByPrefix()` God Node

**Status**: In Planning  
**Phase**: 3 of ~5  
**Objective**: Break the 29-edge `getByPrefix()` coupling hub by introducing domain-specific KV facades.

## Problem

The graph analysis shows `getByPrefix()` is the most connected function (29 edges):
- **Rules domain**: 5 functions (getToutesRegles, rechercherRegles, searchRegles, etc.)
- **Montages domain**: 4 functions (genererMontagesAutomatiques, getMontagesCollectes, searchMontages)
- **Search/indexing**: 5 functions (searchChunks, searchDocuments, searchVecteurs, etc.)
- **Delete operations**: 5 functions (deleteAllRegles, deleteAllMontages, deleteAllChunks, etc.)
- **Data collection**: 2 functions (collecterDonneesClient, extraireReglesSociales)
- **Stats**: 2 functions (getCollecteStats, getIndexationStats)

This violates the domain-boundary principle established in Phases 1–2. Business logic should not call low-level KV primitives directly.

## Solution

Create **domain-specific facades** that wrap `getByPrefix()` and control access patterns:

### 1. **RulesStore** facade (rules domain)
- `getRulesWithPrefix(prefix)`
- `deleteRulesByPrefix(prefix)`
- `searchRulesByKeyword(keyword)`
- Direct calls: `getToutesRegles()`, `rechercherRegles()`, `searchRegles()`, `extraireReglesSociales()`

### 2. **MontagesStore** facade (montages domain)
- `getMontagesWithPrefix(prefix)`
- `deleteMontagesByPrefix(prefix)`
- `searchMontagesByPattern(pattern)`
- Direct calls: `genererMontagesAutomatiques()`, `getMontagesCollectes()`, `searchMontages()`

### 3. **DocumentsStore** facade (documents domain)
- `getDocumentsWithPrefix(prefix)`
- `searchDocuments(query)`
- `deleteDocuments(pattern)`
- Direct calls: `searchDocuments()`, integration with `searchChunks()`

### 4. **VectorsStore** facade (embeddings/search domain)
- `getVectorsWithPrefix(prefix)`
- `deleteVectorsByPrefix(prefix)`
- `searchVectors(embedding)`
- Direct calls: `searchChunks()`, `trouverReglesSimilaires()`, `deleteAllVecteurs()`

### 5. **StatsStore** facade (telemetry/metrics)
- `getStatsWithPrefix(prefix)`
- `recordStat(key, value)`
- Direct calls: `getCollecteStats()`, `getIndexationStats()`

## Expected Impact

- **`getByPrefix()` connections**: 29 → 5 (only called by facades)
- **Facade connectivity**: Each exposed through narrow domain APIs
- **New boundary**: Clear "KV primitives" layer vs "domain logic" layer
- **Testability**: Easier to mock/stub per-domain without KV coupling
- **Extensibility**: Adding new domains doesn't couple to `getByPrefix()`

## Implementation Order

1. **Audit inferred edges** (10 INFERRED edges need verification)
2. **Create facade interfaces** (define public methods per domain)
3. **Implement RulesStore** (highest call volume, ~6 callers)
4. **Implement MontagesStore** (tightly coupled with montages_core.tsx)
5. **Implement DocumentsStore** (indexing integration)
6. **Implement VectorsStore** (embeddings system)
7. **Implement StatsStore** (lightweight, low risk)
8. **Migrate callsites** (redirect domain functions to facades)
9. **Verify graph** (`graphify update .` to confirm new structure)

## Risk Mitigation

- **Preserve backward compatibility**: Facades are additive; old KV calls deprecated gradually
- **Incremental migration**: One facade at a time, test each domain independently
- **Graph verification**: Re-run `graphify update .` after each facade to catch issues
- **Acceptance test**: Phase complete when `getByPrefix()` edges reduce to ≤5

## Acceptance Criteria

✅ `getByPrefix()` direct caller count reduced from 29 to ≤5  
✅ All 5 facades implemented with tests  
✅ No domain logic calls `getByPrefix()` directly  
✅ Graph shows new facade nodes as intermediaries  
✅ Build passes, no regressions in existing tests
