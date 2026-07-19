#!/usr/bin/env node
/**
 * Domain Boundary Checker
 * Scans backend files for cross-domain imports and reports violations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.join(__dirname, '../src/app/backend');

// Domain dependency rules
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
  const normalized = filePath.replace(/\\/g, '/');

  if (normalized.includes('patrimoine') || normalized.includes('montage')) return 'PATRIMOINE';
  if (normalized.includes('fiscal') || normalized.includes('bareme')) return 'FISCAL';
  if (normalized.includes('social') || normalized.includes('urssaf')) return 'SOCIAL';
  if (normalized.includes('retraite')) return 'RETRAITE';
  if (normalized.includes('juridique')) return 'JURIDIQUE';
  if (normalized.includes('rapport') || normalized.includes('reports')) return 'REPORTS';
  if (normalized.includes('kv_store') || normalized.includes('auth')) return 'CORE';
  if (normalized.includes('email') || normalized.includes('communication')) return 'COMMUNICATION';
  return null;
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const violations = [];
  const sourceDomain = getDomain(filePath);

  if (!sourceDomain) return violations;

  // Match import statements (handles ES6 imports)
  const importRegex = /import\s+(?:{[^}]*}|[^'"\s]+|\*\s+as\s+\w+)\s+from\s+['"]([^'"]+)['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];

    // Skip external imports
    if (importPath.startsWith('npm:') ||
        importPath.startsWith('@') ||
        importPath.startsWith('react') ||
        !importPath.startsWith('.')) {
      continue;
    }

    const targetDomain = getDomain(importPath);
    if (!targetDomain) continue;

    // SHARED can be imported by everyone
    if (targetDomain === 'SHARED') continue;

    const allowed = domains[sourceDomain];
    if (!allowed || !allowed.includes(targetDomain)) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      violations.push({
        file: filePath,
        line: lineNum,
        importPath,
        sourceDomain,
        targetDomain,
        allowed: allowed || []
      });
    }
  }

  return violations;
}

function getAllFiles(dir) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getAllFiles(fullPath));
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

// Main execution
console.log('🔍 Checking domain boundaries...\n');

const files = getAllFiles(backendDir);
let totalViolations = 0;

for (const file of files) {
  const violations = checkFile(file);
  if (violations.length > 0) {
    totalViolations += violations.length;
    console.log(`❌ ${path.relative(process.cwd(), file)}`);
    for (const v of violations) {
      const allowedStr = v.allowed.length > 0 ? v.allowed.join(', ') : 'nothing';
      console.log(`   Line ${v.line}: Import from ${v.targetDomain}`);
      console.log(`   → ${v.sourceDomain} can only import from: ${allowedStr}\n`);
    }
  }
}

if (totalViolations === 0) {
  console.log('✅ No domain boundary violations found!');
  process.exit(0);
} else {
  console.log(`\n⚠️  Found ${totalViolations} domain boundary violation(s)`);
  process.exit(1);
}
