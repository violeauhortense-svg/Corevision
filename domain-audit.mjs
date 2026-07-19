import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Domain definitions from DOMAINS.md
const domains = {
  PATRIMOINE: {
    pattern: /patrimoine|montage/i,
    canImportFrom: ['CORE', 'SHARED'],
    files: []
  },
  FISCAL: {
    pattern: /fiscal|bareme|regles_fiscales/i,
    canImportFrom: ['CORE', 'SHARED'],
    files: []
  },
  SOCIAL: {
    pattern: /social|urssaf|collecteur_social/i,
    canImportFrom: ['CORE', 'SHARED'],
    files: []
  },
  RETRAITE: {
    pattern: /retraite|collecteur_retraite/i,
    canImportFrom: ['CORE', 'SHARED'],
    files: []
  },
  JURIDIQUE: {
    pattern: /juridique|collecteur_juridique/i,
    canImportFrom: ['CORE', 'SHARED'],
    files: []
  },
  REPORTS: {
    pattern: /rapport|report/i,
    canImportFrom: ['PATRIMOINE', 'FISCAL', 'SOCIAL', 'RETRAITE', 'JURIDIQUE', 'CORE', 'SHARED'],
    files: []
  },
  CORE: {
    pattern: /kv_store|auth|session|validation|storage|core_vision/i,
    canImportFrom: [],
    files: []
  },
  COMMUNICATION: {
    pattern: /email|webhook|notification/i,
    canImportFrom: ['CORE', 'SHARED'],
    files: []
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

function scanFiles(dir) {
  const files = [];
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        walk(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
        files.push(fullPath);
      }
    }
  }
  walk(dir);
  return files;
}

const violations = [];
const scannedFiles = [];

// Scan backend files
const backendFiles = scanFiles('./src/app/backend');
for (const filepath of backendFiles) {
  const relativePath = path.relative('.', filepath);
  scannedFiles.push(relativePath);
  
  const content = fs.readFileSync(filepath, 'utf8');
  const sourceDomain = getDomain(relativePath);
  
  if (!sourceDomain) continue;
  
  const imports = extractImports(content);
  const domainConfig = domains[sourceDomain];
  
  for (const imp of imports) {
    // Skip external imports
    if (imp.startsWith('npm:') || imp.startsWith('@') || imp.startsWith('jsr:')) continue;
    if (!imp.includes('.')) continue;
    
    const importDomain = getDomain(imp);
    
    if (importDomain && domainConfig.canImportFrom.length > 0 && !domainConfig.canImportFrom.includes(importDomain)) {
      violations.push({
        sourceFile: relativePath,
        sourceDomain,
        importPath: imp,
        importedDomain: importDomain
      });
    }
  }
}

console.log(`\n📊 Domain Boundary Audit - PRU-7.3\n${'='.repeat(60)}\n`);
console.log(`Backend files scanned: ${backendFiles.length}`);
console.log(`Violations found: ${violations.length}\n`);

if (violations.length > 0) {
  console.log(`🚨 Import Boundary Violations:\n`);
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
      console.log(`     → imports ${v.importedDomain}: ${v.importPath}`);
    });
  }
}

console.log(`\n${'='.repeat(60)}\n`);
