# PRU-7.4: Domain Boundary Enforcement & Refactoring Plan

**Date**: 2026-07-19  
**Status**: Strategy Document  
**Scope**: Set up automated enforcement and prioritize violation fixes

---

## Objective

Establish a sustainable system to:
1. **Prevent** new domain boundary violations (ESLint rules)
2. **Detect** existing violations (automated scanning)
3. **Fix** critical violations with clear priority order
4. **Monitor** domain health quarterly using graphify

---

## Part A: Enforcement Mechanism

### A1. ESLint Domain Boundary Plugin

Create a custom ESLint plugin to prevent cross-domain imports.

**File**: `eslint-plugin-domain-boundaries.js`

```javascript
// Place in: .eslintrc-plugins/domain-boundaries.js
module.exports = {
  rules: {
    'no-cross-domain-imports': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent imports that violate domain boundaries',
          category: 'Best Practices',
          recommended: true
        }
      },
      create(context) {
        const domains = {
          PATRIMOINE: ['CORE', 'SHARED'],
          FISCAL: ['CORE', 'SHARED'],
          SOCIAL: ['CORE', 'SHARED'],
          RETRAITE: ['CORE', 'SHARED'],
          JURIDIQUE: ['CORE', 'SHARED'],
          REPORTS: ['PATRIMOINE', 'FISCAL', 'SOCIAL', 'RETRAITE', 'JURIDIQUE', 'CORE', 'SHARED'],
          CORE: [],
          COMMUNICATION: ['CORE', 'SHARED']
        };

        function getDomain(filePath) {
          if (filePath.includes('patrimoine') || filePath.includes('montage')) return 'PATRIMOINE';
          if (filePath.includes('fiscal') || filePath.includes('bareme')) return 'FISCAL';
          if (filePath.includes('social') || filePath.includes('urssaf')) return 'SOCIAL';
          if (filePath.includes('retraite')) return 'RETRAITE';
          if (filePath.includes('juridique')) return 'JURIDIQUE';
          if (filePath.includes('rapport')) return 'REPORTS';
          if (filePath.includes('kv_store') || filePath.includes('auth')) return 'CORE';
          if (filePath.includes('email')) return 'COMMUNICATION';
          return null;
        }

        return {
          ImportDeclaration(node) {
            const sourceFile = context.getFilename();
            const importPath = node.source.value;
            
            // Skip external imports
            if (importPath.startsWith('npm:') || importPath.startsWith('@')) return;
            
            const sourceDomain = getDomain(sourceFile);
            const targetDomain = getDomain(importPath);
            
            if (!sourceDomain || !targetDomain) return;
            
            // Check if import is allowed
            const allowed = domains[sourceDomain];
            if (!allowed.includes(targetDomain)) {
              context.report({
                node,
                message: `Domain boundary violation: ${sourceDomain} cannot import from ${targetDomain}. ` +
                         `${sourceDomain} can only import from: ${allowed.join(', ')}`
              });
            }
          }
        };
      }
    }
  }
};
```

**Enable in `.eslintrc.json`**:
```json
{
  "overrides": [
    {
      "files": ["src/app/backend/**/*.{ts,tsx}"],
      "rules": {
        "domain-boundaries/no-cross-domain-imports": "error"
      },
      "plugins": ["domain-boundaries"]
    }
  ]
}
```

### A2. CI/CD Integration

Add to GitHub Actions / CI pipeline:

```yaml
# .github/workflows/domain-boundary-check.yml
name: Domain Boundary Check
on: [pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 24
      - run: npm install
      - run: npm run lint -- --rule 'domain-boundaries/no-cross-domain-imports'
        continue-on-error: false
```

### A3. Quarterly Graphify Audit

Document the quarterly audit process:

```bash
# Run quarterly to detect new violations
graphify query "what files import across domain boundaries"

# Generate report
graphify path PATRIMOINE JURIDIQUE  # Check if paths exist
graphify explain "domain boundaries violations"
```

**Schedule**: First Monday of each quarter (Q3, Q4 2026, etc.)  
**Owner**: Tech Lead  
**Report**: Document findings in `DOMAIN_AUDIT_{QUARTER}.md`

---

## Part B: Violation Refactoring Plan

### Refactoring Phase 1: Critical Cross-Domain Violations (Week 1)

**Target**: Fix JURIDIQUE → PATRIMOINE violation  
**Estimated Time**: 1-2 hours  
**Expected Impact**: Unlocks proper domain isolation

#### Step 1a: Create Shared Montage Types
**File**: `src/app/backend/shared/montage_types.ts`

```typescript
// Extract montage types that both domains need
export interface MontageTemplate {
  id: string;
  name: string;
  description: string;
  structureType: 'SCI' | 'EIRL' | 'SARL' | 'MICRO';
  requirements: string[];
}

export interface MontageResult {
  template: MontageTemplate;
  economie: number;
  compatibilite: number;
  etapes: string[];
}
```

**Action**: 
1. Extract types from `montages_patrimoniaux.tsx`
2. Move to `shared/montage_types.ts`
3. Export publicly

#### Step 1b: Update JURIDIQUE Imports
**File**: `src/app/backend/collecteur_juridique_routes.tsx`

**Change**:
```typescript
// OLD (violates domain boundary)
import { MontageTemplate } from './montages_60_patrimoniaux.tsx';

// NEW (uses SHARED domain)
import { MontageTemplate } from './shared/montage_types.ts';
```

#### Step 1c: Update PATRIMOINE Exports
**File**: `src/app/backend/montages_patrimoniaux.tsx`

**Change**:
```typescript
// Export shared types from SHARED instead of defining locally
export { MontageTemplate } from './shared/montage_types.ts';
```

**Verification**:
```bash
eslint src/app/backend/collecteur_juridique_routes.tsx
# Should report no violations
```

