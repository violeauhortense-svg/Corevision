const fs = require('fs');
const path = require('path');

// Domain definitions from DOMAINS.md
const domains = {
  PATRIMOINE: {
    pattern: /patrimoine|montage/i,
    canImportFrom: ['CORE', 'SHARED'],
    cannotImportFrom: ['FISCAL', 'SOCIAL', 'RETRAITE', 'JURIDIQUE', 'REPORTS']
  },
  FISCAL: {
    pattern: /fiscal|bareme|regles_fiscales/i,
    canImportFrom: ['CORE', 'SHARED'],
    cannotImportFrom: ['PATRIMOINE', 'SOCIAL', 'RETRAITE', 'JURIDIQUE', 'REPORTS']
  },
  SOCIAL: {
    pattern: /social|urssaf|collecteur_social/i,
    canImportFrom: ['CORE', 'SHARED'],
    cannotImportFrom: ['PATRIMOINE', 'FISCAL', 'RETRAITE', 'JURIDIQUE', 'REPORTS']
  },
  RETRAITE: {
    pattern: /retraite|collecteur_retraite/i,
    canImportFrom: ['CORE', 'SHARED'],
    cannotImportFrom: ['PATRIMOINE', 'FISCAL', 'SOCIAL', 'JURIDIQUE', 'REPORTS']
  },
  JURIDIQUE: {
    pattern: /juridique|collecteur_juridique/i,
    canImportFrom: ['CORE', 'SHARED'],
    cannotImportFrom: ['PATRIMOINE', 'FISCAL', 'SOCIAL', 'RETRAITE', 'REPORTS']
  },
  REPORTS: {
    pattern: /rapport|report/i,
    canImportFrom: ['PATRIMOINE', 'FISCAL', 'SOCIAL', 'RETRAITE', 'JURIDIQUE', 'CORE', 'SHARED'],
    cannotImportFrom: []
  },
  CORE: {
    pattern: /kv_store|auth|session|validation|storage/i,
    canImportFrom: [],
    cannotImportFrom: []
  },
  IA: {
    pattern: /ia|moteur_|gpt|llm|openai/i,
    canImportFrom: [],
    cannotImportFrom: []
  },
  COMMUNICATION: {
    pattern: /email|webhook|notification|contact/i,
    canImportFrom: ['CORE', 'SHARED'],
    cannotImportFrom: []
  },
  UI: {
    pattern: /components|hooks/i,
    canImportFrom: ['CORE', 'SHARED'],
    cannotImportFrom: []
  },
  SHARED: {
    pattern: /types|utils|shared/i,
    canImportFrom: [],
    cannotImportFrom: []
  }
};

function getDomain(filepath) {
  for (const [domainName, config] of Object.entries(domains)) {
    if (config.pattern.test(filepath)) {
      return domainName;
    }
  }
  return null;
}

function extractImports(content) {
  const imports = [];
  const regex = /import\s+(?:{[^}]*}|[^from]+)\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

function scanFiles(dir, pattern) {
  const files = [];
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        walk(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
        if (pattern.test(fullPath)) {
          files.push(fullPath);
        }
      }
    }
  }
  walk(dir);
  return files;
}

const violations = [];

// Scan backend files
const backendFiles = scanFiles('./src/app/backend', /backend/);
const componentFiles = scanFiles('./src/app/components', /components/);
const allRelevantFiles = [...backendFiles, ...componentFiles];

for (const filepath of allRelevantFiles) {
  const content = fs.readFileSync(filepath, 'utf8');
  const sourceDomain = getDomain(filepath);
  
  if (!sourceDomain) continue;
  
  const imports = extractImports(content);
  const domainConfig = domains[sourceDomain];
  
  for (const imp of imports) {
    // Skip node_modules and external imports
    if (imp.startsWith('npm:') || imp.startsWith('@') || !imp.includes('/')) continue;
    
    // Check if import is relative and resolve it
    const importDomain = getDomain(imp);
    
    if (importDomain && domainConfig.cannotImportFrom.includes(importDomain)) {
      violations.push({
        sourceFile: filepath,
        sourceDomain,
        importPath: imp,
        importedDomain: importDomain,
        severity: 'error'
      });
    }
  }
}

console.log(`\n📊 Domain Boundary Audit Results\n${'='.repeat(50)}\n`);
console.log(`Total files scanned: ${allRelevantFiles.length}`);
console.log(`Violations found: ${violations.length}\n`);

if (violations.length > 0) {
  console.log(`🚨 Violations by domain:\n`);
  const byDomain = {};
  for (const v of violations) {
    if (!byDomain[v.sourceDomain]) {
      byDomain[v.sourceDomain] = [];
    }
    byDomain[v.sourceDomain].push(v);
  }
  
  for (const [domain, vList] of Object.entries(byDomain)) {
    console.log(`\n${domain} (${vList.length} violations):`);
    vList.forEach(v => {
      console.log(`  ❌ ${v.sourceFile}`);
      console.log(`     → imports from ${v.importedDomain}: ${v.importPath}`);
    });
  }
}

console.log(`\n${'='.repeat(50)}`);
