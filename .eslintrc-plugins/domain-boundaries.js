// ESLint plugin for enforcing domain boundary constraints
export default {
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
        // Domain dependency rules: each domain can only import from listed domains
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
          // Normalize path separators
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

        return {
          ImportDeclaration(node) {
            const sourceFile = context.getFilename();
            const importPath = node.source.value;

            // Skip external imports and node_modules
            if (importPath.startsWith('npm:') ||
                importPath.startsWith('@') ||
                importPath.startsWith('react') ||
                !importPath.startsWith('.')) {
              return;
            }

            const sourceDomain = getDomain(sourceFile);
            const targetDomain = getDomain(importPath);

            // Skip if either source or target domain couldn't be determined
            if (!sourceDomain || !targetDomain) return;

            // SHARED domain can be imported by everyone
            if (targetDomain === 'SHARED') return;

            // Check if import is allowed
            const allowed = domains[sourceDomain];
            if (!allowed || !allowed.includes(targetDomain)) {
              context.report({
                node,
                message: `Domain boundary violation: ${sourceDomain} cannot import from ${targetDomain}. ` +
                         `${sourceDomain} can only import from: ${allowed ? allowed.join(', ') : 'nothing (CORE domain)'}`
              });
            }
          }
        };
      }
    }
  }
};