---

### Refactoring Phase 2: Circular Dependencies - PATRIMOINE (Week 2)

**Target**: Fix montage version circular dependency  
**Estimated Time**: 2-3 hours  
**Expected Impact**: Improves montage system maintainability

#### Step 2a: Extract Shared Montage Core
**File**: `src/app/backend/montages_core.tsx`

```typescript
// Shared logic used by both montage versions
export function calculateMontageEconomie(situation: ClientSituation): number {
  // Shared calculation logic
}

export function generateMontageSteps(template: MontageTemplate): string[] {
  // Shared step generation
}

export const MONTAGE_TEMPLATES = {
  SCI: { /* shared SCI config */ },
  EIRL: { /* shared EIRL config */ }
};
```

#### Step 2b: Refactor montages_patrimoniaux.tsx
- Import from `montages_core.tsx`
- Remove duplicate logic
- Expose PATRIMOINE-specific features

#### Step 2c: Refactor montages_60_patrimoniaux.tsx
- Import from `montages_core.tsx`
- Version-60-specific logic only
- No reverse imports to base version

**Dependency Graph After**:
```
montages_60_patrimoniaux.tsx
  ↓
montages_core.tsx (shared)
  ↓
montages_patrimoniaux.tsx
```

---

### Refactoring Phase 3: Circular Dependencies - SOCIAL (Week 3)

**Target**: Separate collection from parsing  
**Estimated Time**: 1.5-2 hours  
**Expected Impact**: Improves testability

#### Step 3a: Define Collecteur Public API
**File**: `src/app/backend/collecteur_social.tsx`

```typescript
// Public API - parser depends on this, not implementation details
export interface ICollecteurSocial {
  collecterDocuments(): Promise<Document[]>;
  getStats(): CollectionStats;
}

export class CollecteurSocial implements ICollecteurSocial {
  async collecterDocuments(): Promise<Document[]> {
    // Implementation
  }
  
  getStats(): CollectionStats {
    // Implementation
  }
}
```

#### Step 3b: Update Parser Imports
**File**: `src/app/backend/parser_social.tsx`

```typescript
// Only import public API
import type { ICollecteurSocial } from './collecteur_social.tsx';

export class ParserSocial {
  constructor(private collecteur: ICollecteurSocial) {}
  
  async parse(): Promise<ParsedData> {
    const docs = await this.collecteur.collecterDocuments();
    // Parse docs
  }
}
```

#### Step 3c: Update Extracteur
**File**: `src/app/backend/extracteur_regles_sociales.tsx`

```typescript
// Use public API only
import { CollecteurSocial } from './collecteur_social.tsx';

export async function loadSocialRules() {
  const collecteur = new CollecteurSocial();
  const stats = collecteur.getStats();
  // Use stats
}
```

---

## Part C: Monitoring & Maintenance

### C1. Domain Health Dashboard

Create quarterly snapshot (run each Q):

```bash
# Generate audit report
graphify query "analyze domain dependencies"

# Save to version-controlled file
cp graphify-out/GRAPH_REPORT.md docs/DOMAIN_HEALTH_Q3_2026.md
```

Track over time:
- Number of violations
- Violation types
- Refactoring progress

### C2. Code Review Checklist

Add to PR template:

```markdown
## Domain Boundary Check
- [ ] No new cross-domain imports
- [ ] Intra-domain imports are properly organized
- [ ] Circular dependencies are minimized
- [ ] Types are exported from appropriate domain/SHARED

Reference: [DOMAINS.md](./DOMAINS.md)
```

### C3. Documentation Updates

When a new domain is added or rules change:
1. Update `DOMAINS.md` with new domain/rules
2. Update ESLint plugin configuration
3. Document the change in `CHANGELOG.md`
4. Run graphify update to refresh knowledge base

---

## Implementation Timeline

| Phase | Target | Effort | Start | End |
|-------|--------|--------|-------|-----|
| A: Setup ESLint & CI | Week 1 | 2-3 hrs | Now | Jul 26 |
| B1: Fix JURIDIQUE→PATRIMOINE | Week 1 | 1-2 hrs | Now | Jul 26 |
| B2: Fix PATRIMOINE circular | Week 2 | 2-3 hrs | Jul 26 | Aug 2 |
| B3: Fix SOCIAL circular | Week 3 | 1.5-2 hrs | Aug 2 | Aug 9 |
| C: Setup monitoring | Week 2 | 1 hr | Jul 26 | Aug 2 |
| **Total** | **3 weeks** | **~10 hrs** | Now | Aug 9 |

---

## Success Criteria

✅ **Enforcement**:
- ESLint plugin installed and CI/CD integrated
- 0 new violations in PRs (enforced at merge)
- Quarterly audit scheduled and documented

✅ **Violations Fixed**:
- Phase 1: JURIDIQUE→PATRIMOINE cross-domain violation resolved
- Phase 2: PATRIMOINE circular dependency resolved
- Phase 3: SOCIAL circular dependency resolved

✅ **Monitoring**:
- Quarterly domain health dashboard created
- Code review checklist updated
- Team trained on domain boundaries

---

## Rollback Plan

If ESLint rules are too strict:
1. Audit which rules cause false positives
2. Adjust domain patterns in plugin configuration
3. Document exceptions in code comments
4. Create issue to refactor the code that caused exception

---

## Related Issues

- PRU-7.2: Domain Architecture (DOMAINS.md) ✅
- PRU-7.3: Domain Boundary Audit (DOMAIN_AUDIT_PRU73.md) ✅
- PRU-7.4: Enforcement & Refactoring Plan (this document) 🔄
- PRU-7.5: Implementation of violations fixes (will be created)
- PRU-7.6: Team training & adoption (will be created)

